"use client";

import { FileText, Download, Play, CheckCircle2, History, Loader2, X } from "lucide-react";
import { mockReportHistory as initialReportHistory } from "@/lib/mock-data";
import { useState, useEffect } from "react";

export default function ReportsPage() {
  const [sections, setSections] = useState({
    gapMatrix: true,
    industryTrends: true,
    companyRankings: true,
    subjectBreakdown: false
  });
  
  const [reportHistory, setReportHistory] = useState(initialReportHistory);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const handleGenerate = () => {
    if (isGenerating) return;
    setIsGenerating(true);

    setTimeout(() => {
      // Convert camelCase section keys to capitalized names
      const selectedNames = Object.entries(sections)
        .filter(([_, val]) => val)
        .map(([key]) => {
          if (key === "gapMatrix") return "Gap Matrix";
          if (key === "industryTrends") return "Industry Trends";
          if (key === "companyRankings") return "Company Rankings";
          return "Subject Breakdown";
        });

      const newReportName = selectedNames.length > 0 
        ? `Report: ${selectedNames.join(" & ")}`
        : "Standard Curriculum Report";

      const newReport = {
        id: `rep-${Date.now()}`,
        name: newReportName,
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      };

      setReportHistory(prev => [newReport, ...prev]);
      setIsGenerating(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1500);
  };

  const handleDownload = (reportName: string) => {
    const reportText = `========================================================================
NEWTON SCHOOL OF TECHNOLOGY (NST)
PLACEPREP PORTAL - CURRICULUM INTELLIGENCE REPORT
========================================================================
Report Name:   ${reportName}
Export Type:   Faculty Audit Export (PDF Format Simulation)
Generated At:  ${new Date().toLocaleString()}

SECTIONS COVERED:
------------------------------------------------------------------------
- Curriculum Gap Matrix:       ${sections.gapMatrix ? "INCLUDED" : "EXCLUDED"}
- Industry Trends Breakdown:   ${sections.industryTrends ? "INCLUDED" : "EXCLUDED"}
- Company Rankings & Scores:   ${sections.companyRankings ? "INCLUDED" : "EXCLUDED"}
- Course Syllabus Diagnostics: ${sections.subjectBreakdown ? "INCLUDED" : "EXCLUDED"}

------------------------------------------------------------------------
STATUS: VERIFIED
Authorized by: Prof. Sharma
Newton School of Technology Academic Planning Unit
========================================================================`;

    const blob = new Blob([reportText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${reportName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_export.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 relative">
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-top-5 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Report generated successfully! Added to history list.</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Export Reports</h1>
        <p className="text-sm text-gray-500">Generate and download curriculum intelligence reports for academic review.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-gray-100 animate-pulse rounded-xl"></div>
          <div className="lg:col-span-1 h-96 bg-gray-100 animate-pulse rounded-xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Generate Report */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-full relative">
              {isGenerating && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-bold text-gray-900">Compiling report analytics...</p>
                </div>
              )}
              
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Generate New Report
                </h2>
                <p className="text-sm text-gray-500 mt-1">Select the sections you want to include in the PDF export.</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4 mb-8">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer peer appearance-none border checked:bg-blue-600 checked:border-blue-600 transition-colors"
                        checked={sections.gapMatrix}
                        onChange={() => setSections({...sections, gapMatrix: !sections.gapMatrix})}
                      />
                      <CheckCircle2 className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Curriculum Gap Matrix</p>
                      <p className="text-sm text-gray-500 leading-snug">Include the full breakdown of subjects vs industry demand.</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer peer appearance-none border checked:bg-blue-600 checked:border-blue-600 transition-colors"
                        checked={sections.industryTrends}
                        onChange={() => setSections({...sections, industryTrends: !sections.industryTrends})}
                      />
                      <CheckCircle2 className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Industry Trends</p>
                      <p className="text-sm text-gray-500 leading-snug">Include topic frequency charts and recent trend alerts.</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer peer appearance-none border checked:bg-blue-600 checked:border-blue-600 transition-colors"
                        checked={sections.companyRankings}
                        onChange={() => setSections({...sections, companyRankings: !sections.companyRankings})}
                      />
                      <CheckCircle2 className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Company Rankings</p>
                      <p className="text-sm text-gray-500 leading-snug">Include top hiring companies sorted by curriculum alignment.</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer peer appearance-none border checked:bg-blue-600 checked:border-blue-600 transition-colors"
                        checked={sections.subjectBreakdown}
                        onChange={() => setSections({...sections, subjectBreakdown: !sections.subjectBreakdown})}
                      />
                      <CheckCircle2 className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Full Subject Breakdown</p>
                      <p className="text-sm text-gray-500 leading-snug">Include detailed syllabus analysis for all subjects.</p>
                    </div>
                  </label>
                </div>
                
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-black text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 shadow-sm w-full justify-center md:w-auto disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-4 h-4" /> Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex flex-col">
              <div className="p-5 border-b border-gray-200 bg-gray-50">
                <h2 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                  <History className="w-5 h-5 text-gray-600" />
                  Previously Generated
                </h2>
              </div>
              
              <div className="p-5 flex-grow overflow-y-auto max-h-[400px]">
                <div className="space-y-4">
                  {reportHistory.map(report => (
                    <div key={report.id} className="border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all rounded-lg p-4 group animate-in slide-in-from-top-3 duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{report.date}</span>
                      </div>
                      <p className="font-bold text-gray-900 mb-3 text-sm leading-snug">{report.name}</p>
                      <button 
                        onClick={() => handleDownload(report.name)}
                        className="w-full text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold text-xs py-2 rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
