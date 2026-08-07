/**
 * backend/src/validators/student.validator.ts
 */
import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).trim().optional(),
  phone: z.string().max(15).optional(),
  linkedinUrl: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || /^https?:\/\/.+/.test(val),
      { message: 'Invalid LinkedIn URL' }
    )
    .transform((val) => (val && val.trim() === '' ? undefined : val)),
  githubUrl: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || /^https?:\/\/.+/.test(val),
      { message: 'Invalid GitHub URL' }
    )
    .transform((val) => (val && val.trim() === '' ? undefined : val)),
  year: z.enum(['1st', '2nd', '3rd', '4th']).optional(),
  branch: z.string().min(2).trim().optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().optional(),
  targetDomains: z.array(z.string()).optional(),
  targetCategories: z.array(z.string()).optional(),
  targetCompanySlugs: z.array(z.string()).optional(),
  prepWeeksCommitted: z.number().int().min(4).max(52).optional(),
  topicSelfRatings: z.record(z.string(), z.number()).optional(),
});

export const onboardingSchema = z.object({
  targetDomains: z.array(z.string()).min(1, 'Select at least one domain'),
  targetCategories: z.array(
    z.enum(['maang', 'product', 'service', 'startup', 'bfsi', 'other'])
  ).min(1, 'Select at least one company category'),
  topicSelfRatings: z.record(z.string(), z.number().int().min(1).max(5)),
  targetCompanySlugs: z.array(z.string()).min(1, 'Select at least one target company'),
  prepWeeksCommitted: z.number().int().min(4).max(52),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
