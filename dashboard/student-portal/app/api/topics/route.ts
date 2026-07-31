import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import Question from 'placeprep-backend/src/models/Question';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireStudent(request);

    const topics = await Question.distinct('topics');
    // Ensure all strings and remove empty/null
    const validTopics = topics.filter(t => typeof t === 'string' && t.trim().length > 0).sort();

    return successResponse({ topics: validTopics });
  } catch (error) {
    return handleApiError(error);
  }
}
