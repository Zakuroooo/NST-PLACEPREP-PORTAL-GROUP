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
 *   FIX: company._id from aggregate wrapped in new ObjectId (was plain object)
 *   FIX: E11000 duplicate key now returns 400 instead of 500
 *   FIX: question query errors are caught per-week and fall back gracefully
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
import mongoose from 'mongoose';

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

    // Check if already in roadmap (pre-check before hitting DB unique constraint)
    const existing = await roadmapRepository.findByStudentAndCompany(user.userId as any, safeSlug);
    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Company already in your roadmap' } },
        { status: 400 }
      );
    }

    // Look up the real company to get its _id and display name
    // NOTE: companyRepository.findBySlug uses MongoDB aggregation — returns a plain object,
    // NOT a Mongoose Document. Must wrap _id manually for Mongoose schema.
    const company = await companyRepository.findBySlug(safeSlug);
    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    // FIX: Aggregate returns plain object, string will be auto-cast by Mongoose
    const companyId = (company._id as any).toString();

    const userWeeks = Math.min(Math.max(Number(preparationWeeks) || 12, 4), 52);
    const { questionsPerWeek, minFrequency } = getRoadmapParams(userWeeks);

    // ── Build curriculum weeks from company's real topic frequency data ──
    const topicFrequency: Array<{ topicName: string; questionCount: number }> =
      (company as any).topicFrequency ?? [];

    // Pick the top N topics by question count (N = weeksCommitted)
    const topTopics = topicFrequency
      .filter(t => t.questionCount > 0)
      .sort((a, b) => b.questionCount - a.questionCount)
      .slice(0, userWeeks);

    const DEFAULT_TOPICS = [
      'Arrays', 'Strings', 'Dynamic Programming', 'Trees', 'Graphs',
      'Greedy', 'Binary Search', 'Hash Tables', 'Sorting', 'Two Pointers',
    ];
    const weekTopics = topTopics.length >= 2
      ? topTopics.map(t => t.topicName)
      : DEFAULT_TOPICS.slice(0, userWeeks);

    // Fill remaining weeks if company has fewer topics than weeks
    while (weekTopics.length < userWeeks) {
      weekTopics.push(DEFAULT_TOPICS[weekTopics.length % DEFAULT_TOPICS.length]);
    }

    // Build weeks — FIX: catch per-week question query failures gracefully
    const weeks = await Promise.all(weekTopics.map(async (t, i) => {
      const freqItem = topicFrequency.find(tf => tf.topicName === t);
      const originalCount = freqItem ? freqItem.questionCount : 10;

      let actualCount = 0;
      try {
        const result = await questionRepository.findMany({
          companySlug: safeSlug,
          topic: t,
          minFrequency,
          limit: 1, // only need total count
        });
        actualCount = result.total;
      } catch (_queryErr) {
        // If per-week question query fails, fall back to topicFrequency data
        actualCount = 0;
      }

      const cappedCount = Math.min(Math.max(actualCount, 0), questionsPerWeek);
      const finalCount = cappedCount > 0
        ? cappedCount
        : Math.min(Math.max(originalCount, 1), questionsPerWeek);

      return {
        weekNumber: i + 1,
        topicLabel: t,
        totalQuestions: finalCount,
        doneQuestions: 0,
        status: (i === 0 ? 'active' : 'locked') as 'active' | 'locked' | 'done',
        questionIds: [] as mongoose.Types.ObjectId[],
      };
    }));

    let newRoadmap;
    try {
      newRoadmap = await roadmapRepository.create({
        studentId: user.userId as any,
        companyId: companyId as any,
        companySlug: safeSlug,
        companyName: company.name,
        companyLogoUrl: (company as any).logoUrl || undefined,
        roleName: (typeof targetRole === 'string' && targetRole.trim()) ? targetRole.trim() : 'SDE-1',
        weeksCommitted: weeks.length,
        currentWeek: 1,
        pctComplete: 0,
        isActive: true,
        weeks,
      } as any);
    } catch (dbError: any) {
      // FIX: MongoDB duplicate key error (E11000) returns 500 by default — convert to 400
      if (dbError?.code === 11000) {
        return NextResponse.json(
          { success: false, error: { message: 'Company already in your roadmap' } },
          { status: 400 }
        );
      }
      // Log real error in dev so we can see Mongoose validation details
      if (process.env.NODE_ENV !== 'production') {
        console.error('[POST /api/user/me/roadmap] DB save error:', dbError?.message, JSON.stringify(dbError?.errors));
      }
      throw dbError;
    }

    return NextResponse.json(
      successResponse(newRoadmap, { status: 201, message: `${company.name} roadmap created!` } as any),
      { status: 201 }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[POST /api/user/me/roadmap] Unhandled error:', error);
    }
    return handleApiError(error);
  }
}
