/**
 * dashboard/student-portal/app/api/experiences/[id]/upvote/route.ts
 * POST /api/experiences/[id]/upvote — toggle upvote on an experience.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { experienceRepository } from 'placeprep-backend/src/repositories/experience.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const { id } = await params;
    const result = await experienceRepository.toggleUpvote(id, user.userId);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
