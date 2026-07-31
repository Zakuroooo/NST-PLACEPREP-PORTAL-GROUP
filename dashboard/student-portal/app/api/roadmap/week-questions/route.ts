import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { questionRepository } from 'placeprep-backend/src/repositories/question.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireStudent(request);

    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company');
    const topic = searchParams.get('topic');
    const limitParam = searchParams.get('limit');
    
    if (!company || !topic) {
      throw ApiError.badRequest('company and topic are required');
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    
    const { questions } = await questionRepository.findMany({
      companySlug: company,
      topic,
      limit,
    });

    return successResponse(questions);
  } catch (error) {
    return handleApiError(error);
  }
}
