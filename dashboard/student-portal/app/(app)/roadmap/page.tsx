"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, Lock, ChevronDown, ChevronUp,
  ExternalLink, Zap, Play, ChevronRight, BarChart2, ClipboardList,
  Trash2, Timer, Trophy, XCircle, Info
} from "lucide-react";
import { toast } from "sonner";
import { Suspense } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { useRoadmap, useCompanies } from "@/lib/hooks";
import { type UserRoadmapCompany } from "@/lib/constants";

// Credentialed fetcher for SWR — sends JWT cookie with every request
const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' })
    .then(r => r.json())
    .then(j => j.data ?? j);

// ─── Company logo helper ─────────────────────────────────────────────────────
// BUG-R6 FIX: Was a hardcoded map of only 10 companies.
// Now uses Google Favicons API for all 670+ companies with letter fallback.
function getLogoUrl(slug: string): string {
  return `https://www.google.com/s2/favicons?sz=64&domain=${slug.toLowerCase()}.com`;
}

function CompanyLogo({
  logoUrl,
  name,
  initial,
  fallbackClass,
}: {
  logoUrl: string;
  name: string;
  initial: string;
  fallbackClass: string;
}) {
  const [error, setError] = useState(false);
  
  if (logoUrl && !error) {
    return (
      <img
        className="w-7 h-7 object-contain"
        src={logoUrl}
        alt={name}
        onError={() => setError(true)}
      />
    );
  }
  
  return <span className={`text-base font-bold ${fallbackClass}`}>{initial}</span>;
}

// ─── Compact Active Roadmap Card ────────────────────────────────────────────
function ActiveRoadmapCard({
  company,
  isSelected,
  onClick,
  onRemove,
}: {
  company: UserRoadmapCompany;
  isSelected: boolean;
  onClick: () => void;
  onRemove?: (slug: string) => void;
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const logoUrl = getLogoUrl(company.slug);
  // BUG-R8 FIX: Was using w.questions.length (always 0 — API returns counts not arrays)
  // Now correctly uses totalQuestions/doneQuestions from the week object
  const totalQ = company.weeks.reduce((s, w) => s + (w.totalQuestions ?? 0), 0);
  const doneQ  = company.weeks.reduce((s, w) => s + (w.doneQuestions ?? 0), 0);
  const pct = totalQ > 0 ? Math.round((doneQ / totalQ) * 100) : 0;
  const daysElapsed = company.currentWeek * 7;
  const totalDays   = company.totalWeeks  * 7;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3 bg-white border rounded-xl cursor-pointer transition-all duration-150 shrink-0 ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-100 shadow-sm"
          : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
      }`}
      style={{ minWidth: 260 }}
    >
      {/* Logo */}
      <div className="w-9 h-9 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
        <CompanyLogo logoUrl={logoUrl} name={company.name} initial={company.initial} fallbackClass="text-blue-600" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-gray-900 truncate">{company.name}</span>
          {isConfirmingDelete ? (
            <div className="flex items-center gap-2 ml-2 shrink-0">
              <span className="text-[10px] text-red-500 font-medium">Remove?</span>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove?.(company.slug); }}
                className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded hover:bg-red-100 transition-colors font-semibold"
              >
                Yes
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(false); }}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors font-semibold"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(true); }}
              className="text-gray-300 hover:text-red-500 ml-2 shrink-0"
              aria-label="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] font-semibold text-gray-500 shrink-0">{daysElapsed}/{totalDays}d</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">Wk {company.currentWeek}/{company.totalWeeks} · {pct}% done</p>
      </div>
    </div>
  );
}

// ─── Compact Explore Roadmap Card ────────────────────────────────────────────
function ExploreRoadmapCard({ company }: { company: any }) {
  const logoUrl = getLogoUrl(company.slug);

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all shrink-0" style={{ minWidth: 240 }}>
      <div className="w-9 h-9 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
        <CompanyLogo logoUrl={logoUrl} name={company.name} initial={company.initial} fallbackClass="text-gray-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{company.name}</p>
        <p className="text-[10px] text-gray-500">{company.role} · {company.weeks}w plan</p>
        <p className="text-[10px] text-blue-600 font-semibold mt-0.5">{company.totalXP} XP available</p>
      </div>
      <Link
        href={`/companies/${company.slug}/practice`}
        onClick={(e) => e.stopPropagation()}
        className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-all shrink-0"
      >
        Explore
      </Link>
    </div>
  );
}



// ─── Main Roadmap Page Content ───────────────────────────────────────────────
function RoadmapContent() {
  const searchParams = useSearchParams();

  // Real roadmaps from API
  const { data: roadmapData, mutate, isLoading } = useRoadmap();
  const { data: companiesResp } = useCompanies();

  const allCompanies: any[] = Array.isArray(companiesResp) ? companiesResp : [];

  // BUG-R7 FIX: fetcher already unwraps .data, so roadmapData IS the raw array.
  // The old triple-unwrap (data?.data?.roadmaps ?? data?.roadmaps ?? data) was fragile.
  const companies: UserRoadmapCompany[] = (
    (Array.isArray(roadmapData) ? roadmapData : []) as any[]
  ).map((r: any) => {
    // Deduplicate questionIds across weeks at read time.
    // Old roadmaps (built with Promise.all) may have the same question stored in
    // multiple weeks. We strip duplicates here so WeekQuestions can use the stored
    // IDs directly — first week that claims a question wins.
    const seenIds = new Set<string>();
    const weeks = (r.weeks || r.tasks || []).map((w: any) => {
      const allIds = (w.questionIds || []).map((id: any) => id.toString());
      const uniqueIds = allIds.filter((id: string) => !seenIds.has(id));
      uniqueIds.forEach((id: string) => seenIds.add(id));
      return {
        weekNum: w.weekNumber || w.weekNum,
        topic: w.topicLabel || w.topic,
        totalQuestions: w.totalQuestions ?? 5,
        doneQuestions: w.doneQuestions ?? 0,
        status: w.status || "active",
        questions: w.questions || [],
        questionIds: uniqueIds,
      };
    });
    return {
      slug: r.companySlug,
      name: r.companyName,
      initial: r.companyName?.charAt(0) || "?",
      color: "from-blue-500/20 to-blue-500/5",
      role: r.roleName,
      totalWeeks: r.weeksCommitted ?? 12,
      currentWeek: r.currentWeek ?? 1,
      pctComplete: r.pctComplete ?? 0,
      roadmapId: r._id?.toString() ?? r.roadmapId ?? undefined,
      weeks,
    };
  });

  const initialSlug = searchParams.get("company") ?? companies[0]?.slug ?? "";
  const [activeSlug, setActiveSlug] = useState(initialSlug);

  useEffect(() => {
    const slug = searchParams.get("company");
    if (slug && companies.some((c) => c.slug === slug)) {
      setActiveSlug(slug);
    }
  }, [searchParams, companies]);

  const exploreSuggestions = allCompanies
    .filter((c: any) => !companies.some(rm => rm.slug === c.slug))
    .slice(0, 5)
    .map((c: any) => ({
      slug: c.slug,
      name: c.name,
      initial: c.name.charAt(0),
      // BUG-R11 FIX: c.type doesn't exist on Company model — use c.category
      role: c.category || "SDE-1",
      totalXP: (c.questionCount || 0) * 10,
      weeks: 8,
    }));

  const handleRemove = async (slug: string) => {
    try {
      const res = await fetch(`/api/user/me/roadmap/${slug}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete roadmap');
      mutate();
      toast.success("Roadmap removed successfully");
    } catch {
      toast.error("Failed to remove roadmap");
    }
    if (activeSlug === slug) {
      const remaining = companies.filter(c => c.slug !== slug);
      setActiveSlug(remaining[0]?.slug ?? "");
    }
  };

  const activeCompany = companies.find((c) => c.slug === activeSlug) ?? companies[0];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded-lg w-48 animate-pulse" />
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="min-w-[300px] h-52 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!activeCompany || companies.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="flex justify-center mb-3 text-gray-300">
          <ClipboardList className="w-12 h-12" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">No companies in your roadmap yet</h2>
        <p className="text-gray-500 text-sm mb-6">
          Go to the Companies page and click &quot;Add to Roadmap&quot;
        </p>
        <Link
          href="/companies"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Browse Companies
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── Page Header ── */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Roadmaps</h1>
        <p className="text-sm text-gray-500">
          Select a target company to view your personalized preparation path.
        </p>
      </header>

      {companies.length >= 5 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <div className="bg-green-100 text-green-600 rounded-full p-1 mt-0.5 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-green-800 font-bold text-sm">Roadmap Limit Reached</h3>
            <p className="text-green-700 text-xs mt-1 font-medium">We recommend focusing on up to 5 companies at a time for optimal preparation. Finish a roadmap to add more.</p>
          </div>
        </div>
      )}

      {/* ── Hero: Horizontally scrollable Active Roadmap Cards ── */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1">
        {companies.map((co) => (
          <ActiveRoadmapCard
            key={co.slug}
            company={co}
            isSelected={co.slug === activeSlug}
            onClick={() => setActiveSlug(co.slug)}
            onRemove={handleRemove}
          />
        ))}

        {/* Add company shortcut */}
        <Link
          href="/companies"
          className="min-w-[160px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors flex-shrink-0 px-5 py-8"
        >
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-current flex items-center justify-center">
            <span className="text-xl font-light leading-none">+</span>
          </div>
          <span className="text-xs font-semibold text-center">Add Roadmap</span>
        </Link>
      </div>

      {/* ── Explore More Roadmaps ── */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Explore More Roadmaps</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1">
          {exploreSuggestions.length > 0 ? (
            exploreSuggestions.map((co) => (
              <div key={co.slug}>
                <ExploreRoadmapCard company={co} />
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-400 py-4 w-full text-center border-2 border-dashed border-gray-100 rounded-xl">
              You have explored all available companies!
            </div>
          )}
        </div>
      </section>

      {/* ── Active Roadmap Detail View ── */}
      <div id="roadmap-curriculum">
        <h2 className="text-lg font-semibold text-gray-900 mb-5 border-t pt-8">Roadmap Curriculum</h2>
        <RoadmapCurriculumView company={activeCompany} />
      </div>
    </div>
  );
}

function WeekQuestions({
  companySlug,
  topic,
  totalQuestions,
  weeksCommitted,
  roadmapId,
  questionIds = [],
}: {
  companySlug: string;
  topic: string;
  totalQuestions: number;
  weeksCommitted: number;
  roadmapId?: string;
  questionIds?: string[];
}) {
  const minFrequency = weeksCommitted <= 4 ? 0.6 : weeksCommitted <= 6 ? 0.4 : weeksCommitted <= 8 ? 0.25 : weeksCommitted <= 12 ? 0.1 : 0;
  const limit = totalQuestions || 10;

  // When the stored roadmap has question IDs, fetch those specific questions.
  // This guarantees each week shows exactly its assigned questions, with no
  // cross-week duplicates. Fall back to topic+frequency query only when IDs
  // are absent (very old roadmaps predating BUG-R10).
  const hasStoredIds = questionIds.length > 0;
  const key = hasStoredIds
    ? `/api/roadmap/week-questions?ids=${[...questionIds].sort().join(',')}`
    : `/api/roadmap/week-questions?company=${companySlug}&topic=${encodeURIComponent(topic)}&limit=${limit}&minFrequency=${minFrequency}`;
  const { data: weekData, isLoading } = useSWR(key, fetcher);

  // Completed-questions: drives green checkmarks and persists across refresh
  const { data: completedData, mutate: mutateCompleted } = useSWR('/api/user/me/completed-questions', fetcher);

  // Optimistic local toggle state for immediate UI feedback
  const [localDone, setLocalDone] = useState<Record<string, boolean>>({});

  // weekData from /api/roadmap/week-questions returns { questions: [], total: N }
  const questions = weekData?.questions ?? [];
  const completedIds = new Set(
    (completedData?.completedQuestions ?? []).map((q: any) => q.questionId)
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-white border border-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        No questions found for {topic}. Questions may be added soon.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q: any) => {
        const qId = (q._id || q.id)?.toString();
        // BUG-B12 FIX: Prefer localDone for optimistic UI, fall back to server state
        const isDone = localDone[qId] ?? completedIds.has(qId);
        // BUG-R1 FIX: Question model fields — .problemSummary not .title, .difficulty not .diff
        // XP is derived from difficulty only (Easy=10 / Medium=25 / Hard=50) — same mapping
        // as XP_BY_DIFFICULTY in student.service.ts and the dashboard todayQs calculation.
        // Do NOT use q.xpValue: it defaults to 10 for all questions in many DB records,
        // which caused the mismatch between dashboard (25 XP) and roadmap (10 XP).
        const title = q.problemSummary || q.title || 'Untitled Question';
        const difficulty = q.difficulty || q.diff || 'Medium';
        const xp = difficulty === 'Hard' ? 50 : difficulty === 'Medium' ? 25 : 10;
        return (
          <div
            key={qId}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors cursor-pointer group gap-2 sm:gap-4"
            onClick={async () => {
              const wasDone = localDone[qId] ?? completedIds.has(qId);
              setLocalDone((p) => ({ ...p, [qId]: !wasDone })); // optimistic toggle
              try {
                if (!wasDone) {
                  const res = await fetch(`/api/questions/${qId}/complete`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roadmapId: roadmapId ?? null }),
                  });
                  if (!res.ok) throw new Error('Failed to mark complete');
                  const resJson = await res.json().catch(() => ({}));
                  // Show XP toast only if this is a fresh completion (not already done).
                  // Use the server-returned xpEarned (based on difficulty) rather than
                  // the client-computed xp (based on xpValue field) — they can differ.
                  if (!resJson?.data?.alreadyCompleted) {
                    const earned = resJson?.data?.xpEarned ?? xp;
                    toast.success(`+${earned} XP earned!`, { duration: 2000 });
                  }
                  // Revalidate so green checkmarks persist on next visit
                  await mutateCompleted();
                  // Also revalidate dashboard XP + roadmap progress
                  await Promise.all([
                    globalMutate('/api/dashboard'),
                    globalMutate('/api/progress'),
                    globalMutate('/api/user/me/roadmap'),
                    globalMutate('/api/user/me'),
                  ]);
                } else {
                  const res = await fetch(`/api/questions/${qId}/complete`, {
                    method: 'DELETE',
                    credentials: 'include',
                  });
                  if (!res.ok) throw new Error('Failed to unmark');
                  toast(`-${xp} XP removed`, { duration: 2000 });
                  await mutateCompleted();
                  await Promise.all([
                    globalMutate('/api/dashboard'),
                    globalMutate('/api/progress'),
                    globalMutate('/api/user/me/roadmap'),
                    globalMutate('/api/user/me'),
                  ]);
                }
              } catch {
                setLocalDone((p) => ({ ...p, [qId]: wasDone })); // rollback on error
              }
            }}
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${isDone ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                {isDone && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className={`font-semibold text-sm truncate ${isDone ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-blue-600'}`}>
                {title}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-8 sm:ml-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                difficulty === 'Easy' ? 'bg-green-50 text-green-700 border-green-200' :
                difficulty === 'Medium' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-red-50 text-red-700 border-red-200'
              }`}>
                {difficulty}
              </span>
              <span className="text-xs font-bold text-orange-500 flex items-center gap-0.5">
                +{xp} XP
              </span>
              <a
                href={q.leetcodeUrl || q.sourceUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-500 hover:text-blue-700 p-1 rounded-md hover:bg-blue-50 transition-colors"
                aria-label={`Open ${title} on LeetCode`}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RoadmapCurriculumView({ company }: { company: UserRoadmapCompany }) {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(company.currentWeek);

  // Sync expanded week when company changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setTimeout(() => setExpandedWeek(company.currentWeek), 0);
  }, [company.slug]);

  const logoUrl = getLogoUrl(company.slug);

  return (
    <div className="pb-12">
      {/* Hero Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={company.name} className="w-8 h-8 object-contain" />
            ) : (
              <span className={`text-xl font-bold text-blue-600`}>{company.initial}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-500 text-sm">{company.role} · {company.totalWeeks}-week plan</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-end md:items-center gap-6 w-full md:w-auto">
          {/* Overall Progress */}
          <div className="w-full md:w-64">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-2xl font-bold text-gray-900 leading-none">{company.pctComplete}%</span>
              <span className="text-xs text-gray-500 font-medium">{company.currentWeek}/{company.totalWeeks} weeks done</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${company.pctComplete}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/companies/${company.slug}/practice`}
              className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
            >
              <Play className="w-4 h-4 fill-white" /> Practice
            </Link>
            <Link
              href={`/companies/${company.slug}`}
              className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
            >
               Intel
            </Link>
          </div>
        </div>
      </div>

      {/* Curriculum List */}
      <div className="space-y-4">
        {company.weeks.map((week) => {
          const isExpanded = expandedWeek === week.weekNum;
          const isDone = week.status === "done";
          const isActive = week.status === "active";
          const isLocked = week.status === "locked";
          const pct = week.totalQuestions > 0 ? Math.round((week.doneQuestions / week.totalQuestions) * 100) : 0;

          return (
            <div 
              key={week.weekNum} 
              className={`border rounded-xl bg-white overflow-hidden transition-all ${
                isActive ? 'border-blue-200 shadow-sm' : 'border-gray-200'
              }`}
            >
              <div 
                className={`p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (!isLocked) setExpandedWeek(isExpanded ? null : week.weekNum);
                }}
              >
                <div className="flex items-center gap-4">
                  {isDone && <CheckCircle className="w-6 h-6 text-green-500" />}
                  {isActive && <Play className="w-6 h-6 text-blue-600 fill-blue-50" />}
                  {isLocked && <Lock className="w-6 h-6 text-gray-300" />}

                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        isDone ? 'text-gray-500' : isActive ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        WEEK {week.weekNum}
                      </span>
                      {isActive && (
                        <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                          Current
                        </span>
                      )}
                    </div>
                    <h3 className={`font-bold text-base ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
                      {week.topic}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right w-28 hidden sm:block">
                    <div className="text-xs font-bold text-gray-700 mb-1">
                      {week.doneQuestions}/{week.totalQuestions}
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{pct}% done</span>
                      <div className="w-12 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${isDone ? 'bg-green-500' : isActive ? 'bg-blue-600' : 'bg-gray-300'}`} 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {!isLocked && (
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  )}
                  {isLocked && <Lock className="w-4 h-4 text-gray-300" />}
                </div>
              </div>

              {isExpanded && !isLocked && (
                <div className="border-t border-gray-100 bg-gray-50/30 p-5">
                  <WeekQuestions
                    companySlug={company.slug}
                    topic={week.topic}
                    totalQuestions={week.totalQuestions}
                    weeksCommitted={company.totalWeeks}
                    roadmapId={company.roadmapId}
                    questionIds={week.questionIds ?? []}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded-lg w-48 animate-pulse" />
          <div className="flex gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="min-w-[300px] h-52 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <RoadmapContent />
    </Suspense>
  );
}
