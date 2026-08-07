/**
 * dashboard/student-portal/app/api/dashboard/route.ts
 * GET /api/dashboard — student dashboard: stats + roadmaps + recent activity.
 *
 * Returns:
 *   { student, stats, roadmaps, recentActivity }
 *
 * Architecture: Route → Service → Repository → DB
 *
 * FIXES APPLIED:
 *   BUG-D2: Added fullName to student object
 *   BUG-D3: Added totalAssigned (real question count, not companiesOnRoadmap * 20)
 *   BUG-D5: Moved weeklyActivity INTO stats object (was at top level as recentActivity)
 *   BUG-T1: Each roadmap now includes _id, questions[], currentDay
 *   BUG-T2: companyName (not company) in roadmap objects
 *   BUG-T3: currentWeek + currentDay (both computed)
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { studentService } from 'placeprep-backend/src/services/student.service';
import { studentRepository } from 'placeprep-backend/src/repositories/student.repository';
import { roadmapRepository } from 'placeprep-backend/src/repositories/roadmap.repository';
import { questionRepository } from 'placeprep-backend/src/repositories/question.repository';
import QuestionCompletion from 'placeprep-backend/src/models/QuestionCompletion';
import mongoose from 'mongoose';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    // Get stats (xpTotal, streak, problemsSolved, prepScore, weeklyActivity, latestActivity)
    const stats = await studentService.getStats(user.userId);

    // BUG-D2 FIX: Get fullName from student profile
    const profile = await studentRepository.findByUserId(user.userId);

    // Get roadmaps for company card section
    const roadmapDocs = await roadmapRepository.findByStudentId(user.userId);

    // BUG-T1 FIX: For each roadmap, fetch today's questions from the active week
    const roadmaps = await Promise.all(roadmapDocs.map(async (r) => {
      // Find the currently active week
      const activeWeek = (r.weeks ?? []).find((w: any) => w.status === 'active');

      // Fetch top 5 questions from the active week's topic at this company
      let todayQs: any[] = [];
      if (activeWeek) {
        try {
          const topicLabel = activeWeek.topicLabel as string;

          console.log(`[DASHBOARD DEBUG] company=${r.companySlug} topicLabel="${topicLabel}" weeks=${r.weeks?.length}`);

          // Try 1: exact topic match (works when topicLabel === question's topic string)
          let result = await questionRepository.findMany({
            companySlug: r.companySlug,
            topic: topicLabel,
            limit: 20,
          });
          let questions = result?.questions ?? [];

          console.log(`[DASHBOARD DEBUG] topic match count=${questions.length}`);

          // Try 2: if exact match returns nothing, try any questions for this company
          // (topicLabel may not match DB topics — e.g. "Arrays" vs "array")
          if (questions.length === 0) {
            const fallback = await questionRepository.findMany({
              companySlug: r.companySlug,
              limit: 20,
            });
            questions = fallback?.questions ?? fallback ?? [];
            console.log(`[DASHBOARD DEBUG] fallback (no topic) count=${questions.length} for companySlug="${r.companySlug}"`);
          }

          // Get IDs of questions already completed by this student for this company
          const completedDocs = await QuestionCompletion.find({
            studentId: user.userId,
            companySlug: r.companySlug,
          }).select('questionId').lean();
          const completedSet = new Set(completedDocs.map((c: any) => c.questionId.toString()));

          // Show only incomplete questions, capped at 5
          const incompleteQs = (questions as any[]).filter((q: any) => !completedSet.has(q._id.toString()));
          console.log(`[DASHBOARD DEBUG] incomplete count=${incompleteQs.length}`);
          todayQs = incompleteQs.slice(0, 5).map((q: any) => ({
            id:          q._id.toString(),
            title:       q.problemSummary,
            difficulty:  q.difficulty,
            xp:          q.difficulty === 'Hard' ? 50 : q.difficulty === 'Medium' ? 25 : 10,
            leetcodeUrl: q.leetcodeUrl ?? null,
          }));
        } catch (err: any) {
          console.error(`[DASHBOARD DEBUG] error for ${r.companySlug}:`, err?.message);
          todayQs = [];
        }
      } else {
        console.log(`[DASHBOARD DEBUG] NO activeWeek for company=${r.companySlug} weeks=${JSON.stringify((r.weeks ?? []).map((w: any) => ({ num: w.weekNumber, status: w.status })))}`);
      }

      // Compute current day within the week from doneQuestions
      const questionsPerDay = Math.ceil((activeWeek?.totalQuestions ?? 7) / 7);
      const currentDay = Math.min(
        7,
        Math.ceil((activeWeek?.doneQuestions ?? 0) / Math.max(questionsPerDay, 1)) + 1
      );

      return {
        _id:            r._id.toString(),        // BUG-T4 FIX: roadmapId needed for completeQuestion()
        companySlug:    r.companySlug,
        companyName:    r.companyName,           // BUG-T2 FIX: was co.company (undefined), now co.companyName
        companyLogoUrl: r.companyLogoUrl ?? null,
        roleName:       r.roleName,
        pctComplete:    r.pctComplete,
        currentWeek:    r.currentWeek,           // BUG-T3 FIX: was co.week, now co.currentWeek
        currentDay,                               // BUG-T3 FIX: was co.day (never existed), now computed
        weeksCommitted: r.weeksCommitted,
        isActive:       r.isActive,
        questions:      todayQs,                 // BUG-T1 FIX: THE MAIN MISSING PIECE — was always empty
      };
    }));

    // BUG-D3 FIX: Compute real total assigned questions across all roadmaps
    const totalAssigned = roadmapDocs.reduce(
      (sum: number, r: any) => sum + (r.weeks ?? []).reduce((s: number, w: any) => s + (w.totalQuestions ?? 0), 0),
      0
    );

    // Student summary for header section
    const student = {
      fullName: profile?.fullName ?? null,      // BUG-D2 FIX: added fullName
      xp:     stats.xpTotal,
      streak: stats.currentStreakDays,
      solved: stats.problemsSolved,
      score:  stats.prepScore,
      onboardingComplete: stats.onboardingComplete,
    };

    return successResponse({
      student,
      stats: {
        xpTotal:           stats.xpTotal,
        currentStreakDays:  stats.currentStreakDays,
        // BUG-PR1 FIX: expose real bestStreakDays from DB (was Math.max(currentStreak, 5) on frontend)
        bestStreakDays:     profile?.bestStreakDays ?? stats.currentStreakDays ?? 0,
        problemsSolved:    stats.problemsSolved,
        prepScore:         stats.prepScore,
        companiesOnRoadmap: roadmaps.length,
        totalAssigned,                           // BUG-D3 FIX: real total questions, not count*20
        weeklyActivity:    stats.weeklyActivity, // BUG-D5 FIX: moved INTO stats (was at top-level recentActivity)
        latestActivity:    stats.latestActivity, // also moved here for consistency
      },
      roadmaps,
      // Keep recentActivity for backwards compatibility (but stats.weeklyActivity is the fix)
      recentActivity: stats.weeklyActivity,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
