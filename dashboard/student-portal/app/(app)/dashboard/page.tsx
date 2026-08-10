"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity, Trophy, ExternalLink,
  Clock, TrendingUp, ChevronRight, Zap
} from "lucide-react";
import { toast } from "sonner";
import useSWR, { mutate as globalMutate } from "swr"; // BUG-FIX A2: import globalMutate for XP badge sync

// BUG-T4 FIX: Import completeQuestion mutation
import { useDashboard, completeQuestion } from "@/lib/hooks";

// BUG-D1 FIX: Replace unauthenticated local fetcher with credentialed one
// The original `const fetcher = (url) => fetch(url)...` had no credentials,
// causing /api/experiences to return 401 → expData was always the error JSON, not experiences
const credFetcher = (url: string) =>
  fetch(url, { credentials: 'include' })
    .then(r => r.json())
    .then(j => j.data ?? j);

// Prep Score — calculated from real product features only:
// 1. Practice consistency: problems solved vs. assigned (45%)
// 2. Day streak score: current streak / 30 × 100 (30%)
// 3. XP progress: xpEarned / maxXpForLevel × 100 (25%)
function calcPrepScore(solved: number, assigned: number, streak: number, xp: number, targetXp: number = 5000, targetStreak: number = 30): number {
  const practiceScore = Math.min((solved / Math.max(assigned, 1)) * 100, 100) * 0.45;
  const streakScore = Math.min((streak / targetStreak) * 100, 100) * 0.30;
  const xpScore = Math.min((xp / targetXp) * 100, 100) * 0.25;
  return Math.round(practiceScore + streakScore + xpScore);
}

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}


export default function DashboardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // Primary dashboard data
  const { data: apiData, isLoading, error } = useDashboard();
  // BUG-D1 FIX: Use credFetcher with credentials so JWT cookie is sent
  const { data: expData } = useSWR('/api/experiences?limit=3', credFetcher);
  // B07 FIX: Load already-completed questions so checkboxes persist across refresh
  const { data: completedData, mutate: mutateCompleted } = useSWR('/api/user/me/completed-questions', credFetcher);

  // B07 FIX: When completedData loads, pre-populate checked state from DB
  useEffect(() => {
    const completedIds: string[] = completedData?.completedQuestions?.map((q: any) => q.questionId) ?? [];
    if (completedIds.length > 0) {
      setChecked((prev) => {
        const next = { ...prev };
        completedIds.forEach((id) => { next[id] = true; });
        return next;
      });
    }
  }, [completedData]);

  // Only fire the error toast once when the error first appears, not on every re-render
  useEffect(() => {
    if (error) {
      toast.error("Could not load dashboard data. Showing cached view.");
    }
  }, [error]);

  // Map roadmaps to company cards
  const targetCompanies = (apiData?.roadmaps || []).map((r: any) => ({
    name: r.companyName,
    role: r.roleName,
    readiness: r.pctComplete,
    slug: r.companySlug,
    logoUrl: r.companyLogoUrl,
  }));

  const solved    = apiData?.stats?.problemsSolved   ?? 0;
  // BUG-D3 FIX: Use real totalAssigned from API — was companiesOnRoadmap * 20 (always wrong)
  const assigned  = apiData?.stats?.totalAssigned ?? (apiData?.stats?.companiesOnRoadmap ? apiData.stats.companiesOnRoadmap * 20 : 1);
  const streak    = apiData?.stats?.currentStreakDays ?? 0;
  const xp        = apiData?.stats?.xpTotal           ?? 0;
  const targetXp  = apiData?.stats?.targetXp          ?? 5000;
  const targetStreak = apiData?.stats?.targetStreak   ?? 30;
  const tasks     = apiData?.roadmaps ?? [];
  const prepScore = apiData?.stats?.prepScore ?? calcPrepScore(solved, assigned, streak, xp, targetXp, targetStreak);
  // BUG-D2 FIX: fullName is now in student object from API
  const studentName = apiData?.student?.fullName ?? "Student";
  // FIX: SWR credFetcher unwraps json.data so expData IS the array directly.
  // Slice to 3 max (API is called with ?limit=3 but safety check here too)
  const recentExperiences = (Array.isArray(expData) ? expData : (expData?.experiences ?? expData?.data ?? [])).slice(0, 3);
  // BUG-D5 FIX: latestActivity is now in stats object (API was returning it at top-level)
  const latestActivity = apiData?.stats?.latestActivity;

  // Create an array of 30 days for Activity Map
  const today = new Date();
  const thirtyDays = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    // BUG-D5 FIX: weeklyActivity is now in stats (was at top-level as recentActivity)
    const match = (apiData?.stats?.weeklyActivity || []).find((a: any) => a.date === dateStr);
    return match ? match.count : 0;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 animate-pulse">
        <div className="flex-1 min-w-0 space-y-6">
          {/* Activity bar skeleton */}
          <div className="h-5 bg-gray-100 rounded w-64" />
          {/* Company cards skeleton */}
          <section>
            <div className="h-5 bg-gray-100 rounded w-40 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-36" />
              ))}
            </div>
          </section>
          {/* Today tasks skeleton */}
          <section>
            <div className="h-5 bg-gray-100 rounded w-36 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </section>
        </div>
        {/* Right sidebar skeleton */}
        <div className="w-full lg:w-72 space-y-4">
          <div className="h-40 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0">
        {/* Activity bar */}
        {latestActivity ? (
          <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Latest Activity: Completed &quot;{latestActivity.title}&quot; {timeAgo(latestActivity.completedAt)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>No activity yet. Start your first task!</span>
          </div>
        )}

        {/* Target Companies */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Your Target Companies</h2>
            <Link href="/roadmap" className="text-sm text-blue-600 font-medium hover:underline">View All</Link>
          </div>
          {targetCompanies.length === 0 ? (
            <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
              You haven&apos;t added any company roadmaps yet. Go to <Link href="/companies" className="text-blue-600 font-medium hover:underline">Companies</Link> to add one.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {targetCompanies.map((co: any) => {
                return (
                  <div key={co.name} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow flex flex-col flex-shrink-0" style={{ minWidth: '220px', maxWidth: '240px' }}>
                    <div className="flex items-center justify-between mb-3 flex-1">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://www.google.com/s2/favicons?sz=64&domain=${co.slug}.com`}
                          alt={co.name}
                          className="w-10 h-10 rounded-lg shrink-0 object-contain bg-white border border-gray-100 p-1"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?sz=64&domain=example.com"; }}
                        />
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{co.name}</div>
                          <div className="text-xs text-gray-500">{co.role}</div>
                        </div>
                      </div>
                      {/* Circular readiness */}
                      <div className="relative w-12 h-12 shrink-0">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r="20" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                          <circle
                            cx="24" cy="24" r="20"
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="4"
                            strokeDasharray={`${co.readiness * 1.257} 125.7`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">
                          {co.readiness}%
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <Link
                        href={`/companies/${co.slug}`}
                        className="flex-1 text-center text-xs font-medium border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View Intel
                      </Link>
                      <Link
                        href={`/roadmap?company=${co.slug}`}
                        className="flex-1 text-center text-xs font-medium bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Roadmap
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Today's Tasks — per company, smart question count */}
        {tasks.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Today&apos;s Tasks</h2>
            </div>
            <div className="space-y-4">
              {(() => {
                // BUG-T6: If user targets only 1 company → show 5 questions, otherwise show 3
                const maxQPerCompany = tasks.length === 1 ? 5 : 3;
                return tasks.map((co: any, index: number) => (
                // BUG-T2/T3/T5 FIX: use co.companyName, co.currentWeek, co.currentDay, co.companySlug
                <div key={co.companySlug || `task-${index}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Company header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://www.google.com/s2/favicons?sz=32&domain=${co.companySlug}.com`}
                        alt={co.companyName}
                        className="w-5 h-5 rounded shrink-0 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      {/* BUG-T2 FIX: was co.company (undefined) — API sends co.companyName */}
                      <span className="font-semibold text-gray-900 text-sm">{co.companyName}</span>
                      {/* BUG-T3 FIX: was co.week (undefined) and co.day (undefined) */}
                      <span className="text-xs text-gray-500 bg-gray-200 rounded px-2 py-0.5 font-medium">
                        Week {co.currentWeek}, Day {co.currentDay ?? 1}
                      </span>
                    </div>
                    {/* BUG-T5 FIX: was co.slug (undefined) — API sends co.companySlug */}
                    <Link
                      href={`/roadmap?company=${co.companySlug}`}
                      className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
                    >
                      View Full Roadmap <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Questions — capped to maxQPerCompany */}
                  <div className="divide-y divide-gray-50">
                    {(co.questions || []).length === 0 ? (
                      <div className="px-5 py-4 text-sm text-gray-400 text-center">
                        No questions available for this week&apos;s topic yet.
                      </div>
                    ) : (co.questions || []).slice(0, maxQPerCompany).map((q: any) => (
                    <div
                      key={q.id}
                      className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={async () => {
                        const wasChecked = !!checked[q.id];
                        setChecked((c) => ({ ...c, [q.id]: true })); // always optimistically check
                        try {
                          if (!wasChecked) {
                            // Mark complete: save to DB, earn XP
                            const result: any = await completeQuestion(q.id, co._id);
                            await mutateCompleted(); // refresh completed list
                            if (!result?.alreadyCompleted) {
                              toast.success(`+${q.xp} XP earned!`, { duration: 2000 });
                            }
                            // completeQuestion already calls globalMutate('/api/dashboard')
                            // which will refresh the task list and remove this question
                          } else {
                            // Uncheck = call DELETE to remove completion & deduct XP
                            const res = await fetch(`/api/questions/${q.id}/complete`, {
                              method: 'DELETE',
                              credentials: 'include',
                              headers: { 'Content-Type': 'application/json' },
                            });
                            if (!res.ok) throw new Error('Failed to unmark');
                            setChecked((c) => ({ ...c, [q.id]: false }));
                            await mutateCompleted();
                            await globalMutate('/api/user/me'); // BUG-FIX A2: update navbar XP badge on uncheck
                            toast(`-${q.xp} XP removed`, { duration: 2000 });
                          }
                        } catch (err: any) {
                          // Only rollback on genuine errors (not idempotent already-completed)
                          if (!err.message?.includes('already')) {
                            setChecked((c) => ({ ...c, [q.id]: wasChecked }));
                            toast.error(err.message ?? 'Failed to update question');
                          }
                        }
                      }}
                    >
                      {/* BUG-FIX A4: removed checkbox button — row onClick + strike-through span are the completion UI */}
                      <span className={`flex-1 text-sm ${checked[q.id] ? "line-through text-gray-400" : "text-gray-900 font-medium"}`}>
                        {q.title}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-medium shrink-0">
                        <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        {q.xp} XP
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${
                        q.difficulty === "Easy" ? "bg-green-50 text-green-700" :
                        q.difficulty === "Medium" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600"
                      }`}>
                        {q.difficulty}
                      </span>
                      {q.leetcodeUrl ? (
                        <a
                          href={q.leetcodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0 hover:text-blue-500" />
                        </a>
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5 text-gray-200 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

              </div>
            ));
            })()}
          </div>
        </section>
        )}

        {/* Recent Interview Reports — from real API */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Interview Reports</h2>
            <Link href="/submit" className="text-sm text-blue-600 font-medium hover:underline">Browse All</Link>
          </div>
          {recentExperiences.length === 0 ? (
            <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
              No interview reports yet. <Link href="/submit" className="text-blue-600 font-medium hover:underline">Be the first to share yours.</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentExperiences.map((r: any) => (
                <Link
                  key={r._id}
                  href={`/submit?expand=${r._id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://www.google.com/s2/favicons?sz=64&domain=${r.companySlug}.com`}
                      alt={r.companySlug}
                      className="w-8 h-8 rounded-lg shrink-0 object-contain bg-white border border-gray-100 p-0.5"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?sz=64&domain=example.com"; }}
                    />
                    <span className="font-semibold text-gray-900 text-sm capitalize">{r.companySlug}</span>
                    <span className="ml-auto text-xs text-gray-400">{r.outcome === 'offer' ? 'Offer' : r.outcome}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs rounded px-2 py-0.5">{r.roundsCount} Rounds</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{r.role}</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="bg-gray-100 text-gray-600 text-xs rounded px-2 py-0.5">{r.overallDifficulty}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs rounded px-2 py-0.5">{r.outcome}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Right Panel ── */}
      <aside className="hidden xl:block w-64 shrink-0 space-y-4">
        {/* Prep Score */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-900 mb-1 uppercase tracking-wide">Prep Score</h3>
          <p className="text-[10px] text-gray-400 mb-4">Based on practice, streak &amp; XP progress</p>
          <div className="flex justify-center mb-3">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                <circle cx="48" cy="48" r="40" fill="none"
                  stroke={prepScore >= 70 ? "#10B981" : prepScore >= 40 ? "#3B82F6" : "#F59E0B"}
                  strokeWidth="8"
                  strokeDasharray={`${(prepScore / 100) * 251} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{prepScore}%</span>
              </div>
            </div>
          </div>
          {/* Score breakdown */}
          <div className="space-y-2">
            {[
              { label: "Practice", val: Math.round(Math.min((solved / Math.max(assigned, 1)) * 100, 100)), color: "bg-blue-500" },
              { label: "Streak", val: Math.round(Math.min((streak / targetStreak) * 100, 100)), color: "bg-indigo-500" },
              { label: "XP Progress", val: Math.round(Math.min((xp / targetXp) * 100, 100)), color: "bg-violet-500" },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{label}</span><span className="font-medium text-gray-700">{val}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className={`h-1.5 ${color} rounded-full`} style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{streak}</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Day Streak</div>
        </div>

        {/* XP Badge */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{xp.toLocaleString()}</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">XP Earned</div>
        </div>

        {/* Activity Map */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Activity Map</h3>
            <span className="text-xs text-gray-400">Last 30 Days</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="text-[10px] text-gray-400 text-center">{d}</div>
            ))}
            {(() => {
              // Find what day-of-week the first of our 30 days fell on
              // JS getDay(): 0=Sun,1=Mon...6=Sat → Mon-first offset: Mon=0, ..., Sun=6
              const firstDay = new Date(today);
              firstDay.setDate(firstDay.getDate() - 29);
              const mondayOffset = (firstDay.getDay() + 6) % 7;
              // Prepend empty cells so first data cell lands on correct column
              const padded = [...Array(mondayOffset).fill(-1), ...thirtyDays];
              return padded.map((count, i) =>
                count === -1 ? (
                  <div key={`pad-${i}`} className="h-3 w-full" />
                ) : (
                  <div
                    key={i}
                    className={`h-3 w-full rounded-sm ${
                      count >= 5 ? "bg-green-700" :
                      count >= 3 ? "bg-green-500" :
                      count >= 1 ? "bg-green-300" : "bg-gray-100"
                    }`}
                    title={count > 0 ? `${count} problems solved` : 'No activity'}
                  />
                )
              );
            })()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400">
            <span>Less</span>
            {["bg-gray-100", "bg-green-300", "bg-green-500", "bg-green-700"].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">Problems Solved</h3>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold text-gray-900">{solved}</span>
              <span className="text-sm text-gray-400 ml-1">/ {assigned}</span>
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full mt-3">
            <div
              className="h-1.5 bg-green-500 rounded-full"
              style={{ width: `${Math.min((solved / Math.max(assigned, 1)) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">Assigned roadmap problems</p>
        </div>
      </aside>
    </div>
  );
}
