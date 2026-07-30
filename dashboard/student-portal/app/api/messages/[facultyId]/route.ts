/**
 * dashboard/student-portal/app/api/messages/[facultyId]/route.ts
 * GET  /api/messages/:facultyId — fetch conversation with a specific faculty
 * POST /api/messages/:facultyId — send a message to a specific faculty
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';
import Message from 'placeprep-backend/src/models/Message';
import mongoose from 'mongoose';

type RouteContext = { params: Promise<{ facultyId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    await connectDB();
    const student = await requireStudent(request);
    const { facultyId } = await params;
    const conversationId = `${student.userId}_${facultyId}`;

    // Mark faculty messages as seen
    await Message.updateMany(
      { conversationId, senderRole: 'faculty', seen: false },
      { seen: true }
    );

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    const formatted = messages.map((m) => ({
      id: String(m._id),
      senderId: m.senderRole === 'student' ? 'student' : 'faculty',
      body: m.body,
      sentAt: m.createdAt,
      seen: m.seen,
    }));

    return successResponse({ messages: formatted });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    await connectDB();
    const student = await requireStudent(request);
    const { facultyId } = await params;
    const body = await request.json();

    if (!body?.body?.trim()) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }

    const conversationId = `${student.userId}_${facultyId}`;
    const message = await Message.create({
      conversationId,
      senderId: new mongoose.Types.ObjectId(student.userId),
      senderRole: 'student',
      body: body.body.trim(),
      seen: false,
    });

    return successResponse(
      {
        id: String(message._id),
        senderId: 'student',
        body: message.body,
        sentAt: message.createdAt,
        seen: false,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
