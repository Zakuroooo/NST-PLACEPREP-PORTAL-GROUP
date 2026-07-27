/**
 * dashboard/faculty-portal/app/api/faculty/students/route.ts
 * GET /api/faculty/students — student matrix for faculty view.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireFaculty } from 'placeprep-backend/src/utils/authMiddleware';
import { facultyService } from 'placeprep-backend/src/services/faculty.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireFaculty(request);
    const matrix = await facultyService.getStudentsMatrix();
    return successResponse(matrix);
  } catch (error) {
    return handleApiError(error);
  }
}
