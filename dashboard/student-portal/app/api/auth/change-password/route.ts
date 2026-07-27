/**
 * dashboard/student-portal/app/api/auth/change-password/route.ts
 * POST /api/auth/change-password — authenticated user changes their own password.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAuth } from 'placeprep-backend/src/utils/authMiddleware';
import { authService } from 'placeprep-backend/src/services/auth.service';
import { changePasswordSchema } from 'placeprep-backend/src/validators/auth.validator';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireAuth(request);

    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest('Invalid input.', validation.error.flatten().fieldErrors);
    }

    const { oldPassword, newPassword } = validation.data;
    await authService.changePassword(user.userId, oldPassword, newPassword);

    return successResponse(null, { message: 'Password changed successfully.' });
  } catch (error) {
    return handleApiError(error);
  }
}
