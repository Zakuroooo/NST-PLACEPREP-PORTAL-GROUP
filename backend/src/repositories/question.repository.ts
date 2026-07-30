/**
 * backend/src/repositories/question.repository.ts
 */

import Question, { IQuestion } from '../models/Question';
import mongoose from 'mongoose';

export const questionRepository = {
  async findMany(filter: {
    companySlug?: string;
    companyId?: string;
    topic?: string;
    difficulty?: string;
    roundType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ questions: IQuestion[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (filter.companySlug) query.companySlug = filter.companySlug;
    if (filter.companyId) query.companyId = new mongoose.Types.ObjectId(filter.companyId);
    if (filter.difficulty) query.difficulty = filter.difficulty;
    if (filter.roundType) query.roundType = filter.roundType;
    if (filter.topic) query.topics = filter.topic;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      Question.find(query)
        .sort({ frequencyScore: -1, isHot: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IQuestion[]>(),
      Question.countDocuments(query),
    ]);

    return { questions, total };
  },

  async findById(id: string): Promise<IQuestion | null> {
    return Question.findById(id).lean<IQuestion>();
  },

  async findByIds(ids: string[]): Promise<IQuestion[]> {
    return Question.find({ _id: { $in: ids } }).lean<IQuestion[]>();
  },

  async countByCompany(companySlug: string): Promise<number> {
    return Question.countDocuments({ companySlug });
  },

  async search(query: string): Promise<IQuestion[]> {
    return Question.find({ $text: { $search: query } })
      .limit(5)
      .lean<IQuestion[]>();
  },

  async create(data: Partial<IQuestion>): Promise<IQuestion> {
    const q = new Question(data);
    return q.save() as unknown as IQuestion;
  },

  /** Find all questions (capped for safety) */
  async findAll(options?: { limit?: number }): Promise<IQuestion[]> {
    return Question.find()
      .limit(options?.limit || 500)
      .lean<IQuestion[]>();
  },

  async deleteAllSeeded(): Promise<void> {
    await Question.deleteMany({ isSeeded: true });
  },
};
