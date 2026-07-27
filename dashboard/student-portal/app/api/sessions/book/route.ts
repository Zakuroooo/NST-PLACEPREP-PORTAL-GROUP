/**
 * POST /api/sessions/book
 * Student books a 1:1 session with a faculty member.
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from 'placeprep-backend/src/config/db';
import { requireAuth } from 'placeprep-backend/src/utils/authMiddleware';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';
import SessionBooking from 'placeprep-backend/src/models/SessionBooking';
import StudentProfile from 'placeprep-backend/src/models/StudentProfile';
import FacultyProfile from 'placeprep-backend/src/models/FacultyProfile';
import Notification from 'placeprep-backend/src/models/Notification';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.role !== 'student') return handleApiError(new ApiError('Students only', 403, 'FORBIDDEN'));

    await connectDB();

    const body = await req.json();
    const { facultyId, topic, notes, requestedDate, requestedTime, durationMin } = body;

    if (!facultyId || !topic || !requestedDate || !requestedTime) {
      return handleApiError(new ApiError('facultyId, topic, requestedDate, and requestedTime are required', 400, 'BAD_REQUEST'));
    }

    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
      return handleApiError(new ApiError('Invalid facultyId', 400, 'BAD_REQUEST'));
    }

    // Verify faculty exists
    const faculty = await FacultyProfile.findOne({ userId: facultyId });
    if (!faculty) return handleApiError(new ApiError('Faculty not found', 404, 'NOT_FOUND'));

    // Get student profile for name
    const student = await StudentProfile.findOne({ userId: auth.userId });
    if (!student) return handleApiError(new ApiError('Student profile not found', 404, 'NOT_FOUND'));

    // Prevent duplicate booking for same slot
    const existing = await SessionBooking.findOne({
      facultyId,
      requestedDate: new Date(requestedDate),
      requestedTime,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (existing) {
      return handleApiError(new ApiError('This slot is already booked. Please choose another time.', 409, 'CONFLICT'));
    }

    const booking = await SessionBooking.create({
      studentId: auth.userId,
      facultyId,
      topic: topic.trim().slice(0, 200),
      notes: notes ? notes.trim().slice(0, 500) : undefined,
      requestedDate: new Date(requestedDate),
      requestedTime,
      durationMin: durationMin || 30,
      status: 'pending',
    });

    // Notify the faculty
    await Notification.create({
      userId: faculty.userId,
      type: 'session',
      title: 'New Session Request',
      subtitle: `${student.fullName} wants a session: "${topic.slice(0, 60)}"`,
      iconName: 'Calendar',
      isRead: false,
    });

    return NextResponse.json(successResponse({ booking }, { message: 'Session booked successfully', status: 201 }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
