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

    // If current user is not in the top N, fetch their rank and append
    if (!withCurrentUser.some(entry => entry.isCurrentUser)) {
      const StudentProfile = (await import('placeprep-backend/src/models/StudentProfile')).default;
      const currentUserProfile = await StudentProfile.findOne({ userId: auth.userId });
      
      if (currentUserProfile) {
        const filter: any = { xpTotal: { $gt: currentUserProfile.xpTotal || 0 } };
        if (batch) filter.batch = batch;
        const rank = await StudentProfile.countDocuments(filter) + 1;
        
        const nameParts = (currentUserProfile.fullName || '').trim().split(' ');
        const initials = nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : (currentUserProfile.fullName?.slice(0, 2) ?? 'ST').toUpperCase();
          
        withCurrentUser.push({
          rank,
          studentId: currentUserProfile.userId.toString(),
          name: currentUserProfile.fullName,
          initials,
          batch: currentUserProfile.batch,
          branch: currentUserProfile.branch,
          xp: currentUserProfile.xpTotal ?? 0,
          tasksCompleted: 0,
          doubtsRaised: 0,
          placementStatus: currentUserProfile.placementStatus,
          isCurrentUser: true
        });
      }
    }

    return successResponse(withCurrentUser);
  } catch (error) {
    return handleApiError(error);
  }
}
