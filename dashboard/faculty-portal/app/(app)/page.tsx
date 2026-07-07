"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronDown, RefreshCw, 
  FileText, ArrowUp, 
  AlertTriangle, 
  Clock, CheckCircle2, 
  ArrowRight,
  Server, Cloud, Database, Radar,
  BookOpen, MessageSquare, Activity
} from "lucide-react";
import { computeOverall, mockCurriculumCoverage } from "@/lib/mock-data";
import { mockTrendAlerts } from "@/lib/mock-data";
import { mockFacultyMembers, CURRENT_FACULTY_ID } from "@/lib/facultyMembers";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<"current" | "previous">("current");
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);

  // Interactive dashboard states
  const [currentSemester, setCurrentSemester] = useState("Fall 2024");
  const [semesterDropdownOpen, setSemesterDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncToast, setShowSyncToast] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const handleSyncData = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setShowSyncToast(true);
      setTimeout(() => setShowSyncToast(false), 3000);
    }, 1200);
  };

  // Adjust statistics dynamically based on semester selection
  let avgModifier = 0;
  let overallActivityVal = 94;
  let doubtsModifier = 0;
  if (currentSemester === "Spring 2024") {
    avgModifier = -4;
    overallActivityVal = 88;
    doubtsModifier = -25;
  } else if (currentSemester === "Fall 2023") {
    avgModifier = -9;
    overallActivityVal = 81;
    doubtsModifier = -60;
  }

  const currentFaculty = mockFacultyMembers.find(f => f.id === CURRENT_FACULTY_ID) || mockFacultyMembers[0];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-700 font-semibold text-[11px] uppercase tracking-wide">Critical</span>;
      case "Moderate":
        return <span className="inline-flex items-center px-2 py-1 rounded bg-amber-100 text-amber-800 font-semibold text-[11px] uppercase tracking-wide">Moderate</span>;
      case "Aligned":
        return <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-100 text-emerald-700 font-semibold text-[11px] uppercase tracking-wide">Aligned</span>;
      default:
        return null;
    }
  };

  const getAlertDot = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-red-500";
      case "medium":
        return "border-amber-500";
      case "info":
        return "border-blue-500";
      default:
        return "border-gray-500";
    }
  };

  const getCoverageData = (subjectName: string) => {
    return mockCurriculumCoverage.find(s => s.subjectName === subjectName);
  };

  // We are asked to specifically render 3 rows in matrix preview:
  const sysDesign = getCoverageData("System Design");
  const cloudComp = getCoverageData("Cloud Computing");
  const dsa = getCoverageData("Data Structures & Algo");

  const getSubjectCoverageByName = (name: string) => {
    const searchName = name.toLowerCase();
    const coverage = mockCurriculumCoverage.find(s => {
      const sName = s.subjectName.toLowerCase();
      return sName.includes(searchName) || searchName.includes(sName) ||
        (searchName === "dsa" && sName.includes("data structures")) ||
        (searchName === "web development" && sName.includes("web dev")) ||
        (searchName === "web dev" && sName.includes("web dev"));
    });
    
    if (!coverage) {
      return {
        subjectName: name,
        courseCode: "CS101",
        alignment: 50,
        status: "Moderate",
        color: "#2563eb",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-600",
        id: name.toLowerCase().replace(/\s+/g, ""),
      };
    }
    
    let alignment = 0;
    if (coverage.subjectName.includes("Data Structures")) alignment = 95;
    else if (coverage.subjectName.includes("System Design")) alignment = 30;
    else if (coverage.subjectName.includes("DBMS")) alignment = 75;
    else if (coverage.subjectName.includes("Web Dev")) alignment = 60;
    else if (coverage.subjectName.includes("OS & Networks")) alignment = 80;
    else if (coverage.subjectName.includes("Cloud Computing")) alignment = 85;
    else alignment = computeOverall(coverage.coverage);
    
    let status = "Aligned";
    let color = "#10b981"; // emerald
    let bgColor = "bg-emerald-50";
    let borderColor = "border-emerald-200";
    let textColor = "text-emerald-600";
    
    if (alignment < 40) {
      status = "Critical";
      color = "#f43f5e"; // rose
      bgColor = "bg-rose-50";
      borderColor = "border-rose-200";
      textColor = "text-rose-600";
    } else if (alignment < 75) {
      status = "Moderate";
      color = "#2563eb"; // blue-600
      bgColor = "bg-blue-50";
      borderColor = "border-blue-200";
      textColor = "text-blue-600";
    }
    
    return {
      subjectName: coverage.subjectName,
      courseCode: coverage.courseCode,
      alignment,
      status,
      color,
      bgColor,
      borderColor,
      textColor,
      id: name.toLowerCase().replace(/\s+/g, ""),
    };
  };

  const subjectColors = [
    {
      color: "#10b981", // Emerald
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-600",
      hoverBg: "hover:bg-emerald-50/40 hover:border-emerald-300",
      activeBg: "bg-emerald-50 border-emerald-400 shadow-sm scale-[1.01]",
    },
    {
      color: "#2563eb", // Blue
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-600",
      hoverBg: "hover:bg-blue-50/40 hover:border-blue-300",
      activeBg: "bg-blue-50 border-blue-400 shadow-sm scale-[1.01]",
    },
    {
      color: "#f43f5e", // Rose
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      textColor: "text-rose-600",
      hoverBg: "hover:bg-rose-50/40 hover:border-rose-300",
      activeBg: "bg-rose-50 border-rose-400 shadow-sm scale-[1.01]",
    },
    {
      color: "#8b5cf6", // Purple
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-600",
      hoverBg: "hover:bg-purple-50/40 hover:border-purple-300",
      activeBg: "bg-purple-50 border-purple-400 shadow-sm scale-[1.01]",
    },
    {
      color: "#f59e0b", // Amber
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-600",
      hoverBg: "hover:bg-amber-50/40 hover:border-amber-300",
      activeBg: "bg-amber-50 border-amber-400 shadow-sm scale-[1.01]",
    },
    {
      color: "#06b6d4", // Cyan
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
      textColor: "text-cyan-600",
      hoverBg: "hover:bg-cyan-50/40 hover:border-cyan-300",
      activeBg: "bg-cyan-50 border-cyan-400 shadow-sm scale-[1.01]",
    },
  ];

  const resolvedSubjects = currentFaculty.subjects
    .map(getSubjectCoverageByName)
    .sort((a, b) => a.courseCode.localeCompare(b.courseCode))
    .map((sub, idx) => {
      const palette = subjectColors[idx % subjectColors.length];
      return {
        ...sub,
        color: palette.color,
        bgColor: palette.bgColor,
        borderColor: palette.borderColor,
        textColor: palette.textColor,
        hoverBg: palette.hoverBg,
        activeBg: palette.activeBg,
      };
    });

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Curriculum Intelligence Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time alignment between academic programs and industry hiring requirements.</p>
        </div>
        <div className="flex gap-3 relative">
          {/* Semester Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setSemesterDropdownOpen(!semesterDropdownOpen)}
              className="bg-white border border-gray-300 text-gray-700 font-medium text-sm py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {currentSemester} <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${semesterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {semesterDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-100">
                {["Fall 2024", "Spring 2024", "Fall 2023"].map((sem) => (
                  <button
                    key={sem}
                    onClick={() => {
                      setCurrentSemester(sem);
                      setSemesterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors ${currentSemester === sem ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'}`}
                  >
                    {sem}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={handleSyncData}
            disabled={isSyncing}
            className="bg-black text-white font-medium text-sm py-2 px-4 rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      {showSyncToast && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-top-5 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Curriculum alignment data synced successfully!</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
            <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
            <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
            <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
          </div>
          <div className="h-44 bg-gray-100 animate-pulse rounded-xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-100 animate-pulse rounded-xl"></div>
            <div className="lg:col-span-1 h-96 bg-gray-100 animate-pulse rounded-xl"></div>
          </div>
        </div>
      ) : (
        <>
      {/* Top Row: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Subjects — LeetCode Open-Arc Donut Style */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative col-span-1 lg:col-span-2 hover:border-blue-500 hover:shadow-md transition-all duration-200">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Assigned Subjects
            </h3>
            <span className="text-blue-700 bg-blue-50 text-[10px] px-2.5 py-0.5 rounded-full font-semibold border border-blue-100 uppercase tracking-wider">
              Curriculum Map
            </span>
          </div>

          <div className="flex items-center gap-8">
            {/* 270° Open-Arc Donut Ring */}
            <div className="relative flex items-center justify-center shrink-0 w-40 h-40 p-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 120 120">
                {/*
                  270° arc: circumference = 2π*50 = 314.16
                  270° portion = 314.16 * 3/4 = 235.62
                  Rotation 135° so the gap sits at the bottom.
                  All circles share transform="rotate(135, 60, 60)"
                */}

                {/* ── DEFAULT STATE: dynamic segments ── */}
                {/* Gray track (270°) */}
                <circle
                  cx="60" cy="60" r="50"
                  fill="transparent"
                  stroke="#C4C9D4"
                  strokeWidth="8"
                  strokeDasharray="235.62 314.16"
                  strokeLinecap="round"
                  transform="rotate(135, 60, 60)"
                  style={{
                    opacity: hoveredSubject === null ? 1 : 0,
                    transition: "opacity 0.35s ease",
                  }}
                />

                {(() => {
                  let accumulatedOffset = 0;
                  return resolvedSubjects.map((sub, idx) => {
                    const totalMax = resolvedSubjects.length * 100;
                    const gap = 2.5;
                    const arcLen = (sub.alignment / totalMax) * 235.62;
                    const offset = accumulatedOffset;
                    
                    // Increment offset for the next segment
                    accumulatedOffset += arcLen + gap;
                    
                    return (
                      <circle
                        key={`def-${sub.id}`}
                        cx="60" cy="60" r="50"
                        fill="transparent"
                        stroke={sub.color}
                        strokeWidth="8"
                        strokeDasharray={`${arcLen} 314.16`}
                        strokeDashoffset={`-${offset}`}
                        strokeLinecap="round"
                        transform="rotate(135, 60, 60)"
                        style={{
                          opacity: hoveredSubject === null ? 1 : 0,
                          transition: "opacity 0.35s ease",
                        }}
                      />
                    );
                  });
                })()}

                {/* ── HOVER STATE: dim track + single bright arc ── */}
                {/* Dim track shown when hovering */}
                <circle
                  cx="60" cy="60" r="50"
                  fill="transparent"
                  stroke="#C4C9D4"
                  strokeWidth="8"
                  strokeDasharray="235.62 314.16"
                  strokeLinecap="round"
                  transform="rotate(135, 60, 60)"
                  style={{
                    opacity: hoveredSubject !== null ? 0.7 : 0,
                    transition: "opacity 0.35s ease",
                  }}
                />

                {resolvedSubjects.map((sub) => {
                  const arcLen = (sub.alignment / 100) * 235.62;
                  return (
                    <circle
                      key={`hov-${sub.id}`}
                      cx="60" cy="60" r="50"
                      fill="transparent"
                      stroke={sub.color}
                      strokeWidth="10"
                      strokeDasharray={`${arcLen} 314.16`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      transform="rotate(135, 60, 60)"
                      style={{
                        opacity: hoveredSubject === sub.id ? 1 : 0,
                        filter: hoveredSubject === sub.id ? `drop-shadow(0 0 5px ${sub.color}bb)` : "none",
                        transition: "opacity 0.35s ease",
                      }}
                    />
                  );
                })}
              </svg>

              {/* Center Stats */}
              <div className="absolute flex flex-col items-center justify-center text-center px-2" style={{ transition: "all 0.3s ease" }}>
                {hoveredSubject === null ? (
                  <>
                    <span className="text-3xl font-black text-gray-900 leading-tight">{resolvedSubjects.length}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Subjects</span>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1">
                      {Math.round(resolvedSubjects.reduce((acc, s) => acc + s.alignment, 0) / resolvedSubjects.length) + avgModifier}% Avg
                    </span>
                  </>
                ) : (
                  (() => {
                    const activeSub = resolvedSubjects.find(s => s.id === hoveredSubject);
                    if (!activeSub) return null;
                    const whole = Math.floor(activeSub.alignment);
                    const decimal = Math.round((activeSub.alignment % 1) * 10);
                    return (
                      <>
                        <span className="text-[10px] text-gray-500 font-semibold mb-0.5">Alignment</span>
                        <div className="flex items-baseline gap-0">
                          <span className="text-[28px] font-black leading-none" style={{ color: activeSub.color }}>
                            {whole}
                          </span>
                          <span className="text-sm font-bold leading-none" style={{ color: activeSub.color }}>
                            .{decimal}%
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium mt-1.5">{activeSub.alignment} Completed</span>
                      </>
                    );
                  })()
                )}
              </div>
            </div>

            {/* Right Stat Cards */}
            <div className="flex flex-col gap-1.5 flex-grow max-h-[170px] overflow-y-auto pr-1">
              {resolvedSubjects.map((sub) => {
                const isHovered = hoveredSubject === sub.id;
                const isAnyHovered = hoveredSubject !== null;
                
                return (
                  <div
                    key={`card-${sub.id}`}
                    className={`rounded-lg px-3 py-2 flex items-center justify-between border transition-all duration-200 cursor-pointer ${
                      isHovered
                        ? sub.activeBg
                        : isAnyHovered
                        ? "bg-gray-50 border-gray-200 opacity-40"
                        : `bg-gray-50 border-gray-200 hover:bg-gray-100/50 ${sub.hoverBg}`
                    }`}
                    onMouseEnter={() => setHoveredSubject(sub.id)}
                    onMouseLeave={() => setHoveredSubject(null)}
                  >
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${sub.textColor}`}>{sub.subjectName}</p>
                      <p className="text-gray-900 font-bold text-xs">{sub.alignment}<span className="text-gray-400 font-normal text-[10px]">/100</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 font-medium">{sub.courseCode}</p>
                      <p className={`text-[9px] font-bold ${sub.textColor}`}>
                        {sub.status} {sub.status === "Aligned" ? "✓" : sub.status === "Critical" ? "⚠" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {/* Doubts Solved */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all duration-200 hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-emerald-700 bg-emerald-50 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-emerald-100 uppercase tracking-wider">
                +{currentFaculty.doubtsSolvedThisMonth} this month
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Doubts Solved</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{currentFaculty.doubtsSolvedAllTime + doubtsModifier}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-medium pt-2 border-t border-gray-100 mt-2">
            Excellent resolution rate
          </div>
        </div>

        {/* Overall Activity & Status */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-amber-500 transition-all duration-200 hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-amber-700 bg-amber-50 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-amber-100 uppercase tracking-wider">
                Top 5% Faculty
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Overall Activity</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{overallActivityVal}%</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
            <span className="text-gray-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Synced {isSyncing ? "just now" : "2h ago"}
            </span>
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> Live
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Faculty Activity Tracker
            </h3>
            <p className="text-xs text-gray-500">
              {selectedYear === "current" ? "145 doubts resolved and 12 mock sessions in the past year" : "98 doubts resolved and 8 mock sessions in the previous year"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs font-semibold text-gray-600 w-full sm:w-auto">
            <div className="flex gap-4">
              <span>Total active days: <strong className="text-gray-900">{selectedYear === "current" ? "112" : "84"}</strong></span>
              <span>•</span>
              <span>Max streak: <strong className="text-gray-900">{selectedYear === "current" ? "18 days" : "12 days"}</strong></span>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as "current" | "previous")}
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs py-1.5 px-3 rounded-lg transition-all outline-none cursor-pointer shadow-sm w-full sm:w-auto text-center"
            >
              <option value="current">Current Year</option>
              <option value="previous">Previous Year</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto pb-2 animate-fade-in flex justify-center">
          <div className="flex flex-col items-center">
            {/* Heatmap Grid grouped by months */}
            <div className="flex items-start">
              {/* Month Blocks */}
              <div className="flex gap-3.5">
                {[
                  { name: "Jul", weeksCount: 4, label: "Jul" },
                  { name: "Aug", weeksCount: 4, label: "Aug" },
                  { name: "Sep", weeksCount: 4, label: "Sep" },
                  { name: "Oct", weeksCount: 5, label: "Oct" },
                  { name: "Nov", weeksCount: 4, label: "Nov" },
                  { name: "Dec", weeksCount: 4, label: "Dec" },
                  { name: "Jan", weeksCount: 5, label: "Jan" },
                  { name: "Feb", weeksCount: 4, label: "Feb" },
                  { name: "Mar", weeksCount: 4, label: "Mar" },
                  { name: "Apr", weeksCount: 4, label: "Apr" },
                  { name: "May", weeksCount: 5, label: "May" },
                  { name: "Jun", weeksCount: 5, label: "Jun" }
                ].map((month, mIdx) => (
                  <div key={mIdx} className="flex flex-col items-center gap-2">
                    {/* Month Weeks Container */}
                    <div className="flex gap-[3px]">
                      {Array.from({ length: month.weeksCount }).map((_, wIdx) => (
                        <div key={wIdx} className="flex flex-col gap-[3px]">
                          {Array.from({ length: 7 }).map((_, dIndex) => {
                            // Seed based on selectedYear
                            const seed = selectedYear === "current" ? 13 : 17;
                            const val = (mIdx * 19 + wIdx * 7 + dIndex * seed) % 15;
                            let level = 0;
                            if (selectedYear === "previous") {
                              if (val === 1 || val === 4) level = 1;
                              if (val === 2) level = 2;
                              if (val === 8) level = 3;
                              if (val === 14) level = 4;
                            } else {
                              if (val === 2 || val === 5 || val === 9) level = 1;
                              if (val === 3 || val === 7) level = 2;
                              if (val === 8) level = 3;
                              if (val === 11) level = 4;
                            }
                            
                            return (
                              <div
                                key={dIndex}
                                className={`w-[9px] h-[9px] rounded-[1.5px] transition-all hover:scale-125 duration-100 cursor-pointer ${
                                  level === 1 ? "bg-emerald-100" :
                                  level === 2 ? "bg-emerald-300" :
                                  level === 3 ? "bg-emerald-500" :
                                  level === 4 ? "bg-emerald-700" :
                                  "bg-gray-100"
                                }`}
                                title={`${month.name} week ${wIdx + 1}, day ${dIndex + 1}: ${level === 0 ? "No" : level} activity`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    
                    {/* Month Label */}
                    <div className="h-6 flex items-center justify-center mt-1">
                      <span className="text-[10px] text-gray-400 font-bold tracking-wider">{month.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center items-center gap-1.5 text-[10px] text-gray-400 mt-3 font-medium">
          <span>Less</span>
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-gray-100" />
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald-100" />
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald-300" />
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald-500" />
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald-700" />
          <span>More</span>
        </div>
      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Panel: Gap Matrix Preview */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-gray-900">Curriculum Gap Matrix Preview</h2>
              {/* <Link href="/curriculum" className="text-blue-600 font-medium text-sm hover:underline flex items-center gap-1">
                View Full Matrix <ArrowRight className="w-4 h-4" />
              </Link>  */}
            </div>
            
            <div className="p-5 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wider font-bold text-gray-500">
                    <th className="py-3 px-4 w-1/3">Subject Area</th>
                    <th className="py-3 px-4">Industry Demand</th>
                    <th className="py-3 px-4">Curriculum Coverage</th>
                    <th className="py-3 px-4 text-right">Gap Severity</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  
                  {/* Row 1: System Design */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-700">
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{sysDesign?.subjectName || "System Design"}</p>
                          <p className="text-xs text-gray-500">{sysDesign?.courseCode || "CS402"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                          <div className="bg-gray-900 h-1.5 rounded-full" style={{ width: "95%" }}></div>
                        </div>
                        <span className="text-gray-600 text-xs font-medium">High</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                          <div className="bg-gray-400 h-1.5 rounded-full" style={{ width: "30%" }}></div>
                        </div>
                        <span className="text-gray-600 text-xs font-medium">Low</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {getSeverityBadge("Critical")}
                    </td>
                  </tr>

                  {/* Row 2: Cloud Computing */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-700">
                          <Cloud className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{cloudComp?.subjectName || "Cloud Computing"}</p>
                          <p className="text-xs text-gray-500">{cloudComp?.courseCode || "CS305"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                          <div className="bg-gray-900 h-1.5 rounded-full" style={{ width: "85%" }}></div>
                        </div>
                        <span className="text-gray-600 text-xs font-medium">High</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                          <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: "60%" }}></div>
                        </div>
                        <span className="text-gray-600 text-xs font-medium">Med</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {getSeverityBadge("Moderate")}
                    </td>
                  </tr>

                  {/* Row 3: Data Structures */}
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-700">
                          <Database className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Data Structures</p>
                          <p className="text-xs text-gray-500">{dsa?.courseCode || "CS201"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                          <div className="bg-gray-900 h-1.5 rounded-full" style={{ width: "90%" }}></div>
                        </div>
                        <span className="text-gray-600 text-xs font-medium">High</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                          <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: "95%" }}></div>
                        </div>
                        <span className="text-gray-600 text-xs font-medium">High</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {getSeverityBadge("Aligned")}
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel: Trend Alerts Feed */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex flex-col">
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Radar className="w-5 h-5 text-blue-600" />
                Recent Trend Alerts
              </h2>
            </div>
            
            <div className="p-5 flex-grow overflow-y-auto">
              <div className="space-y-6 ml-3 border-l-2 border-gray-100">
                {mockTrendAlerts.map((alert, index) => (
                  <div key={alert.id} className="relative pl-5">
                    <div className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-white border-[3px] ${getAlertDot(alert.severity)}`}></div>
                    <span className="text-xs text-gray-500 font-semibold block mb-1">
                      {alert.timeAgo} • {alert.source}
                    </span>
                    <p className="font-semibold text-gray-900 mb-1 leading-snug">
                      {alert.headline}
                    </p>
                    <p className="text-sm text-gray-500 mb-2 leading-relaxed">
                      {alert.description}
                    </p>
                    {alert.tags && alert.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {alert.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-gray-50 px-2 py-0.5 rounded text-gray-600 font-semibold border border-gray-200 uppercase tracking-wide">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              {/* <Link href="/trends" className="block w-full text-blue-600 font-medium text-sm py-2 rounded hover:bg-gray-100 transition-colors text-center border border-transparent hover:border-gray-200">
                View All Insights <ArrowRight className="w-4 h-4 inline-block ml-1 align-text-bottom" />
              </Link> */}
            </div>
          </div>
        </div>

      </div>
      </>
      )}
    </div>
  );
}
