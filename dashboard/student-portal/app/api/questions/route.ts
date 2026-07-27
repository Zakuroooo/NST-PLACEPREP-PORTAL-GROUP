/**
 * dashboard/student-portal/app/api/questions/route.ts
 * GET /api/questions — paginated questions with multi-filter.
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
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

    const { questions, total } = await questionRepository.findMany({
      companySlug: searchParams.get('company') || undefined,
      topic: searchParams.get('topic') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      roundType: searchParams.get('roundType') || undefined,
      page,
      limit,
    });

    return successResponse(questions, {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
