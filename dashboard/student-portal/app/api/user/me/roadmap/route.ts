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

    const newRoadmap = await roadmapRepository.create({
      studentId: user.userId as any,
      companyId: company._id as any,   // real company _id from DB
      companySlug: safeSlug,
      companyName: company.name,        // real company name from DB
      roleName: targetRole || 'SDE-1',
      weeksCommitted: Math.min(Math.max(Number(preparationWeeks) || 12, 4), 52),
      currentWeek: 1,
      pctComplete: 0,
      isActive: true,
      weeks: [
        {
          weekNumber: 1,
          topicLabel: 'Arrays & Strings',
          totalQuestions: 10,
          doneQuestions: 0,
          status: 'active',
        },
      ],
    } as any);

    return NextResponse.json(
      successResponse(newRoadmap, { status: 201, message: `${company.name} roadmap created!` }),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
