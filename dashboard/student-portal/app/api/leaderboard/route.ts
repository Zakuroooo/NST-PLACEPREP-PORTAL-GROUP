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
import StudentProfile from 'placeprep-backend/src/models/StudentProfile';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const auth = await requireStudent(request);
    const { searchParams } = new URL(request.url);
    const batch = searchParams.get('batch') || undefined;
    // The client sends 'alltime' | 'monthly' | 'weekly', but studentService
    // matches on 'this-week' | 'this-month'. The period was also never passed
    // through, so every request fell into the unfiltered branch and "Monthly"
    // returned byte-identical all-time data. Normalize, then forward it.
    const rawPeriod = searchParams.get('period') || 'alltime';
    const servicePeriod =
      rawPeriod === 'monthly' || rawPeriod === 'this-month' ? 'this-month'
      : rawPeriod === 'weekly' || rawPeriod === 'this-week' ? 'this-week'
      : undefined;

    const since: Date | undefined =
      servicePeriod === 'this-month' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      : servicePeriod === 'this-week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : undefined;

    const leaderboard = await studentService.getLeaderboard(batch, servicePeriod);
    const withCurrentUser = leaderboard.map(entry => ({
      ...entry,
      isCurrentUser: entry.studentId === auth.userId
    }));

    // If current user is not in the top N, fetch their rank and append
    if (!withCurrentUser.some(entry => entry.isCurrentUser)) {
      // BUG-36 FIX: Use statically-imported StudentProfile (no more dynamic import)
      const currentUserProfile = await StudentProfile.findOne({ userId: auth.userId });
      
      if (currentUserProfile) {
        const filter: any = { xpTotal: { $gt: currentUserProfile.xpTotal || 0 } };
        if (batch) filter.batch = batch;
        if (since) filter.updatedAt = { $gte: since };
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
          // BUG-11 FIX: tasksCompleted and doubtsRaised from real data on StudentProfile
          tasksCompleted: currentUserProfile.questionsCompletedCount ?? 0,
          doubtsRaised: currentUserProfile.doubtsRaisedCount ?? 0,
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
