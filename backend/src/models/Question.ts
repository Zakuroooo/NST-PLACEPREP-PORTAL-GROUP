/**
 * backend/src/models/Question.ts
 * Interview question from any source — linked to a company, tagged by topics.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { RoundType, Difficulty } from '../types/shared.types';

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
  source: string;
  sourceUrl?: string;
  leetcodeUrl?: string;
  frequencyScore: number;
  xpValue: number;
  isHot: boolean;
  verified: boolean;
  isSeeded?: boolean;
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
    source: {
      type: String,
      required: true,
      default: 'nst_internal',
    },
    sourceUrl: { type: String },
    leetcodeUrl: { type: String },
    frequencyScore: { type: Number, default: 0, min: 0, max: 1 },
    xpValue: { type: Number, default: 10 },
    isHot: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    isSeeded: { type: Boolean, default: false },
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

const Question: Model<IQuestion> =
  mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);

export default Question;
