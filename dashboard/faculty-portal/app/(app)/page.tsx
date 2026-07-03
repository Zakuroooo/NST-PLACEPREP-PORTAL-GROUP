"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronDown, RefreshCw, 
  FileText, ArrowUp, 
  AlertTriangle, 
  Clock, CheckCircle2, 
  ArrowRight,
  Server, Cloud, Database, Radar
} from "lucide-react";
import { mockCurriculumCoverage } from "@/lib/mock-data";
import { mockTrendAlerts } from "@/lib/mock-data";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

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

  // We are asked to specifically render 3 rows:
  // Row 1: System Design
  // Row 2: Cloud Computing
  // Row 3: Data Structures (maps to "Data Structures & Algo")
  const sysDesign = getCoverageData("System Design");
  const cloudComp = getCoverageData("Cloud Computing");
  const dsa = getCoverageData("Data Structures & Algo");

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Curriculum Intelligence Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time alignment between academic programs and industry hiring requirements.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-300 text-gray-700 font-medium text-sm py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
            Fall 2024 <ChevronDown className="w-4 h-4" />
          </button>
          <button className="bg-black text-white font-medium text-sm py-2 px-4 rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 shadow-sm">
            <RefreshCw className="w-4 h-4" /> Sync Data
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
            <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
            <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-100 animate-pulse rounded-xl"></div>
            <div className="lg:col-span-1 h-96 bg-gray-100 animate-pulse rounded-xl"></div>
          </div>
        </div>
      ) : (
        <>
      {/* Top Row: 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Subjects Analyzed */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-blue-600 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-gray-50 text-gray-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-emerald-700 bg-emerald-50 text-xs px-2 py-0.5 rounded flex items-center gap-1 font-semibold border border-emerald-100">
              <ArrowUp className="w-3 h-3" /> 2
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1 font-medium">Subjects Analyzed</p>
            <p className="text-3xl font-bold text-gray-900">12</p>
          </div>
        </div>

        {/* Critical Gaps Found */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-red-500 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-red-700 bg-red-50 text-xs px-2 py-0.5 rounded flex items-center gap-1 font-semibold border border-red-100">
              Needs Review
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1 font-medium">Critical Gaps Found</p>
            <p className="text-3xl font-bold text-gray-900">5</p>
          </div>
        </div>

        {/* Last Data Sync */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-gray-50 text-gray-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1 font-medium">Last Data Sync</p>
            <p className="text-3xl font-bold text-gray-900">2h ago</p>
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Automated sync active
            </p>
          </div>
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
              <Link href="/trends" className="block w-full text-blue-600 font-medium text-sm py-2 rounded hover:bg-gray-100 transition-colors text-center border border-transparent hover:border-gray-200">
                View All Insights <ArrowRight className="w-4 h-4 inline-block ml-1 align-text-bottom" />
              </Link>
            </div>
          </div>
        </div>

      </div>
      </>
      )}
    </div>
  );
}
