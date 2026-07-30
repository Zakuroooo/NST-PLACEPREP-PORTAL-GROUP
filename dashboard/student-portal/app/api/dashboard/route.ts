/**
 * dashboard/student-portal/app/api/dashboard/route.ts
 * GET /api/dashboard — student dashboard: stats + roadmaps + recent activity.
 *
 * Returns:
 *   { student, stats, roadmaps, recentActivity }
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { studentService } from 'placeprep-backend/src/services/student.service';
import { roadmapRepository } from 'placeprep-backend/src/repositories/roadmap.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    // Get stats (xpTotal, streak, problemsSolved, prepScore, weeklyActivity)
    const stats = await studentService.getStats(user.userId);

    // Get roadmaps for company card section
    const roadmapDocs = await roadmapRepository.findByStudentId(user.userId);
    const roadmaps = roadmapDocs.map((r) => ({
      companySlug:    r.companySlug,
      companyName:    r.companyName,
      companyLogoUrl: r.companyLogoUrl ?? null,
      roleName:       r.roleName,
      pctComplete:    r.pctComplete,
      currentWeek:    r.currentWeek,
      weeksCommitted: r.weeksCommitted,
      isActive:       r.isActive,
    }));

    // Student summary for header section
    const student = {
      xp:     stats.xpTotal,
      streak: stats.currentStreakDays,
      solved: stats.problemsSolved,
      score:  stats.prepScore,
      onboardingComplete: stats.onboardingComplete,
    };

    return successResponse({
      student,
      stats: {
        xpTotal:           stats.xpTotal,
        currentStreakDays:  stats.currentStreakDays,
        problemsSolved:    stats.problemsSolved,
        prepScore:         stats.prepScore,
        companiesOnRoadmap: roadmaps.length,
      },
      roadmaps,
      recentActivity: stats.weeklyActivity,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
