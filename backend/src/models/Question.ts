/**
 * backend/src/models/Question.ts
 * Interview question from any source — linked to a company, tagged by topics.
 *
 * BUG-R3 FIX: Added targetRoles[] field so role-based roadmap filtering works.
 * Without this, a Data Analyst sees DSA coding questions and an SDE-1 sees SQL-heavy questions.
 *
 * Migration mapping (applied in /api/admin/migrate-question-roles or as a one-time script):
 *   roundType === 'Coding'        → ['SDE-1', 'SDE-2', 'SDE-3', 'ML Engineer']
 *   roundType === 'System Design' → ['SDE-2', 'SDE-3', 'ML Engineer']
 *   roundType === 'LLD'           → ['SDE-1', 'SDE-2', 'SDE-3']
 *   roundType === 'HR'            → all roles
 *   roundType === 'Aptitude'      → ['SDE-1', 'SDE-2', 'SDE-3', 'Data Analyst']
 *   roundType === 'Domain'        → ['Data Analyst', 'Product Manager']
 *   Topic contains SQL/Stats/Excel → also add 'Data Analyst'
 *   Topic contains Product/Metrics → also add 'Product Manager'
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { RoundType, Difficulty } from '../types/shared.types';

export const TARGET_ROLES = [
  'SDE-1', 'SDE-2', 'SDE-3',
  'Data Analyst', 'Product Manager',
  'DevOps', 'ML Engineer', 'QA',
] as const;

export type TargetRole = typeof TARGET_ROLES[number];

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId; // ref: Company
  companySlug: string; // denormalized for fast queries
  companyName: string; // denormalized for display
  roundType: RoundType;
  roundNumber?: number;
  problemSummary: string;
  difficulty: Difficulty;
  topics: string[];
  // BUG-R3 FIX: targetRoles determines which roles see this question in their roadmap
  targetRoles: TargetRole[];
  source: string;
  sourceUrl?: string;
  leetcodeUrl?: string;
  frequencyScore: number;
  companyFrequency: Array<{
    companySlug: string;
    frequency: number;
    askedCount: number;
  }>;
  targetRoles: string[];
  interviewYear?: number;
  xpValue: number;
  isHot: boolean;
  verified: boolean;
  isSeeded?: boolean;
  // BUG-M7 FIX: interviewYear enables real trend data per topic per year.
  // E.g. 2024 had more System Design than 2022. Populate when scraping.
  interviewYear?: number;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    companySlug: { type: String, required: true, index: true },
    companyName: { type: String, required: true },
    roundType: {
      type: String,
      enum: ['Coding', 'System Design', 'HR', 'Aptitude', 'LLD', 'Domain', 'Managerial'],
      required: true,
      index: true,
    },
    roundNumber: { type: Number },
    problemSummary: {
      type: String,
      required: [true, 'Problem summary is required'],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
      index: true,
    },
    topics: { type: [String], default: [] },
    // BUG-R3 FIX: targetRoles[] for role-based filtering in roadmap generation
    // Default ['SDE-1', 'SDE-2'] covers most Coding questions without migration
    targetRoles: {
      type: [String],
      enum: TARGET_ROLES,
      default: ['SDE-1', 'SDE-2'],
      index: true,
    },
    source: {
      type: String,
      required: true,
      default: 'nst_internal',
    },
    sourceUrl: { type: String },
    leetcodeUrl: { type: String },
    frequencyScore: { type: Number, default: 0, min: 0, max: 1 },
    companyFrequency: [
      {
        companySlug: String,
        frequency: { type: Number, min: 0, max: 1 },
        askedCount: Number,
      }
    ],
    targetRoles: {
      type: [String],
      enum: ['SDE-1', 'SDE-2', 'SDE-3', 'Data Analyst', 'Product Manager', 'DevOps', 'ML Engineer', 'QA'],
      default: ['SDE-1', 'SDE-2'],
      index: true,
    },
    interviewYear: { type: Number },
    xpValue: { type: Number, default: 10 },
    isHot: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    isSeeded: { type: Boolean, default: false },
    // BUG-M7 FIX: year the question was asked in an interview — enables real Trends tab data
    interviewYear: { type: Number, min: 2015, max: 2030 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'questions',
  }
);

// Performance indexes
QuestionSchema.index({ companyId: 1, roundType: 1, difficulty: 1 });
QuestionSchema.index({ companySlug: 1, difficulty: 1 });
QuestionSchema.index({ topics: 1 });
QuestionSchema.index({ problemSummary: 'text' }); // full-text search
QuestionSchema.index({ frequencyScore: -1 }); // for sorting by frequency
// BUG-R3: Compound index for role-filtered roadmap queries
QuestionSchema.index({ companySlug: 1, targetRoles: 1, frequencyScore: -1 });
QuestionSchema.index({ companySlug: 1, topics: 1, targetRoles: 1, frequencyScore: -1 });

const Question: Model<IQuestion> =
  mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);

export default Question;
