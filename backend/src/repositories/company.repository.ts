/**
 * backend/src/repositories/company.repository.ts
 */

import Company, { ICompany } from '../models/Company';

export const companyRepository = {
  async findAll(filter?: {
    category?: string;
    hiringStatus?: string;
  }): Promise<ICompany[]> {
    const query: Record<string, unknown> = {};
    if (filter?.category) query.category = filter.category;
    if (filter?.hiringStatus) query.hiringStatus = filter.hiringStatus;
    return Company.find(query).sort({ name: 1 }).lean<ICompany[]>();
  },

  async findBySlug(slug: string): Promise<ICompany | null> {
    return Company.findOne({ slug: slug.toLowerCase() }).lean<ICompany>();
  },

  async findBySlugs(slugs: string[]): Promise<ICompany[]> {
    return Company.find({ slug: { $in: slugs } }).lean<ICompany[]>();
  },

  async findById(id: string): Promise<ICompany | null> {
    return Company.findById(id).lean<ICompany>();
  },

  async search(query: string): Promise<ICompany[]> {
    return Company.find({ $text: { $search: query } })
      .limit(5)
      .lean<ICompany[]>();
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
