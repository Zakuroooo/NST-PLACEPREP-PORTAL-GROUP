/**
 * backend/src/repositories/doubt.repository.ts
 */

import DoubtThread, { IDoubtThread } from '../models/DoubtThread';
import mongoose from 'mongoose';

export const doubtRepository = {
  async findByStudentId(
    studentId: string,
    page = 1,
    limit = 20
  ): Promise<{ threads: IDoubtThread[]; total: number }> {
    const filter = { studentId: new mongoose.Types.ObjectId(studentId) };
    const skip = (page - 1) * limit;
    const [threads, total] = await Promise.all([
      DoubtThread.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<IDoubtThread[]>(),
      DoubtThread.countDocuments(filter),
    ]);
    return { threads, total };
  },

  async findByFacultyId(
    facultyId: string,
    status?: string
  ): Promise<IDoubtThread[]> {
    // BUG 1 FIX: Show both specifically-assigned doubts AND unassigned (open pool).
    // Previously only matched assignedFacultyId = facultyId → 0 results when
    // students don't pick a specific faculty (which is the default).
    const filter: Record<string, unknown> = {
      $or: [
        { assignedFacultyId: new mongoose.Types.ObjectId(facultyId) },
        { assignedFacultyId: { $exists: false } },
        { assignedFacultyId: null },
      ],
    };
    if (status) filter.status = status;
    return DoubtThread.find(filter).sort({ createdAt: -1 }).lean<IDoubtThread[]>();
  },

  async findAllPending(): Promise<IDoubtThread[]> {
    return DoubtThread.find({ status: 'pending' }).sort({ createdAt: 1 }).lean<IDoubtThread[]>();
  },

  async findById(id: string): Promise<IDoubtThread | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return DoubtThread.findById(id).lean<IDoubtThread>();
  },

  async create(data: Partial<IDoubtThread>): Promise<IDoubtThread> {
    const thread = new DoubtThread(data);
    return thread.save() as unknown as IDoubtThread;
  },

  async addReply(
    id: string,
    reply: {
      authorId: string;
      authorName: string;
      authorRole: 'student' | 'faculty';
      body: string;
    }
  ): Promise<IDoubtThread | null> {
    return DoubtThread.findByIdAndUpdate(
      id,
      {
        $push: {
          replies: {
            ...reply,
            authorId: new mongoose.Types.ObjectId(reply.authorId),
            sentAt: new Date(),
          },
        },
        $set: { status: reply.authorRole === 'faculty' ? 'answered' : undefined },
      },
      { new: true }
    ).lean<IDoubtThread>();
  },

  async updateStatus(
    id: string,
    status: 'pending' | 'answered' | 'resolved'
  ): Promise<IDoubtThread | null> {
    const updateData: Record<string, unknown> = { status };
    if (status === 'resolved') updateData.resolvedAt = new Date();
    return DoubtThread.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean<IDoubtThread>();
  },

  async countByStatus(status: string): Promise<number> {
    return DoubtThread.countDocuments({ status: status as any });
  },

  async countByStudentIdAndStatus(studentId: string, status?: string): Promise<number> {
    const filter: Record<string, unknown> = { studentId: new mongoose.Types.ObjectId(studentId) };
    if (status) filter.status = status;
    return DoubtThread.countDocuments(filter);
  },

  async deleteAllSeeded(): Promise<void> {
    await DoubtThread.deleteMany({ isSeeded: true });
  },
};
