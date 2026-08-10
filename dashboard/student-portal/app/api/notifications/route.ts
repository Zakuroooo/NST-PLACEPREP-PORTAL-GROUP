/**
 * dashboard/student-portal/app/api/notifications/route.ts
 * GET /api/notifications — notification feed (20 most recent)
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { notificationService } from 'placeprep-backend/src/services/notification.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const notifications = await notificationService.getUserNotifications(user.userId, ['session', 'doubt']); // BUG-FIX F1
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return successResponse({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
