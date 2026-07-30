import { NextResponse } from 'next/server';
import { connectDB } from 'placeprep-backend/src/config/db';
import { requireAuth } from 'placeprep-backend/src/utils/authMiddleware';
import Notification from 'placeprep-backend/src/models/Notification';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req as any);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const count = await Notification.countDocuments({
      userId: auth.userId,
      isRead: false
    });

    return NextResponse.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
