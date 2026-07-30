/**
 * backend/src/repositories/faculty.repository.ts
 */

import FacultyProfile, { IFacultyProfile } from '../models/FacultyProfile';
import mongoose from 'mongoose';

export const facultyRepository = {
  async findByUserId(userId: string): Promise<IFacultyProfile | null> {
    return FacultyProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean<IFacultyProfile>();
  },

  async findAll(): Promise<IFacultyProfile[]> {
    return FacultyProfile.find({ status: { $ne: 'INVITE_PENDING' } })
      .sort({ fullName: 1 })
      .lean<IFacultyProfile[]>();
  },

  async findAllIncludingInvited(): Promise<IFacultyProfile[]> {
    return FacultyProfile.find().sort({ fullName: 1 }).lean<IFacultyProfile[]>();
  },

  async findById(id: string): Promise<IFacultyProfile | null> {
    return FacultyProfile.findById(id).lean<IFacultyProfile>();
  },

  async create(data: Partial<IFacultyProfile>): Promise<IFacultyProfile> {
    const profile = new FacultyProfile(data);
    return profile.save() as unknown as IFacultyProfile;
  },

  async updateByUserId(
    userId: string,
    data: Partial<IFacultyProfile>
  ): Promise<IFacultyProfile | null> {
    return FacultyProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: data },
      { new: true }
    ).lean<IFacultyProfile>();
  },

  async updateById(id: string, data: Partial<IFacultyProfile>): Promise<IFacultyProfile | null> {
    return FacultyProfile.findByIdAndUpdate(id, { $set: data }, { new: true }).lean<IFacultyProfile>();
  },

  async incrementAccept(userId: string): Promise<void> {
    await FacultyProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $inc: { acceptCount: 1 } }
    );
  },

  async incrementDecline(userId: string): Promise<void> {
    await FacultyProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $inc: { declineCount: 1 } }
    );
  },

  async count(): Promise<number> {
    return FacultyProfile.countDocuments({ status: 'ACTIVE' });
  },

  async deleteAllSeeded(): Promise<void> {
    await FacultyProfile.deleteMany({ isSeeded: true });
  },
};
