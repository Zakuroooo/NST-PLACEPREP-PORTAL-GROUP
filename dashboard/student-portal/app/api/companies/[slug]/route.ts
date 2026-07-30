/**
 * dashboard/student-portal/app/api/companies/[slug]/route.ts
 * GET /api/companies/[slug] — full company profile.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { companyRepository } from 'placeprep-backend/src/repositories/company.repository';
import { questionRepository } from 'placeprep-backend/src/repositories/question.repository';
import { experienceRepository } from 'placeprep-backend/src/repositories/experience.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    await requireStudent(request);

    const { slug } = await params;
    const company = await companyRepository.findBySlug(slug);
    if (!company) throw ApiError.notFound('Company');

    // Fetch related questions and verified experiences in parallel
    const [{ questions }, { experiences }] = await Promise.all([
      questionRepository.findMany({ companySlug: slug, limit: 10 }),
      experienceRepository.findAll({ companySlug: slug, verified: true, limit: 5 }),
    ]);

    return successResponse({ ...company, questions, experiences });
  } catch (error) {
    return handleApiError(error);
  }
}
