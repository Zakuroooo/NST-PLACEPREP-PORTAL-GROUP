/**
 * backend/src/models/Company.ts
 * Company intelligence record — includes denormalized roundStructure,
 * topicFrequency, and difficultyDistribution for fast single-document reads.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  CompanyCategory,
  HiringStatus,
  RoundType,
} from '../types/shared.types';

interface IRoundStructure {
  roundNumber: number;
  roundName: string;
  roundType: RoundType;
  typicalDurationMin?: number;
  description?: string;
}

interface ITopicFrequency {
  topicSlug: string;
  topicName: string;
  frequencyPct: number;
  questionCount: number;
}

interface IDifficultyDistribution {
  Easy: number;
  Medium: number;
  Hard: number;
}

export interface ICompany extends Document {
  _id: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  category: CompanyCategory;
  tier?: string;
  country: string;
  logoUrl?: string;
  hiringStatus: HiringStatus;
  avgSalaryLpa?: string;
  avgProcessWeeks?: string;
  hiringNote?: string;
  successRate?: string;
  roundStructure: IRoundStructure[];
  topicFrequency: ITopicFrequency[];
  difficultyDistribution: IDifficultyDistribution;
  lastSyncedAt?: Date;
  isSeeded?: boolean;
  createdAt: Date;
}

const RoundStructureSchema = new Schema<IRoundStructure>(
  {
    roundNumber: { type: Number, required: true },
    roundName: { type: String, required: true },
    roundType: {
      type: String,
      enum: ['Coding', 'System Design', 'HR', 'Aptitude', 'LLD', 'Domain', 'Managerial'],
      required: true,
    },
    typicalDurationMin: { type: Number },
    description: { type: String },
  },
  { _id: false }
);

const TopicFrequencySchema = new Schema<ITopicFrequency>(
  {
    topicSlug: { type: String, required: true },
    topicName: { type: String, required: true },
    frequencyPct: { type: Number, required: true, min: 0, max: 100 },
    questionCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const CompanySchema = new Schema<ICompany>(
  {
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Company name is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['maang', 'product', 'service', 'startup', 'bfsi', 'other'],
      required: [true, 'Category is required'],
      index: true,
    },
    tier: { type: String },
    country: { type: String, default: 'India' },
    logoUrl: { type: String },
    hiringStatus: {
      type: String,
      enum: ['Active Hiring', 'Slow Hiring', 'Paused'],
      default: 'Active Hiring',
    },
    avgSalaryLpa: { type: String },
    avgProcessWeeks: { type: String },
    hiringNote: { type: String },
    successRate: { type: String },
    roundStructure: { type: [RoundStructureSchema], default: [] },
    topicFrequency: { type: [TopicFrequencySchema], default: [] },
    difficultyDistribution: {
      type: {
        Easy: { type: Number, default: 0 },
        Medium: { type: Number, default: 0 },
        Hard: { type: Number, default: 0 },
      },
      default: { Easy: 33, Medium: 47, Hard: 20 },
    },
    lastSyncedAt: { type: Date },
    isSeeded: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'companies',
  }
);

CompanySchema.index({ name: 'text' }); // full-text search
CompanySchema.index({ category: 1, hiringStatus: 1 });

const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);

export default Company;
