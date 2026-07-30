/**
 * backend/src/repositories/company.repository.ts
 */

import Company, { ICompany } from '../models/Company';

// Pipeline stage that joins questions to count per company
// Returns documents with an extra `questionCount` field
const withQuestionCount = [
  {
    $lookup: {
      from: 'questions',
      localField: 'slug',
      foreignField: 'companySlug',
      as: '_questions',
    },
  },
  {
    $addFields: {
      questionCount: { $size: '$_questions' },
      topTopic: { $arrayElemAt: ['$topicFrequency.topicName', 0] },
    },
  },
  {
    $project: { _questions: 0 }, // drop the raw join array — not needed
  },
];

export const companyRepository = {
  async findAll(filter?: {
    category?: string;
    hiringStatus?: string;
  }): Promise<(ICompany & { questionCount: number; topTopic?: string })[]> {
    const match: Record<string, unknown> = {};
    if (filter?.category) match.category = filter.category;
    if (filter?.hiringStatus) match.hiringStatus = filter.hiringStatus;

    return Company.aggregate([
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      { $sort: { name: 1 } },
      ...withQuestionCount,
    ]);
  },

  async findBySlug(slug: string): Promise<(ICompany & { questionCount: number }) | null> {
    const result = await Company.aggregate([
      { $match: { slug: slug.toLowerCase() } },
      ...withQuestionCount,
      { $limit: 1 },
    ]);
    return result[0] ?? null;
  },

  async findBySlugs(slugs: string[]): Promise<(ICompany & { questionCount: number })[]> {
    return Company.aggregate([
      { $match: { slug: { $in: slugs } } },
      ...withQuestionCount,
    ]);
  },

  async findById(id: string): Promise<ICompany | null> {
    return Company.findById(id).lean<ICompany>();
  },

  async search(query: string): Promise<(ICompany & { questionCount: number })[]> {
    return Company.aggregate([
      { $match: { $text: { $search: query } } },
      { $limit: 20 },
      ...withQuestionCount,
    ]);
  },

  async count(): Promise<number> {
    return Company.countDocuments();
  },

  async create(data: Partial<ICompany>): Promise<ICompany> {
    const company = new Company(data);
    return company.save();
  },

  async deleteAllSeeded(): Promise<void> {
    await Company.deleteMany({ isSeeded: true });
  },
};
