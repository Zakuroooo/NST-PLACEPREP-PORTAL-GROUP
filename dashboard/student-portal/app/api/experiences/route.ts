/**
 * dashboard/student-portal/app/api/experiences/route.ts
 * GET  /api/experiences — browse verified experiences, filter by company
 * POST /api/experiences — submit a new experience
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { experienceRepository } from 'placeprep-backend/src/repositories/experience.repository';
import { companyRepository } from 'placeprep-backend/src/repositories/company.repository';
import { studentRepository } from 'placeprep-backend/src/repositories/student.repository';
import { submitExperienceSchema } from 'placeprep-backend/src/validators/experience.validator';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';
import mongoose from 'mongoose';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    const { searchParams } = new URL(request.url);
    const companySlug = searchParams.get('company') || undefined;
    const page = Number(searchParams.get('page')) || 1;

    const { experiences, total } = await experienceRepository.findAll({
      companySlug,
      verified: true,
      page,
      limit: 10,
    });

    return successResponse(experiences, { meta: { page, limit: 10, total } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);

    const body = await request.json();
    const validation = submitExperienceSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest('Invalid experience data.', validation.error.flatten().fieldErrors);
    }

    const company = await companyRepository.findBySlug(validation.data.companySlug);
    if (!company) throw ApiError.notFound('Company');

    const profile = await studentRepository.findByUserId(user.userId);

    const experience = await experienceRepository.create({
      studentId: new mongoose.Types.ObjectId(user.userId),
      studentName: profile?.fullName || user.email,
      companyId: company._id,
      companySlug: company.slug,
      companyName: company.name,
      role: validation.data.role,
      interviewDate: new Date(validation.data.interviewDate),
      outcome: validation.data.outcome,
      overallDifficulty: validation.data.overallDifficulty,
      roundsCount: validation.data.roundsCount,
      rounds: validation.data.rounds,
      experienceText: validation.data.experienceText,
      tips: validation.data.tips,
      isVerified: false,
      source: 'nst_internal',
    });

    return successResponse(experience, {
      status: 201,
      message: 'Experience submitted! It will appear after admin verification.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
