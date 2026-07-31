/**
 * dashboard/student-portal/app/api/dashboard/route.ts
 * GET /api/dashboard — student dashboard: stats + roadmaps + recent activity.
 *
 * Returns:
 *   { student, stats, roadmaps, recentActivity }
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { studentService } from 'placeprep-backend/src/services/student.service';
import { roadmapRepository } from 'placeprep-backend/src/repositories/roadmap.repository';
import { studentRepository } from 'placeprep-backend/src/repositories/student.repository';
import { questionRepository } from 'placeprep-backend/src/repositories/question.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    // Get stats (xpTotal, streak, problemsSolved, prepScore, weeklyActivity)
    const stats = await studentService.getStats(user.userId);

    // Get roadmaps for company card section and today's tasks
    const roadmapDocs = await roadmapRepository.findByStudentId(user.userId);
    const roadmaps = [];
    
    let totalAssigned = 0;

    for (const r of roadmapDocs) {
      const activeWeek = r.weeks.find((w) => w.weekNumber === r.currentWeek) || r.weeks[0];
      
      // Calculate total assigned questions for this roadmap
      totalAssigned += r.weeks.reduce((acc, w) => acc + w.totalQuestions, 0);
      
      let topQuestions: any[] = [];
      if (activeWeek) {
        const { questions } = await questionRepository.findMany({
          companySlug: r.companySlug,
          topic: activeWeek.topicLabel,
          limit: 5
        } as any);
        topQuestions = questions;
      }

      roadmaps.push({
        _id:            r._id,
        companySlug:    r.companySlug,
        companyName:    r.companyName,
        company:        r.companyName, // For backwards compatibility
        companyLogoUrl: r.companyLogoUrl ?? null,
        roleName:       r.roleName,
        pctComplete:    r.pctComplete,
        currentWeek:    r.currentWeek,
        week:           r.currentWeek, // For backwards compatibility
        currentDay:     Math.min(Math.max(activeWeek?.doneQuestions || 1, 1), 7), // mock current day
        day:            Math.min(Math.max(activeWeek?.doneQuestions || 1, 1), 7),
        weeksCommitted: r.weeksCommitted,
        isActive:       r.isActive,
        questions:      topQuestions.map(q => ({
          id: q._id,
          title: q.problemSummary,
          difficulty: q.difficulty,
          xp: q.xpValue,
          topic: activeWeek?.topicLabel,
        }))
      });
    }

    const studentProfile = await studentRepository.findByUserId(user.userId);

    // Student summary for header section
    const student = {
      fullName: studentProfile?.fullName || 'Student',
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
        bestStreakDays:    studentProfile?.bestStreakDays || stats.currentStreakDays || 0,
        problemsSolved:    stats.problemsSolved,
        prepScore:         stats.prepScore,
        companiesOnRoadmap: roadmaps.length,
        totalAssigned:     totalAssigned,
      },
      roadmaps,
      recentActivity: stats.weeklyActivity,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
