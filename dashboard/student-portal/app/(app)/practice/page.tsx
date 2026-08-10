"use client";
import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Search, X, Monitor, Building, Calculator, Users, Zap,
  GraduationCap, FileText, HelpCircle, SearchX, MousePointerClick, Flame,
  ChevronDown, Check,
} from "lucide-react";

const IconMap: Record<string, React.ElementType> = {
  Monitor, Building, Calculator, Users, Zap, GraduationCap, FileText,
};

import { usePractice, useCompanies, usePracticeCategories, useTopics } from "@/lib/hooks";
import { type Difficulty } from "@/lib/constants";
import ErrorState from "@/components/ErrorState";

// ── Category config (display metadata keyed by questionType) ─────────────────
interface CategoryConfig {
  label: string;
  description: string;
  iconName: string;
  color: string;
  borderColor: string;
  textColor: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  dsa:             { label: "DSA / Coding",   description: "LeetCode-style problems, algorithms & data structures", iconName: "Zap",          color: "bg-blue-50",    borderColor: "border-blue-200",   textColor: "text-blue-700"   },
  aptitude_mcq:    { label: "Aptitude",        description: "Quant, logical reasoning, verbal, and puzzles",         iconName: "Calculator",   color: "bg-slate-50",   borderColor: "border-slate-200",  textColor: "text-slate-700"  },
  core_cs_mcq:     { label: "Core CS",         description: "OS, DBMS, computer networks, OOP fundamentals",         iconName: "Monitor",      color: "bg-purple-50",  borderColor: "border-purple-200", textColor: "text-purple-700" },
  system_design:   { label: "System Design",   description: "HLD, distributed systems, scalability patterns",        iconName: "Building",     color: "bg-indigo-50",  borderColor: "border-indigo-200", textColor: "text-indigo-700" },
  lld:             { label: "LLD",             description: "Low-level design, class diagrams, design patterns",     iconName: "FileText",     color: "bg-teal-50",    borderColor: "border-teal-200",   textColor: "text-teal-700"   },
  hr_behavioral:   { label: "HR / Behavioral", description: "STAR-format, situational, cultural-fit questions",      iconName: "Users",        color: "bg-green-50",   borderColor: "border-green-200",  textColor: "text-green-700"  },
  domain_specific: { label: "Domain Specific", description: "Role-specific: frontend, ML, DevOps, and more",         iconName: "GraduationCap",color: "bg-orange-50",  borderColor: "border-orange-200", textColor: "text-orange-700" },
};

// ── Difficulty badge colours ──────────────────────────────────────────────────
const diffBadge = (d: string) =>
  d === "Easy"   ? "bg-green-50 text-green-700 border border-green-200" :
  d === "Medium" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                   "bg-red-50 text-red-600 border border-red-200";

// ── Category card ─────────────────────────────────────────────────────────────
function CategoryCard({
  questionType,
  count,
  active,
  onClick,
}: {
  questionType: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const cfg: CategoryConfig = CATEGORY_CONFIG[questionType] ?? {
    label: questionType, description: "", iconName: "HelpCircle",
    color: "bg-gray-50", borderColor: "border-gray-200", textColor: "text-gray-700",
  };
  const Icon = IconMap[cfg.iconName] ?? HelpCircle;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-md group ${
        active
          ? "border-blue-500 bg-blue-50 shadow-md"
          : `${cfg.color} ${cfg.borderColor} hover:border-blue-300`
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-gray-700"><Icon className="w-6 h-6" /></span>
        {active && (
          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 rounded-full px-2 py-0.5">
            ACTIVE
          </span>
        )}
      </div>
      <div className={`font-bold text-base mb-1 ${active ? "text-blue-700" : cfg.textColor}`}>
        {cfg.label}
      </div>
      <div className="text-xs text-gray-500 mb-3 line-clamp-2">{cfg.description}</div>
      <div className={`text-xs font-semibold ${active ? "text-blue-600" : cfg.textColor}`}>
        {count.toLocaleString()}+ questions
      </div>
    </button>
  );
}

// ── Main practice content (needs Suspense for useSearchParams) ────────────────
function PracticeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeQType, setActiveQType] = useState<string | null>(
    searchParams.get("category") ?? (searchParams.get("company") ? "dsa" : null)
  );
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [company, setCompany] = useState(searchParams.get("company") ?? "");
  const [topic, setTopic] = useState(searchParams.get("topic") ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty | "">(
    (searchParams.get("difficulty") as Difficulty) ?? ""
  );
  const [onlyMcq, setOnlyMcq] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  // Sync URL when category changes
  useEffect(() => {
    if (activeQType) {
      const params = new URLSearchParams();
      params.set("category", activeQType);
      if (search) params.set("search", search);
      if (company) params.set("company", company);
      if (topic) params.set("topic", topic);
      if (difficulty) params.set("difficulty", difficulty);
      router.replace(`/practice?${params.toString()}`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQType]);

  // Categories — dynamic from /api/practice/categories
  const { data: categoriesData, isLoading: loadingCategories, error: errorCategories, mutate: retryCategories } = usePracticeCategories();
  const categories: { questionType: string; count: number }[] =
    Array.isArray(categoriesData) ? categoriesData : [];

  const activeCfg: CategoryConfig | null = activeQType
    ? (CATEGORY_CONFIG[activeQType] ?? {
        label: activeQType, description: "", iconName: "HelpCircle",
        color: "", borderColor: "", textColor: "",
      })
    : null;

  // Questions — only fetch when a category is selected
  const { data: practiceData, isLoading: loadingQuestions, error: errorQuestions, mutate: retryQuestions } = usePractice({
    topic,
    difficulty,
    company,
    questionType: activeQType ?? undefined,
    isMcq: onlyMcq ? true : undefined,
    page,
    enabled: activeQType !== null,
  });

  const { data: companiesData } = useCompanies();
  const allCompanySlugs = Array.isArray(companiesData) ? companiesData : [];

  const { data: topicsData } = useTopics();
  const allTopics = Array.isArray(topicsData) ? topicsData : [];

  const rawQuestions: any[] = practiceData?.data ?? [];
  const meta = practiceData?.meta ?? null;

  const allQuestions = rawQuestions.map((q: any) => ({
    ...q,
    id:          q._id ?? q.id,
    title:       q.title       ?? q.problemSummary ?? "",
    diff:        q.diff        ?? q.difficulty     ?? "",
    xp:          q.xp          ?? q.xpValue        ?? 0,
    topic:       q.topic       ?? q.topicTag       ?? "",
    companies:   q.companies   ?? (q.companySlug ? [q.companySlug] : []),
    hot:         q.hot         ?? q.isHot          ?? false,
    leetcodeUrl: q.leetcodeUrl ?? null,
  }));

  const filteredQuestions = useMemo(() => {
    if (!activeQType) return [];
    if (!search.trim()) return allQuestions;
    const lower = search.toLowerCase();
    return allQuestions.filter((q: any) => q.title?.toLowerCase().includes(lower));
  }, [activeQType, allQuestions, search]);

  const handleSelectCategory = (qt: string) => {
    setActiveQType(prev => prev === qt ? null : qt);
    setSearch(""); setCompany(""); setTopic(""); setDifficulty(""); setOnlyMcq(false);
    setPage(1); setExpandedId(null); setRevealedId(null); setSelectedAnswers({});
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setRevealedId(null);
    } else {
      setExpandedId(id);
      setRevealedId(null);
    }
  };

  const selectMcqOption = (qId: string, label: string) => {
    if (selectedAnswers[qId]) return; // locked after first pick
    setSelectedAnswers(prev => ({ ...prev, [qId]: label }));
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Practice Zone</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Choose a category to start practising. Use filters to narrow down questions.
        </p>
      </div>

      {/* Category Grid — dynamic from API */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {errorCategories ? (
          <div className="col-span-full">
            <ErrorState error={errorCategories} title="Couldn't load practice categories" onRetry={() => retryCategories()} />
          </div>
        ) : loadingCategories && categories.length === 0 ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : (
          categories.map((cat) => (
            <CategoryCard
              key={cat.questionType}
              questionType={cat.questionType}
              count={cat.count}
              active={activeQType === cat.questionType}
              onClick={() => handleSelectCategory(cat.questionType)}
            />
          ))
        )}
      </div>

      {/* Question list panel — shown when a category is selected */}
      {activeCfg && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
            <button
              onClick={() => { setActiveQType(null); setExpandedId(null); setRevealedId(null); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close category"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-700">
              {(() => { const Icon = IconMap[activeCfg.iconName] ?? HelpCircle; return <Icon className="w-5 h-5" />; })()}
            </span>
            <div>
              <div className="font-bold text-gray-900 text-sm">{activeCfg.label} Questions</div>
              <div className="text-xs text-gray-500">
                {meta
                  ? `${filteredQuestions.length} on page ${meta.page} of ${meta.totalPages} · ${meta.total.toLocaleString()} total`
                  : `${filteredQuestions.length} results`}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setPage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Company */}
            <select
              value={company}
              onChange={(e) => { setCompany(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-700"
            >
              <option value="">All Companies</option>
              {allCompanySlugs.map((c: any) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>

            {/* Topic */}
            <select
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-700"
            >
              <option value="">All Topics</option>
              {allTopics.map((t: string) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Difficulty toggles */}
            <div className="flex gap-1">
              {(["", "Easy", "Medium", "Hard"] as const).map((d) => (
                <button
                  key={d || "all"}
                  onClick={() => { setDifficulty(d as Difficulty | ""); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    difficulty === d
                      ? d === "Easy"   ? "bg-green-600 text-white" :
                        d === "Medium" ? "bg-blue-600 text-white"  :
                        d === "Hard"   ? "bg-red-500 text-white"   : "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {d || "All"}
                </button>
              ))}
            </div>

            {/* MCQ-only toggle */}
            <button
              onClick={() => { setOnlyMcq(prev => !prev); setPage(1); setExpandedId(null); setRevealedId(null); setSelectedAnswers({}); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                onlyMcq ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              MCQ only
            </button>
          </div>

          {/* Question rows.
              These three branches used to be one: an empty list rendered "No
              questions found" whether the fetch was still in flight, had failed,
              or had genuinely returned nothing. Loading and error are now
              distinct from empty. */}
          {errorQuestions ? (
            <ErrorState error={errorQuestions} title="Couldn't load questions" onRetry={() => retryQuestions()} />
          ) : loadingQuestions && filteredQuestions.length === 0 ? (
            <div className="divide-y divide-gray-50">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-gray-50 rounded animate-pulse mt-2" />
                </div>
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <div className="flex justify-center mb-3 text-gray-300">
                <SearchX className="w-12 h-12" />
              </div>
              <div className="font-medium">No questions found</div>
              <div className="text-sm mt-1">Try adjusting your filters</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredQuestions.map((q, idx) => (
                <div key={q.id}>
                  {/* Question row — click to expand */}
                  <div
                    onClick={() => toggleExpand(q.id)}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <span className="text-xs text-gray-400 font-mono w-6 shrink-0">
                      {(page - 1) * 100 + idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{q.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-500">{q.topic}</span>
                        {q.companies?.slice(0, 2).map((co: any) => (
                          <span key={co} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 capitalize">
                            {co}
                          </span>
                        ))}
                        {q.hot && (
                          <span className="text-xs bg-red-50 text-red-600 rounded px-1.5 py-0.5">
                            <Flame className="w-3 h-3 mr-1 inline-block" /> Hot
                          </span>
                        )}
                        {q.isMcq && (
                          <span className="text-xs bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">MCQ</span>
                        )}
                      </div>
                    </div>

                    <span className={`text-xs font-semibold rounded-full px-2.5 py-1 shrink-0 ${diffBadge(q.diff)}`}>
                      {q.diff}
                    </span>

                    <span className="text-xs font-bold text-amber-600 shrink-0">+{q.xp} XP</span>

                    {q.leetcodeUrl ? (
                      <a
                        href={q.leetcodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-700 shrink-0"
                        aria-label={`Open ${q.title} on LeetCode`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <div className="w-4 shrink-0" />
                    )}

                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${expandedId === q.id ? "rotate-180" : ""}`} />
                  </div>

                  {/* Inline detail panel */}
                  {expandedId === q.id && (
                    <div className="px-16 pb-4 pt-3 bg-slate-50 border-t border-slate-100">
                      {q.isMcq && q.options?.length > 0 ? (
                        <div>
                          <div className="space-y-1.5 mb-3">
                            {q.options.map((opt: any, i: number) => {
                              const picked = selectedAnswers[q.id];
                              const isPicked = picked === opt.label;
                              const isAnswered = Boolean(picked);
                              const showCorrect = isAnswered && opt.isCorrect;
                              const showWrong = isAnswered && isPicked && !opt.isCorrect;
                              return (
                                <button
                                  key={i}
                                  disabled={isAnswered}
                                  onClick={(e) => { e.stopPropagation(); selectMcqOption(q.id, opt.label); }}
                                  className={`w-full flex items-start gap-2.5 text-sm rounded-lg px-3 py-2 border transition-colors text-left ${
                                    showCorrect
                                      ? "bg-green-50 border-green-300 text-green-800 font-medium"
                                      : showWrong
                                      ? "bg-red-50 border-red-300 text-red-700"
                                      : isAnswered
                                      ? "bg-white border-gray-200 text-gray-400"
                                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
                                  }`}
                                >
                                  <span className="font-mono text-xs font-bold shrink-0 mt-0.5">{opt.label}.</span>
                                  <span className="flex-1">{opt.text}</span>
                                  {showCorrect && <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />}
                                  {showWrong && <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                                </button>
                              );
                            })}
                          </div>
                          {selectedAnswers[q.id] && q.explanation && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Explanation</p>
                              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{q.explanation}</p>
                            </div>
                          )}
                          {!selectedAnswers[q.id] && (
                            <p className="text-xs text-gray-400 italic">Click an option to check your answer</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 text-sm text-gray-700">
                          {q.sampleAnswer && (
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Answer</p>
                              <p className="font-semibold text-gray-800 leading-relaxed whitespace-pre-line">{q.sampleAnswer}</p>
                            </div>
                          )}
                          {q.explanation && (
                            <div className={q.sampleAnswer ? "pt-2 border-t border-gray-100" : ""}>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Explanation</p>
                              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{q.explanation}</p>
                            </div>
                          )}
                          {q.keyPoints?.length > 0 && (
                            <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                              {q.keyPoints.map((kp: string, i: number) => (
                                <li key={i}>{kp}</li>
                              ))}
                            </ul>
                          )}
                          {q.hints?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-1">Hints:</p>
                              <ul className="list-disc list-inside space-y-1 text-xs text-gray-500">
                                {q.hints.map((h: string, i: number) => (
                                  <li key={i}>{h}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {!q.sampleAnswer && !q.explanation && !q.keyPoints?.length && !q.hints?.length && (
                            <p className="text-xs text-gray-400 italic">
                              No detailed answer available for this question.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400">
                Page {meta.page} of {meta.totalPages} · {meta.total.toLocaleString()} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPage(p => Math.max(1, p - 1));
                    setExpandedId(null); setRevealedId(null); setSelectedAnswers({});
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-sm font-bold text-gray-700 min-w-[4rem] text-center">
                  {meta.page} / {meta.totalPages}
                </span>
                <button
                  onClick={() => {
                    if (meta) setPage(p => Math.min(meta.totalPages, p + 1));
                    setExpandedId(null); setRevealedId(null); setSelectedAnswers({});
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={page >= meta.totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No category selected hint */}
      {!activeQType && (
        <div className="text-center py-12 text-gray-400">
          <div className="flex justify-center mb-3 text-gray-300">
            <MousePointerClick className="w-12 h-12" />
          </div>
          <div className="font-medium text-gray-600">Select a category above to start practising</div>
          <div className="text-sm mt-1">
            Each category shows questions filtered by type with difficulty &amp; company tags
          </div>
        </div>
      )}
    </div>
  );
}

// Suspense wrapper required for useSearchParams in App Router
export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded-lg w-48 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <PracticeContent />
    </Suspense>
  );
}
