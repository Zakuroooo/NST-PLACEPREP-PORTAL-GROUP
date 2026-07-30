/**
 * backend/src/validators/session.validator.ts
 */
import { z } from 'zod';

export const bookSessionSchema = z.object({
  facultyId: z.string({ required_error: 'Please select a faculty member' }).min(1),
  topic: z
    .string({ required_error: 'Session topic is required' })
    .min(5, 'Topic must be at least 5 characters')
    .max(300, 'Topic cannot exceed 300 characters')
    .trim(),
  notes: z.string().max(1000).optional(),
  requestedDate: z
    .string({ required_error: 'Please select a date' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  requestedTime: z
    .string({ required_error: 'Please select a time' })
    .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
  durationMin: z.union([z.literal(30), z.literal(60)], {
    required_error: 'Duration must be 30 or 60 minutes',
  }),
});

export const proposeSessionSchema = z.object({
  proposedDate: z
    .string({ required_error: 'Proposed date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  proposedTime: z
    .string({ required_error: 'Proposed time is required' })
    .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
});

export const sessionFeedbackSchema = z.object({
  rating: z
    .number({ required_error: 'Rating is required' })
    .int()
    .min(1, 'Rating must be 1–5')
    .max(5, 'Rating must be 1–5'),
});

export type BookSessionInput = z.infer<typeof bookSessionSchema>;
export type ProposeSessionInput = z.infer<typeof proposeSessionSchema>;
