/**
 * backend/src/services/roadmap.service.ts
 * Unified roadmap week builder — single source of truth for both onboarding
 * and the POST /api/user/me/roadmap route.
 *
 * Phase 2: self-ratings now affect week order via rationaleScore;
 * questionIds are populated from real DB queries per week.
 */

import { companyRepository } from '../repositories/company.repository';
import { questionRepository } from '../repositories/question.repository';
import type mongoose from 'mongoose';

function getRoadmapParams(weeks: number): { questionsPerWeek: number } {
  if (weeks <= 4)  return { questionsPerWeek: 15 };
  if (weeks <= 6)  return { questionsPerWeek: 12 };
  if (weeks <= 8)  return { questionsPerWeek: 10 };
  if (weeks <= 12) return { questionsPerWeek: 7  };
  return             { questionsPerWeek: 5  };
}

export interface RoadmapWeekDraft {
  weekNumber: number;
  topicLabel: string;
  totalQuestions: number;
  doneQuestions: number;
  status: 'active' | 'locked';
  questionIds: mongoose.Types.ObjectId[];
  rationaleScore: number;
  questionBreakdown: { dsa: number; aptitude: number; coreCs: number; hr: number };
  /** 'company' = questions linked to this company; 'generic' = shared null-slug pool */
  poolSource?: 'company' | 'generic';
}

// Non-Coding round types that have a corresponding null-slug generic pool.
// LLD and Managerial are omitted — no null-slug content exists for them yet.
const GENERIC_ROUND_MAP: Record<string, { questionType: string; label: string }> = {
  'Aptitude':      { questionType: 'aptitude_mcq',  label: 'Aptitude & Verbal' },
  'System Design': { questionType: 'system_design',  label: 'System Design'    },
  'HR':            { questionType: 'hr_behavioral',  label: 'HR Behavioral'    },
  'Domain':        { questionType: 'core_cs_mcq',    label: 'Core CS'          },
};

const DEFAULT_TOPICS = [
  'Arrays', 'Strings', 'Dynamic Programming', 'Trees', 'Graphs',
  'Greedy', 'Binary Search', 'Hash Tables', 'Sorting', 'Two Pointers',
];

export const roadmapService = {
  async buildWeeks(params: {
    companySlug: string;
    targetRole: string;
    prepWeeks: number;
    topicSelfRatings: Record<string, number>;
  }): Promise<RoadmapWeekDraft[]> {
    const { companySlug, targetRole, prepWeeks, topicSelfRatings } = params;
    const { questionsPerWeek } = getRoadmapParams(prepWeeks);

    // Get role-specific topics (falls back to flat topicFrequency automatically)
    const roleTopics = await companyRepository.findRoleTopics(companySlug, targetRole);

    // rationaleScore: higher frequency + lower self-rating = higher priority week
    const scored = roleTopics
      .map(t => ({
        ...t,
        rationaleScore: t.frequencyPct * (10 - (topicSelfRatings[t.topicSlug] ?? 5)) / 10,
      }))
      .sort((a, b) => b.rationaleScore - a.rationaleScore);

    const topTopics = scored.slice(0, prepWeeks);
    const topicNames = topTopics.map(t => t.topicName);

    while (topicNames.length < prepWeeks) {
      topicNames.push(DEFAULT_TOPICS[topicNames.length % DEFAULT_TOPICS.length]);
    }

    const weeks = await Promise.all(topicNames.map(async (topicName, i) => {
      const topicMeta = topTopics[i];
      let questionIds: mongoose.Types.ObjectId[] = [];
      const breakdown = { dsa: 0, aptitude: 0, coreCs: 0, hr: 0 };

      try {
        const { questions } = await questionRepository.findMany({
          companySlug,
          topic: topicName,
          limit: questionsPerWeek,
        });
        questionIds = questions.map(q => q._id as mongoose.Types.ObjectId);

        questions.forEach(q => {
          const qt = (q as any).questionType ?? 'dsa';
          if (qt === 'aptitude_mcq') breakdown.aptitude++;
          else if (qt === 'core_cs_mcq') breakdown.coreCs++;
          else if (qt === 'hr_behavioral') breakdown.hr++;
          else breakdown.dsa++;
        });
      } catch {
        // Per-week query failure: leave questionIds empty, fall back to count from meta
      }

      const totalQuestions = questionIds.length > 0
        ? questionIds.length
        : Math.min(Math.max(topicMeta?.questionCount ?? 5, 1), questionsPerWeek);

      return {
        weekNumber: i + 1,
        topicLabel: topicName,
        totalQuestions,
        doneQuestions: 0,
        status: (i === 0 ? 'active' : 'locked') as 'active' | 'locked',
        questionIds,
        rationaleScore: topicMeta?.rationaleScore ?? 0,
        questionBreakdown: breakdown,
        poolSource: 'company' as const,
      };
    }));

    // Append generic-pool weeks for non-Coding rounds in the company's roundStructure.
    // Each round type maps to a null-slug pool (aptitude_mcq, system_design, etc.).
    // These extend the plan beyond prepWeeks — they cover rounds the company actually runs
    // that have no company-specific questions.
    const companyRoundTypes = await companyRepository.findRoundTypes(companySlug);
    const genericWeeks: RoadmapWeekDraft[] = [];

    for (const [roundType, { questionType, label }] of Object.entries(GENERIC_ROUND_MAP)) {
      if (!companyRoundTypes.includes(roundType)) continue;
      const poolQuestions = await questionRepository.findManyGenericPool({
        questionType,
        limit: questionsPerWeek,
      });
      if (!poolQuestions.length) continue;

      const breakdown = { dsa: 0, aptitude: 0, coreCs: 0, hr: 0 };
      poolQuestions.forEach(q => {
        const qt = (q as any).questionType ?? 'dsa';
        if (qt === 'aptitude_mcq') breakdown.aptitude++;
        else if (qt === 'core_cs_mcq') breakdown.coreCs++;
        else if (qt === 'hr_behavioral') breakdown.hr++;
        else breakdown.dsa++;
      });

      genericWeeks.push({
        weekNumber: weeks.length + genericWeeks.length + 1,
        topicLabel: label,
        totalQuestions: poolQuestions.length,
        doneQuestions: 0,
        status: 'locked',
        questionIds: poolQuestions.map(q => q._id as mongoose.Types.ObjectId),
        rationaleScore: 0,
        questionBreakdown: breakdown,
        poolSource: 'generic',
      });
    }

    return [...weeks, ...genericWeeks];
  },
};
