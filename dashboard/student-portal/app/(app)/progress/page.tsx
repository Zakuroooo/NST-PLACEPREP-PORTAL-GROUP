"use client";
import { useMemo } from "react";
import Link from "next/link"; // BUG-FIX D1: for clickable company name links
import { useRouter } from "next/navigation";
import { TrendingUp, Flame, Trophy, Zap, AlertCircle } from "lucide-react";
import { useProgress, useDashboard, useRoadmap } from "@/lib/hooks";
import ErrorState from "@/components/ErrorState";

// The components will use API data directly below

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

// Build a proper GitHub-style 52-week heatmap
// Using current date to calculate which month each cell belongs to
function buildHeatmap(activityMap: any[]) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 363); // 52 weeks back
  // Align to Sunday of that week
  start.setDate(start.getDate() - start.getDay());

  const actRecord = new Map((activityMap || []).map(a => [a.date, a.count]));

  const cells: { date: Date; level: number }[] = [];
  for (let i = 0; i < 364; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dLocal = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    const dateStr = dLocal.toISOString().split('T')[0];
    const count = actRecord.get(dateStr) || 0;
    
    let level = 0;
    if (count >= 5) level = 3;
    else if (count >= 3) level = 2;
    else if (count >= 1) level = 1;

    cells.push({ date: d, level });
  }
  return { cells, startDate: start };
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getHeatColor(level: number) {
  if (level === 0) return "bg-gray-100";
  if (level === 1) return "bg-green-300";
  if (level === 2) return "bg-green-500";
  return "bg-green-700";
}

export default function ProgressPage() {
  const router = useRouter();
  
  const { data: dashboardData, isLoading: loadingDash, error: errorDash, mutate: retryDash } = useDashboard();
  const { data: roadmapsData, isLoading: loadingRoadmaps, error: errorRoadmaps, mutate: retryRoadmaps } = useRoadmap();
  const { data: progressData, isLoading: loadingProgress, error: errorProgress, mutate: retryProgress } = useProgress();

  // FIX: dashboardData = { student, stats, roadmaps, recentActivity }
  // All KPI fields (problemsSolved, xpTotal, streak, etc.) live inside dashboardData.stats
  // The old `const kpis = dashboardData || {}` was reading them at the wrong level → all 0s.
  const kpis = dashboardData?.stats || {};
  const { cells, startDate } = buildHeatmap(kpis.weeklyActivity || dashboardData?.recentActivity || []);

  // Group into 52 weeks
  const weeks: typeof cells[] = [];
  for (let w = 0; w < 52; w++) {
    weeks.push(cells.slice(w * 7, w * 7 + 7));
  }

  // Month label positions (which week index each month starts)
  const monthPositions: { label: string; weekIdx: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const m = week[0].date.getMonth();
    if (m !== lastMonth) {
      monthPositions.push({ label: MONTH_LABELS[m], weekIdx: wi });
      lastMonth = m;
    }
  });

  const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

  const roadmaps = Array.isArray(roadmapsData) ? roadmapsData : (roadmapsData?.data || []);
  const topicProgress = Array.isArray(progressData) ? progressData : (progressData?.data || []);

  const companyReadiness = roadmaps.map((rm: any) => {
    const done = rm.weeks?.reduce((acc: number, w: any) => acc + (w.doneQuestions || 0), 0) || 0;
    const total = rm.weeks?.reduce((acc: number, w: any) => acc + (w.totalQuestions || 0), 0) || 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return {
      name: rm.companyName || rm.companySlug,
      slug: rm.companySlug,
      role: rm.roleName || 'SDE-1',
      pct: pct,
      done: done,
      total: total,
      last: rm.lastActive ? timeAgo(rm.lastActive) : "Just now",
      trend: pct === 100 ? "Ready" : "In Progress",
      trendColor: pct === 100 ? "text-green-600" : "text-blue-600"
    };
  });

  const colors = ["bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-cyan-500", "bg-sky-500", "bg-fuchsia-500"];
  const textColors = ["text-blue-600", "text-indigo-600", "text-violet-600", "text-cyan-600", "text-sky-600", "text-fuchsia-600"];

  const topics = topicProgress.map((tp: any, idx: number) => ({
    name: tp.topic,
    done: tp.completed,
    total: tp.total,
    pct: tp.percentage,
    color: colors[idx % colors.length],
    textColor: textColors[idx % textColors.length]
  }));

  const bgColors = ["bg-blue-50 border-blue-200", "bg-indigo-50 border-indigo-200", "bg-violet-50 border-violet-200"];
  
  // BUG-PR3 FIX: companyPct was `100 - studentMastery` (completely fabricated).
  // Now we look up the topic's frequencyPct from the student's active roadmap company.
  // If not found, we show null (rendered as "—") instead of a fake number.
  const roadmapTopicFrequency = useMemo(() => {
    const map: Record<string, number> = {};
    (companyReadiness || []).forEach((cr: any) => {
      (cr.topicFrequency || []).forEach((tf: any) => {
        if (tf.topicName && tf.frequencyPct != null) {
          // If topic appears in multiple companies, keep the max frequency
          map[tf.topicName] = Math.max(map[tf.topicName] ?? 0, tf.frequencyPct);
        }
      });
    });
    return map;
  }, [companyReadiness]);

  const weakAreas = [...topics].sort((a, b) => a.pct - b.pct).slice(0, 3).map((t, idx) => ({
    topic: t.name,
    pct: t.pct,
    companies: companyReadiness[0]?.name || "Top Companies",
    // BUG-PR3 FIX: use real frequencyPct from roadmap topicFrequency, not inverted formula
    companyPct: roadmapTopicFrequency[t.name] ?? null,
    color: t.textColor,
    bgColor: bgColors[idx % bgColors.length]
  }));

  // Error branch — previously a failed fetch on any of these three hooks left
  // the page on the spinner below forever, with no way to recover or see why.
  const firstError = errorDash ?? errorRoadmaps ?? errorProgress;
  if (firstError) {
    return (
      <ErrorState
        error={firstError}
        title="Couldn't load your progress"
        onRetry={() => {
          if (errorDash) retryDash();
          if (errorRoadmaps) retryRoadmaps();
          if (errorProgress) retryProgress();
        }}
      />
    );
  }

  if (loadingDash || loadingRoadmaps || loadingProgress) {
    return <div className="p-8 text-center text-gray-500">Loading progress...</div>;
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Progress</h1>

      {/* KPI Stats — compact horizontal pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: TrendingUp, color: "text-blue-600",   bg: "bg-blue-50",   val: kpis.problemsSolved || 0,                            label: "Problems Solved"  },
          { icon: Flame,      color: "text-indigo-600", bg: "bg-indigo-50", val: kpis.currentStreakDays || 0,                          label: "Day Streak"       },
          // BUG-PR1 FIX: was Math.max(currentStreakDays, 5) — fake! Now uses real bestStreakDays from DB
          { icon: Trophy,     color: "text-violet-600", bg: "bg-violet-50", val: kpis.bestStreakDays || kpis.currentStreakDays || 0,    label: "Best Streak"      },
          { icon: Zap,        color: "text-cyan-600",   bg: "bg-cyan-50",   val: (kpis.xpTotal || 0).toLocaleString(),                 label: "XP Earned"        },
        ].map(({ icon: Icon, color, bg, val, label }) => (
          <div key={label} className={`flex items-center gap-4 px-5 py-4 bg-white border border-gray-200 rounded-xl shadow-sm`}>
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 leading-tight">{val}</div>
              <div className="text-xs text-gray-500 font-medium">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Focus Areas — shown right after KPIs */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Focus Areas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {weakAreas.map((w) => (
            <div key={w.topic} className={`border rounded-xl p-5 ${w.bgColor}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className={`w-5 h-5 ${w.color}`} />
                <span className="font-semibold text-gray-900 text-sm">{w.topic}</span>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                Only {w.pct}% mastered.{' '}
                {w.companyPct != null
                  ? <>{w.companies} tests this in <strong>{w.companyPct}%</strong> of interviews.</>
                  : <>Focus on this topic to improve your placement odds.</>
                }
              </p>
              <button
                onClick={() => {
                  const targetSlug = roadmaps[0]?.companySlug || "google";
                  router.push(`/companies/${targetSlug}/practice?topic=${encodeURIComponent(w.topic)}`);
                }}
                className={`text-xs font-semibold px-3 py-2 rounded-lg border ${w.color} border-current hover:bg-white/50 transition-colors w-full`}
              >
                Practice Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Company Readiness */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Company Readiness</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Company", "Role", "Readiness", "Problems Done", "Last Practiced", "Trend"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companyReadiness.map((co: { name: string; slug: string; role: string; pct: number; done: number; total: number; last: string; trend: string; trendColor: string }) => (
                <tr key={co.name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://www.google.com/s2/favicons?sz=64&domain=${co.name.toLowerCase()}.com`}
                        alt={co.name}
                        className="w-7 h-7 rounded shrink-0 object-contain bg-white border border-gray-100 p-0.5"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?sz=64&domain=example.com"; }}
                      />
                      {/* BUG-FIX D1: wrap company name in Link to its practice page */}
                      <Link
                        href={`/companies/${co.slug}/practice`}
                        className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                      >
                        {co.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{co.role}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${co.pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-8">{co.pct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{co.done}/{co.total.toLocaleString()}</td>
                  <td className="px-5 py-4 text-gray-500">{co.last}</td>
                  <td className={`px-5 py-4 font-medium ${co.trendColor}`}>{co.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Topic Mastery */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Topic Mastery</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          {topics.map((t: { name: string; done: number; total: number; pct: number; color: string; textColor: string }) => (
            <div key={t.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">{t.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{t.done}/{t.total}</span>
                  <span className={`text-xs font-semibold ${t.textColor} w-10 text-right`}>{t.pct}%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div className={`h-2 ${t.color} rounded-full transition-all`} style={{ width: `${t.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GitHub-style Activity Heatmap — exactly 52 weeks × 7 days */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Activity — Past Year</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
            <div className="min-w-[700px] relative">
              {/* Month labels */}
              <div className="flex mb-1 pl-8 relative h-4">
                {monthPositions.map(({ label, weekIdx }) => (
                  <div
                    key={label + weekIdx}
                    className="text-[10px] text-gray-400 absolute top-0"
                    style={{ left: `calc(2rem + ${weekIdx * (12 + 2)}px)` }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex gap-0.5 mt-2">
                {/* Day labels */}
                <div className="flex flex-col gap-0.5 mr-1">
                  {DAY_LABELS.map((d, i) => (
                    <div key={i} className="text-[9px] text-gray-400 h-3 flex items-center w-6 justify-end pr-1">{d}</div>
                  ))}
                </div>
                {/* Weeks */}
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((cell, di) => (
                      <div
                        key={di}
                        title={`${cell.date.toDateString()} — ${cell.level === 0 ? "No activity" : cell.level === 1 ? "Light" : cell.level === 2 ? "Moderate" : "Active"}`}
                        className={`w-3 h-3 rounded-sm cursor-default ${getHeatColor(cell.level)}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-gray-400">
            <span>Less</span>
            {["bg-gray-100", "bg-green-300", "bg-green-500", "bg-green-700"].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </section>
    </div>
  );
}
