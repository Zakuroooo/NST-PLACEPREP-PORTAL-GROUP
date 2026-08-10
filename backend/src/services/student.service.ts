/**
 * backend/src/services/student.service.ts
 * Business logic for student portal features.
 */

import { studentRepository } from '../repositories/student.repository';
import { roadmapRepository } from '../repositories/roadmap.repository';
import { companyRepository } from '../repositories/company.repository';
import { questionRepository } from '../repositories/question.repository';
import { roadmapService } from './roadmap.service';
import { notificationRepository } from '../repositories/notification.repository';
import { doubtRepository } from '../repositories/doubt.repository';
import { sessionRepository } from '../repositories/session.repository';
import QuestionCompletion from '../models/QuestionCompletion';
import StudentProfile from '../models/StudentProfile';
import { ApiError } from '../utils/apiError';
import mongoose from 'mongoose';
import type { OnboardingInput } from '../validators/student.validator';

const XP_BY_DIFFICULTY: Record<string, number> = {
  Easy: 10,
  Medium: 25,
  Hard: 50,
};

export const studentService = {
  async getProfile(userId: string) {
    let profile = await studentRepository.findByUserId(userId);
    if (!profile) {
      // Auto-create default profile for robustness to prevent 404s
      const user = await import('../repositories/user.repository').then(m => m.userRepository.findById(userId));
      if (!user) throw ApiError.notFound('User not found');
      
      profile = await studentRepository.create({
        userId: new mongoose.Types.ObjectId(userId),
        fullName: user.email.split('@')[0],
        batch: '2024',
        branch: 'CS & AI',
        year: '3rd',
        onboardingComplete: false,
        placementStatus: 'IN_PROGRESS',
      } as never);
    }
    return profile;
  },

  async updateProfile(userId: string, data: Record<string, unknown>) {
    const profile = await studentRepository.updateByUserId(userId, data);
    if (!profile) throw ApiError.notFound('Student profile');
    return profile;
  },

  async getStats(userId: string) {
    let profile = await studentRepository.findByUserId(userId);
    if (!profile) {
      profile = await this.getProfile(userId); // Use the robust getProfile
    }

    const [roadmaps, problemsSolved] = await Promise.all([
      roadmapRepository.findByStudentId(userId),
      QuestionCompletion.countDocuments({
        studentId: new mongoose.Types.ObjectId(userId),
      }),
    ]);

    // BUG-FIX A3: align prepScore formula with frontend breakdown bars (single source of truth)
    // old formula used different denominators (1500 XP, 80 problems) causing ring vs. bars mismatch
    const totalAssigned = roadmaps.reduce(
      (sum, r) => sum + (r.weeks ?? []).reduce((s, w) => s + (w.totalQuestions ?? 0), 0), 0
    );
    const practiceScore = Math.min((problemsSolved / Math.max(totalAssigned, 1)) * 100, 100) * 0.45;
    const streakScore   = Math.min((profile.currentStreakDays / 30) * 100, 100) * 0.30;
    const xpScore       = Math.min((profile.xpTotal / 5000) * 100, 100) * 0.25;
    const prepScore     = Math.round(practiceScore + streakScore + xpScore);

    // 30-day activity chart
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activity = await QuestionCompletion.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(userId),
          completedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: 'Asia/Kolkata' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const weeklyActivity = activity.map((a: { _id: string; count: number }) => ({
      date: a._id,
      count: a.count,
    }));

    // Get latest activity
    const latestCompletion = await QuestionCompletion.findOne({
      studentId: new mongoose.Types.ObjectId(userId)
    })
    .sort({ completedAt: -1 })
    .populate('questionId', 'title problemSummary');

    let latestActivity = null;
    if (latestCompletion && latestCompletion.questionId) {
      latestActivity = {
        title: (latestCompletion.questionId as any).problemSummary, // BUG-D4 FIX: Question has no .title field
        completedAt: latestCompletion.completedAt,
      };
    }

    return {
      xpTotal: profile.xpTotal,
      currentStreakDays: profile.currentStreakDays,
      problemsSolved,
      prepScore,
      companiesOnRoadmap: roadmaps.length,
      weeklyActivity,
      onboardingComplete: profile.onboardingComplete,
      latestActivity,
    };
  },

  async completeOnboarding(userId: string, data: OnboardingInput) {
    const profile = await studentRepository.findByUserId(userId);
    if (!profile) throw ApiError.notFound('Student profile');

    // Update profile with onboarding data
    await studentRepository.updateByUserId(userId, {
      targetDomains: data.targetDomains,
      targetCategories: data.targetCategories as never,
      topicSelfRatings: new Map(Object.entries(data.topicSelfRatings)),
      targetCompanySlugs: data.targetCompanySlugs,
      prepWeeksCommitted: data.prepWeeksCommitted,
      onboardingComplete: true,
      onboardingCompletedAt: new Date(),
    });

    // Create roadmaps for each target company (max 3 to start)
    const companies = await companyRepository.findBySlugs(
      data.targetCompanySlugs.slice(0, 3)
    );

    for (const company of companies) {
      // Check if roadmap already exists
      const existing = await roadmapRepository.findByStudentAndCompany(
        userId,
        company.slug
      );
      if (existing) continue;

      // Phase 2: unified week builder — self-ratings affect order; questionIds populated
      const totalWeeks = data.prepWeeksCommitted;
      const weeks = await roadmapService.buildWeeks({
        companySlug: company.slug,
        targetRole: data.targetRole,
        prepWeeks: totalWeeks,
        topicSelfRatings: data.topicSelfRatings,
      });

      await roadmapRepository.create({
        studentId: new mongoose.Types.ObjectId(userId),
        companyId: company._id,
        companySlug: company.slug,
        companyName: company.name,
        companyLogoUrl: company.logoUrl,
        roleName: data.targetRole,
        weeksCommitted: weeks.length,
        currentWeek: 1,
        pctComplete: 0,
        isActive: true,
        weeks,
        selfRatingsSnapshot: new Map(Object.entries(data.topicSelfRatings)),
      } as never);
    }

    // XP reward for completing onboarding
    await studentRepository.addXp(userId, 100);
    // BUG-FIX F2: removed 'xp' bell notification — XP feedback is toast-only

    return { success: true, xpAwarded: 100 }; // BUG-FIX F2
  },

  async completeQuestion(
    userId: string,
    questionId: string,
    roadmapId?: string
  ) {
    const question = await questionRepository.findById(questionId);
    if (!question) throw ApiError.notFound('Question');

    const oid = new mongoose.Types.ObjectId(userId);
    const qid = new mongoose.Types.ObjectId(questionId);

    // If already completed, return idempotently — do NOT throw.
    // Previously this threw ApiError.conflict which caused the UI checkbox to roll back
    // even when the question WAS completed (after page refresh, re-click = conflict = unchecked).
    const existing = await QuestionCompletion.findOne({ studentId: oid, questionId: qid });
    if (existing) {
      return { xpEarned: existing.xpEarned ?? 0, totalXp: 0, alreadyCompleted: true };
    }

    const xpEarned = XP_BY_DIFFICULTY[question.difficulty] || 10;

    // Atomic: save completion + add XP
    await Promise.all([
      QuestionCompletion.create({
        studentId: oid,
        questionId: qid,
        roadmapId: roadmapId ? new mongoose.Types.ObjectId(roadmapId) : undefined,
        companySlug: question.companySlug,
        difficulty: question.difficulty,
        xpEarned,
      }),
      studentRepository.addXp(userId, xpEarned),
    ]);

    // Update roadmap week progress if roadmapId provided
    if (roadmapId) {
      const roadmap = await roadmapRepository.findById(roadmapId);
      if (roadmap) {
        const activeWeek = roadmap.weeks.find((w) => w.status === 'active');
        if (activeWeek) {
          await roadmapRepository.incrementWeekProgress(roadmapId, activeWeek.weekNumber);
        }
      }
    }

    // B18 FIX: Update streak based on IST date of last activity
    try {
      const profile = await StudentProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (profile) {
        const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const todayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());

        let newStreak = 1; // default: start/reset streak
        if (profile.lastActiveAt) {
          const lastIST = new Date(profile.lastActiveAt.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const lastDayIST = new Date(lastIST.getFullYear(), lastIST.getMonth(), lastIST.getDate());
          const diffDays = Math.round((todayIST.getTime() - lastDayIST.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 0) {
            // Solved another question today — keep current streak
            newStreak = profile.currentStreakDays || 1;
          } else if (diffDays === 1) {
            // Solved yesterday → increment streak
            newStreak = (profile.currentStreakDays || 0) + 1;
          } else {
            // Gap > 1 day → streak resets to 1
            newStreak = 1;
          }
        }
        await studentRepository.updateStreak(userId, newStreak);
      }
    } catch (_streakErr) {
      // Streak update failure should never block the completion response
    }

    // B14 FIX: Removed XP persistent notification — XP feedback is toast-only in the UI
    // (previously this created a permanent notification in the bell for every solved question)

    return { xpEarned, totalXp: 0 }; // totalXp fetched fresh by client
  },

  async uncompleteQuestion(userId: string, questionId: string): Promise<void> {
    const oid = new mongoose.Types.ObjectId(userId);
    const qid = new mongoose.Types.ObjectId(questionId);

    // Find the completion record
    const completion = await QuestionCompletion.findOne({ studentId: oid, questionId: qid });
    if (!completion) return; // already not completed, nothing to do

    const xpToDeduct = completion.xpEarned ?? 0;

    // Remove completion record + deduct XP atomically
    await Promise.all([
      QuestionCompletion.deleteOne({ studentId: oid, questionId: qid }),
      StudentProfile.findOneAndUpdate(
        { userId },
        { $inc: { xpTotal: -xpToDeduct } }
      ),
    ]);

    // If this question was part of a roadmap, decrement doneQuestions
    if (completion.roadmapId) {
      const roadmap = await import('../models/UserRoadmap').then(m => m.default);
      const rm = await roadmap.findById(completion.roadmapId);
      if (rm) {
        // Find the week this question belonged to (by companySlug match)
        const activeWeek = rm.weeks.find((w: any) => w.status === 'active' || w.status === 'done');
        if (activeWeek && activeWeek.doneQuestions > 0) {
          activeWeek.doneQuestions -= 1;
          // If week was marked done but now has undone questions, reactivate it
          if (activeWeek.status === 'done' && activeWeek.doneQuestions < activeWeek.totalQuestions) {
            activeWeek.status = 'active';
          }
          // Recalculate pctComplete
          const totalQ = rm.weeks.reduce((acc: number, w: any) => acc + w.totalQuestions, 0);
          const doneQ = rm.weeks.reduce((acc: number, w: any) => acc + w.doneQuestions, 0);
          rm.pctComplete = totalQ > 0 ? Math.round((doneQ / totalQ) * 100) : 0;
          await rm.save();
        }
      }
    }
  },

  async getLeaderboard(batch?: string, period?: string) {
    // Build period filter for xpTotal aggregation if needed
    let sinceDate: Date | undefined;
    if (period === 'this-week') {
      sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'this-month') {
      sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    let profiles;
    if (sinceDate) {
      // Period-filtered: rank by questions completed in the window
      const filter: Record<string, unknown> = {};
      if (batch) filter.batch = batch;
      const all = await StudentProfile.find(filter).lean();
      // Score = XP earned from question completions in the window
      const scored = await Promise.all(
        all.map(async (p) => {
          const count = await QuestionCompletion.countDocuments({
            studentId: p.userId,  // QuestionCompletion refs User, not StudentProfile
            completedAt: { $gte: sinceDate },
          });
          return { profile: p, score: count };
        })
      );
      scored.sort((a, b) => b.score - a.score);
      profiles = scored.slice(0, 100).map((s) => s.profile);
    } else {
      profiles = await studentRepository.getLeaderboard(batch, 100);
    }

    // Batch-fetch doubts + session counts to avoid N+1
    const profileIds = profiles.map((p) => p._id.toString());
    const [doubtCounts, sessionCounts] = await Promise.all([
      Promise.all(profileIds.map((id) => doubtRepository.countByStudentIdAndStatus(id))),
      Promise.all(profileIds.map((id) => sessionRepository.countByStudentId(id))),
    ]);

    return profiles.map((p, i) => {
      const nameParts = (p.fullName || '').trim().split(' ');
      const initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : (p.fullName?.slice(0, 2) ?? 'ST').toUpperCase();
      return {
        rank: i + 1,
        studentId: p.userId.toString(),
        name: p.fullName,
        initials,
        batch: p.batch,
        branch: p.branch,
        xp: p.xpTotal ?? 0,
        tasksCompleted: sessionCounts[i] ?? 0,
        doubtsRaised: doubtCounts[i] ?? 0,
        placementStatus: p.placementStatus,
      };
    });
  },

  /**
   * Topic-wise question completion percentage.
   * BUG-FIX D2: accepts optional companySlugs to scope denominators to the student's roadmap
   * Returns an array like: [{ topic, completed, total, percentage }]
   */
  async getTopicProgress(userId: string, companySlugs?: string[]) {
    // BUG-FIX D2: if student has no roadmap companies, return empty immediately
    if (companySlugs !== undefined && companySlugs.length === 0) return [];

    const studentObjId = new mongoose.Types.ObjectId(userId);
    const slugFilter = companySlugs?.length
      ? [{ $match: { companySlug: { $in: companySlugs } } }]
      : [];

    // Aggregate completions by topic via lookup
    const result = await QuestionCompletion.aggregate([
      // BUG-FIX D2: filter completions to roadmap companies first (no extra DB round-trip)
      ...slugFilter,
      { $match: { studentId: studentObjId } },
      {
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question',
        },
      },
      { $unwind: '$question' },
      { $unwind: '$question.topics' },
      {
        $group: {
          _id: '$question.topics',
          completed: { $sum: 1 },
        },
      },
    ]);

    // Get total questions per topic — BUG-FIX D2: scoped to roadmap company slugs
    const totals = await QuestionCompletion.db
      .collection('questions')
      .aggregate([
        // BUG-FIX D2: filter to roadmap companies so denominator reflects only assigned questions
        ...(slugFilter.length ? [{ $match: { companySlug: { $in: companySlugs } } }] : []),
        { $unwind: '$topics' },
        { $group: { _id: '$topics', total: { $sum: 1 } } },
      ])
      .toArray();

    const totalMap = new Map<string, number>(
      (totals as { _id: string; total: number }[]).map((t) => [t._id, t.total])
    );

    return result.map((r: { _id: string; completed: number }) => ({
      topic: r._id,
      completed: r.completed,
      total: totalMap.get(r._id) ?? 0,
      percentage:
        totalMap.get(r._id)
          ? Math.round((r.completed / totalMap.get(r._id)!) * 100)
          : 0,
    }));
  },

  async resetOnboarding(userId: string) {
    await studentRepository.updateByUserId(userId, { onboardingComplete: false });
    return { success: true };
  },

  async resetRoadmap(userId: string) {
    await roadmapRepository.deleteByStudentId(userId);
    return { success: true };
  },

  async deleteRoadmap(userId: string, companySlug: string) {
    await roadmapRepository.deleteByStudentAndCompany(userId, companySlug);
    return { success: true };
  },
};
