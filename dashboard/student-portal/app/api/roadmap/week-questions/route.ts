/**
 * dashboard/student-portal/app/api/roadmap/week-questions/route.ts
 * GET /api/roadmap/week-questions?company=airbnb&topic=Arrays&limit=15&minFrequency=0.4
 *
 * BUG-R1 FIX: New endpoint that returns frequency-capped questions for a roadmap week.
 * WeekQuestions component was calling /api/practice which returned ALL questions
 * (up to 500) ignoring totalQuestions cap. Now it fetches the exact right set:
 *   - Only questions for this company+topic
 *   - Sorted by frequencyScore DESC (hottest first)
 *   - Capped at the week's questionsPerWeek limit
 *   - Optionally filtered by minFrequency threshold
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { questionRepository } from 'placeprep-backend/src/repositories/question.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireStudent(request);

    const { searchParams } = new URL(request.url);
    const companySlug = searchParams.get('company');
    const topic = searchParams.get('topic');
    const limitParam = Number(searchParams.get('limit')) || 15;
    const minFrequencyParam = searchParams.get('minFrequency');

    if (!companySlug) {
      throw ApiError.badRequest('company parameter is required');
    }
    if (!topic) {
      throw ApiError.badRequest('topic parameter is required');
    }

    // Cap limit at 20 for safety (no more than one week's worth)
    const limit = Math.min(Math.max(limitParam, 1), 20);

    // minFrequency allows filtering out low-relevance questions
    // Falls back gracefully if no questions meet the threshold
    const minFrequency = minFrequencyParam !== null ? Number(minFrequencyParam) : undefined;

    let { questions, total } = await questionRepository.findMany({
      companySlug,
      topic,
      minFrequency,
      limit,
    });

    // BUG-R1 FIX: If frequency filter returns 0 results, fall back to no filter
    // (happens for companies/topics with all frequencyScore = 0 in the DB)
    if (questions.length === 0 && minFrequency !== undefined && minFrequency > 0) {
      const fallback = await questionRepository.findMany({
        companySlug,
        topic,
        limit,
      });
      questions = fallback.questions;
      total = fallback.total;
    }

    return successResponse({ questions, total });
  } catch (error) {
    return handleApiError(error);
  }
}
