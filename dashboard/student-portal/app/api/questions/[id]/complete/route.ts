/**
 * dashboard/student-portal/app/api/questions/[id]/complete/route.ts
 * POST /api/questions/[id]/complete — mark question solved, earn XP.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { studentService } from 'placeprep-backend/src/services/student.service';
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

    const body = await request.json().catch(() => ({}));
    const roadmapId = body?.roadmapId as string | undefined;

    const result = await studentService.completeQuestion(user.userId, id, roadmapId);
    return successResponse(result, { message: `+${result.xpEarned} XP earned!` });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const { id } = await params;

    await studentService.uncompleteQuestion(user.userId, id);
    return successResponse({ removed: true }, { message: 'Question unmarked' } as any);
  } catch (error) {
    return handleApiError(error);
  }
}
