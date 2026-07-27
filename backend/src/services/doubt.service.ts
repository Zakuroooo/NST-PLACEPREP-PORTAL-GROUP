/**
 * backend/src/services/doubt.service.ts
 * Business logic for student-side doubt thread operations.
 * Calls repositories only — never touches Mongoose directly.
 */

import { doubtRepository } from '../repositories/doubt.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { facultyRepository } from '../repositories/faculty.repository';
import { ApiError } from '../utils/apiError';
import { sanitizeAndLimit } from '../utils/sanitize';

/**
 * Smart notification cooldown: if faculty already received a doubt notification
 * in the last DOUBT_NOTIF_COOLDOWN_MIN minutes, skip to avoid spam.
 * This handles the "100 students raise doubts simultaneously" case.
 */
const DOUBT_NOTIF_COOLDOWN_MIN = 5;

async function notifyFacultyAboutDoubt(
  facultyUserId: string,
  studentName: string,
  subject: string
): Promise<void> {
  try {
    const recent = await notificationRepository.findRecentDoubtNotif(
      facultyUserId,
      DOUBT_NOTIF_COOLDOWN_MIN
    );
    // If a doubt notification was sent in the cooldown window, skip (not spam)
    if (recent) return;

    await notificationRepository.create({
      userId: facultyUserId,
      type: 'doubt',
      title: 'New doubt awaiting reply',
      subtitle: `${studentName}: ${subject.slice(0, 80)}`,
      iconName: 'HelpCircle',
    });
  } catch {
    // Non-blocking — notification failure must never crash doubt creation
  }
}

export const doubtService = {
  /**
   * Get all doubt threads for a student (paginated).
   */
  async getStudentDoubts(studentId: string, page = 1, limit = 20) {
    return doubtRepository.findByStudentId(studentId, page, limit);
  },

  /**
   * Get a single doubt thread (validates ownership).
   */
  async getDoubtById(id: string, studentId: string) {
    const thread = await doubtRepository.findById(id);
    if (!thread) throw ApiError.notFound('Doubt thread not found.');

    if (thread.studentId.toString() !== studentId) {
      throw ApiError.forbidden('You do not have access to this doubt thread.');
    }

    return thread;
  },

  /**
   * Create a new doubt thread.
   * Sanitizes all text input before storage.
   *
   * Notification strategy (BUG 4+7 FIX):
   * - If assignedFacultyId provided: notify that one faculty
   * - If unassigned (open pool): notify ALL active faculty, with 5-min cooldown per faculty
   *   to prevent notification spam when many students submit at once
   */
  async createDoubt(
    studentId: string,
    studentName: string,
    data: {
      subject: string;
      body: string;
      tag: string;
      assignedFacultyId?: string;
    }
  ) {
    const sanitizedSubject = sanitizeAndLimit(data.subject, 300);
    const sanitizedBody = sanitizeAndLimit(data.body, 5000);

    if (!sanitizedSubject) throw ApiError.badRequest('Subject cannot be empty.');
    if (!sanitizedBody) throw ApiError.badRequest('Doubt body cannot be empty.');

    const thread = await doubtRepository.create({
      studentId: studentId as never,
      studentName,
      subject: sanitizedSubject,
      body: sanitizedBody,
      tag: data.tag as never,
      status: 'pending',
      assignedFacultyId: data.assignedFacultyId as never,
      replies: [],
    });

    if (data.assignedFacultyId) {
      // Notify the specific faculty (with cooldown)
      void notifyFacultyAboutDoubt(data.assignedFacultyId, studentName, sanitizedSubject);
    } else {
      // Open pool: notify ALL active faculty with spam cooldown per faculty member
      facultyRepository
        .findAll()
        .then((allFaculty) => {
          const notifyPromises = allFaculty.map((f) => {
            const facultyUserId = f.userId?.toString();
            if (!facultyUserId) return Promise.resolve();
            return notifyFacultyAboutDoubt(facultyUserId, studentName, sanitizedSubject);
          });
          return Promise.all(notifyPromises);
        })
        .catch(() => {}); // Non-blocking
    }

    return thread;
  },

  /**
   * Add a reply from a student to their own thread.
   */
  async addStudentReply(
    doubtId: string,
    studentId: string,
    studentName: string,
    body: string
  ) {
    const thread = await doubtRepository.findById(doubtId);
    if (!thread) throw ApiError.notFound('Doubt thread not found.');

    if (thread.studentId.toString() !== studentId) {
      throw ApiError.forbidden('You do not have permission to reply to this thread.');
    }

    if (thread.status === 'resolved') {
      throw ApiError.badRequest('Cannot reply to a resolved thread.');
    }

    const sanitizedBody = sanitizeAndLimit(body, 5000);
    if (!sanitizedBody) throw ApiError.badRequest('Reply body cannot be empty.');

    return doubtRepository.addReply(doubtId, {
      authorId: studentId,
      authorName: studentName,
      authorRole: 'student',
      body: sanitizedBody,
    });
  },

  /**
   * Mark a doubt thread as resolved by the student.
   */
  async resolveDoubt(doubtId: string, studentId: string) {
    const thread = await doubtRepository.findById(doubtId);
    if (!thread) throw ApiError.notFound('Doubt thread not found.');

    if (thread.studentId.toString() !== studentId) {
      throw ApiError.forbidden('You do not have permission to resolve this thread.');
    }

    return doubtRepository.updateStatus(doubtId, 'resolved');
  },
};
