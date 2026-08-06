/**
 * dashboard/student-portal/app/api/user/me/completed-questions/route.ts
 * GET /api/user/me/completed-questions
 *
 * Returns all question IDs completed by the current student.
 * Used by roadmap/page.tsx to activate green checkmarks on completed questions.
 *
 * BUG-R9 / BUG-M6 FIX:
 *   roadmap/page.tsx was reading progressData?.completedQuestions but
 *   /api/progress returns [{topic, completed, total, percentage}] — not questionIds.
 *   This new route returns the actual { completedQuestions: [{ questionId }] } shape.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
// QuestionCompletion uses `export default` (not named export) — import accordingly
import QuestionCompletion from 'placeprep-backend/src/models/QuestionCompletion';
import mongoose from 'mongoose';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    const completions = await QuestionCompletion.find({
      studentId: new mongoose.Types.ObjectId(user.userId),
    }).select('questionId completedAt').lean();

    const completedQuestions = completions.map((c: any) => ({
      questionId: c.questionId.toString(),
      completedAt: c.completedAt,
    }));

    return successResponse({ completedQuestions });
  } catch (error) {
    return handleApiError(error);
  }
}
