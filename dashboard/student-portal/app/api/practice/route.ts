/**
 * dashboard/student-portal/app/api/practice/route.ts
 * GET /api/practice — practice zone: questions filtered by topic/difficulty/company.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { questionRepository } from 'placeprep-backend/src/repositories/question.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireStudent(request);

    const { searchParams } = new URL(request.url);
    const topic      = searchParams.get('topic')      || undefined;
    const difficulty = searchParams.get('difficulty') || undefined;
    const roundType  = searchParams.get('roundType')  || undefined;
    const companySlug = searchParams.get('company')   || undefined;
    const page  = Math.max(1, Number(searchParams.get('page'))  || 1);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

    const { questions, total } = await questionRepository.findMany({
      topic,
      difficulty,
      roundType,
      companySlug,
      page,
      limit,
    });

    return successResponse(questions, {
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
