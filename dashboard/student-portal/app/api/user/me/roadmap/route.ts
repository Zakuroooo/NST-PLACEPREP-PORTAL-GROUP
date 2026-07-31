/**
 * dashboard/student-portal/app/api/user/me/roadmap/route.ts
 * GET  /api/user/me/roadmap — student's full roadmap with week-by-week breakdown.
 * POST /api/user/me/roadmap — add a company roadmap for the student.
 *
 * Architecture: Route → Service → Repository → DB
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

    // ── Build curriculum weeks from the company's real topic frequency data ──
    const topicFrequency: Array<{ topicName: string; questionCount: number }> =
      (company as any).topicFrequency ?? [];

    const userWeeks = Math.min(Math.max(Number(preparationWeeks) || 12, 4), 52);
    const resolvedRole = targetRole || 'SDE-1';

    // Set frequency threshold and questions-per-week by duration
    let minFreq = 0.0;
    let questionsPerWeek = 5;
    if (userWeeks <= 4) { minFreq = 0.6; questionsPerWeek = 15; }
    else if (userWeeks <= 6) { minFreq = 0.4; questionsPerWeek = 12; }
    else if (userWeeks <= 8) { minFreq = 0.25; questionsPerWeek = 10; }
    else if (userWeeks <= 12) { minFreq = 0.1; questionsPerWeek = 7; }

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

    const weeks = [];
    for (let i = 0; i < weekTopics.length; i++) {
      const topic = weekTopics[i];
      
      const { questions } = await questionRepository.findMany({
        companySlug: safeSlug,
        topic: topic,
        role: resolvedRole,
        minFrequency: minFreq,
        limit: questionsPerWeek,
      } as any);

      weeks.push({
        weekNumber: i + 1,
        topicLabel: topic,
        totalQuestions: questions.length,
        doneQuestions: 0,
        status: i === 0 ? 'active' : 'locked',
        questionIds: questions.map(q => q._id),
      });
    }

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
