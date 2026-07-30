/**
 * dashboard/student-portal/app/api/practice/route.ts
 * GET /api/practice — practice zone: questions filtered by topic/difficulty/company.
 *
 * Architecture: Route → Service → Repository → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { questionRepository } from 'placeprep-backend/src/repositories/question.repository';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

/** Normalize raw DB question → shape the frontend expects */
function normalizeQuestion(q: any) {
  return {
    _id:          q._id,
    id:           q._id,                          // alias
    title:        q.problemSummary,               // DB → frontend
    diff:         q.difficulty,                   // DB → frontend
    difficulty:   q.difficulty,                   // keep both
    xp:           q.xpValue ?? 10,               // DB → frontend
    xpValue:      q.xpValue ?? 10,
    hot:          q.isHot ?? false,              // DB → frontend
    isHot:        q.isHot ?? false,
    topic:        Array.isArray(q.topics) ? q.topics[0] : (q.topics ?? ''),
    topics:       q.topics ?? [],
    frequency:    q.frequencyScore != null ? Math.round(q.frequencyScore * 100) : null,
    frequencyScore: q.frequencyScore ?? 0,
    roundType:    q.roundType,
    companySlug:  q.companySlug,
    companyName:  q.companyName,
    sourceUrl:    q.sourceUrl,
    leetcodeUrl:  q.leetcodeUrl ?? q.sourceUrl,  // fallback to sourceUrl if no leetcodeUrl
    source:       q.source,
    verified:     q.verified ?? false,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    await requireStudent(request);

    const { searchParams } = new URL(request.url);
    const rawTopic    = searchParams.get('topic')      || undefined;
    const difficulty  = searchParams.get('difficulty') || undefined;
    const roundType   = searchParams.get('roundType')  || undefined;
    const companySlug = searchParams.get('company')    || undefined;
    const page  = Math.max(1, Number(searchParams.get('page'))  || 1);
    // Raised from 50 → 500 so company practice pages show all questions
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);

    // Handle compound topic labels like "Arrays & Strings" from roadmap week names.
    // The DB stores individual topics: ["Arrays"], ["Strings"] — not the combined label.
    // We split by & and try each part, taking the first that returns results.
    let topic: string | undefined = rawTopic;
    if (rawTopic && rawTopic.includes('&')) {
      // Pass undefined so repository fetches all, then filter client-side below
      topic = undefined;
    }

    const { questions: rawQuestions, total } = await questionRepository.findMany({
      topic,
      difficulty,
      roundType,
      companySlug,
      page,
      limit,
    });

    // Post-filter for compound topic labels (e.g. "Arrays & Strings" → match "Arrays" OR "Strings")
    let filteredQuestions = rawQuestions;
    let effectiveTotal = total;
    if (rawTopic && rawTopic.includes('&')) {
      const parts = rawTopic.split('&').map(p => p.trim().toLowerCase());
      filteredQuestions = rawQuestions.filter((q: any) =>
        Array.isArray(q.topics) &&
        q.topics.some((t: string) => parts.includes(t.toLowerCase()))
      );
      effectiveTotal = filteredQuestions.length;
    }

    const questions = filteredQuestions.map(normalizeQuestion);

    return successResponse(questions, {
      meta: { page, limit, total: effectiveTotal, totalPages: Math.ceil(effectiveTotal / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
