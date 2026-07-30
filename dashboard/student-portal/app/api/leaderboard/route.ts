/**
 * dashboard/student-portal/app/api/leaderboard/route.ts
 * GET /api/leaderboard — XP leaderboard, optional batch filter.
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
    const auth = await requireStudent(request);
    const { searchParams } = new URL(request.url);
    const batch = searchParams.get('batch') || undefined;
    const leaderboard = await studentService.getLeaderboard(batch);
    const withCurrentUser = leaderboard.map(entry => ({
      ...entry,
      isCurrentUser: entry.studentId === auth.userId
    }));
    return successResponse(withCurrentUser);
  } catch (error) {
    return handleApiError(error);
  }
}
