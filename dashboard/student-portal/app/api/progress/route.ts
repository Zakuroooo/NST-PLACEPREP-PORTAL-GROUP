/**
 * dashboard/student-portal/app/api/progress/route.ts
 * GET /api/progress — topic-wise question completion percentage for the logged-in student.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { studentService } from 'placeprep-backend/src/services/student.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const progress = await studentService.getTopicProgress(user.userId);
    return successResponse(progress);
  } catch (error) {
    return handleApiError(error);
  }
}
