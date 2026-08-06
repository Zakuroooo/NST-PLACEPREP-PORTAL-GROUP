/**
 * dashboard/student-portal/app/api/user/me/roadmap/route.ts
 * GET  /api/user/me/roadmap — student's full roadmap with week-by-week breakdown.
 * POST /api/user/me/roadmap — add a company roadmap for the student.
 *
 * Architecture: Route → Service → Repository → DB
 *
 * FIXES APPLIED:
 *   BUG-R2: questionsPerWeek now scales with preparationWeeks duration
 *   BUG-R4: minFrequency threshold applied — shorter plans show only hottest questions
 *   Section 13 of audit: Full roadmap generation algorithm implemented
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { roadmapRepository } from 'placeprep-backend/src/repositories/roadmap.repository';
import { companyRepository } from 'placeprep-backend/src/repositories/company.repository';
import { questionRepository } from 'placeprep-backend/src/repositories/question.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from 'placeprep-backend/src/utils/rateLimiter';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const roadmaps = await roadmapRepository.findByStudentId(user.userId);
    return successResponse(roadmaps);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * BUG-R2 FIX: Compute questionsPerWeek and minFrequency based on prep duration.
 * Shorter plans = more intense (fewer but hotter questions per week).
 * Longer plans  = broader coverage (more questions, lower frequency bar).
 *
 * Aligns with Section 13 of the audit report:
 *   4-week:  15 q/week, minFreq 0.6 (top 40% most asked)
 *   6-week:  12 q/week, minFreq 0.4
 *   8-week:  10 q/week, minFreq 0.25
 *   12-week:  7 q/week, minFreq 0.1
 *   16+week:  5 q/week, minFreq 0.0 (everything)
 */
function getRoadmapParams(weeks: number): { questionsPerWeek: number; minFrequency: number } {
  if (weeks <= 4)  return { questionsPerWeek: 15, minFrequency: 0.6 };
  if (weeks <= 6)  return { questionsPerWeek: 12, minFrequency: 0.4 };
  if (weeks <= 8)  return { questionsPerWeek: 10, minFrequency: 0.25 };
  if (weeks <= 12) return { questionsPerWeek: 7,  minFrequency: 0.1 };
  return             { questionsPerWeek: 5,  minFrequency: 0.0 };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit roadmap creation to prevent spam
  const ip = getClientIp(request);
  const rl = checkRateLimit(`roadmap:write:${ip}`, RATE_LIMITS.WRITE);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' } },
      { status: 429 }
    );
  }

  try {
    await connectDB();
    const user = await requireStudent(request);
    const body = await request.json();
    const { companySlug, targetRole, preparationWeeks } = body;

    // Validate required fields
    if (!companySlug || typeof companySlug !== 'string') {
      throw ApiError.badRequest('companySlug is required');
    }

    // Sanitize slug — only lowercase alphanumeric and hyphens
    const safeSlug = companySlug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (safeSlug !== companySlug.toLowerCase()) {
      throw ApiError.badRequest('Invalid companySlug format');
    }

    // Check if already in roadmap
    const existing = await roadmapRepository.findByStudentAndCompany(user.userId as any, safeSlug);
    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Company already in your roadmap' } },
        { status: 400 }
      );
    }

    // Look up the real company to get its _id and display name
    const company = await companyRepository.findBySlug(safeSlug);
    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    const userWeeks = Math.min(Math.max(Number(preparationWeeks) || 12, 4), 52);

    // BUG-R2 FIX: Get duration-specific params (was always Math.min(count, 20) regardless)
    const { questionsPerWeek, minFrequency } = getRoadmapParams(userWeeks);

    // ── Build curriculum weeks from company's real topic frequency data ──
    const topicFrequency: Array<{ topicName: string; questionCount: number }> =
      (company as any).topicFrequency ?? [];

    // Pick the top N topics by question count (N = weeksCommitted)
    const topTopics = topicFrequency
      .filter(t => t.questionCount > 0)
      .sort((a, b) => b.questionCount - a.questionCount)
      .slice(0, userWeeks);

    const DEFAULT_TOPICS = ['Arrays', 'Strings', 'Dynamic Programming', 'Trees', 'Graphs', 'Greedy', 'Binary Search', 'Hash Tables', 'Sorting', 'Two Pointers'];
    const weekTopics = topTopics.length >= 2 ? topTopics.map(t => t.topicName) : DEFAULT_TOPICS.slice(0, userWeeks);

    // Fill remaining weeks if company has fewer topics than weeks
    while (weekTopics.length < userWeeks) {
      weekTopics.push(DEFAULT_TOPICS[weekTopics.length % DEFAULT_TOPICS.length]);
    }

    // BUG-R2 FIX: Build weeks with proper questionsPerWeek cap and actual question counts
    // We now query the DB to count HOW MANY questions actually meet the frequency threshold
    // so that totalQuestions reflects reality, not just topicFrequency.questionCount
    const weeks = await Promise.all(weekTopics.map(async (t, i) => {
      // Find original frequency item to get raw question count
      const freqItem = topicFrequency.find(tf => tf.topicName === t);
      const originalCount = freqItem ? freqItem.questionCount : 10;

      // Count actual questions with frequency threshold applied
      const { total: actualCount } = await questionRepository.findMany({
        companySlug: safeSlug,
        topic: t,
        minFrequency,
        limit: 1, // we only need the count
      });

      // Cap at questionsPerWeek from the duration formula
      const cappedCount = Math.min(Math.max(actualCount, 0), questionsPerWeek);
      // If no questions found at this threshold, try with 0 frequency (fallback)
      const finalCount = cappedCount > 0 ? cappedCount : Math.min(originalCount, questionsPerWeek);

      return {
        weekNumber: i + 1,
        topicLabel: t,
        // BUG-R2 FIX: was Math.min(t.questionCount, 20) — now uses duration-aware limit
        totalQuestions: finalCount,
        doneQuestions: 0,
        status: i === 0 ? 'active' : 'locked',
      };
    }));

    const actualWeeks = weeks.length;

    const newRoadmap = await roadmapRepository.create({
      studentId: user.userId as any,
      companyId: company._id as any,
      companySlug: safeSlug,
      companyName: company.name,
      roleName: targetRole || 'SDE-1',
      weeksCommitted: actualWeeks,
      currentWeek: 1,
      pctComplete: 0,
      isActive: true,
      weeks,
    } as any);

    return NextResponse.json(
      successResponse(newRoadmap, { status: 201, message: `${company.name} roadmap created!` }),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
