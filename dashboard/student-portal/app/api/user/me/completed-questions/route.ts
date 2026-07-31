import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import QuestionCompletion from 'placeprep-backend/src/models/QuestionCompletion';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    const completions = await QuestionCompletion.find({ studentId: user.userId }).select('questionId').lean();
    
    return successResponse({ completedQuestions: completions });
  } catch (error) {
    return handleApiError(error);
  }
}
