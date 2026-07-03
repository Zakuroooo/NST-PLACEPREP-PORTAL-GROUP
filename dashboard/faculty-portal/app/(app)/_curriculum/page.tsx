import { notFound } from "next/navigation";

export default function CurriculumPage() {
  notFound();
}

// "use client";

// import { useState, useEffect } from "react";
// import { ChevronDown, Upload, Download, AlertTriangle, Scale, CheckCircle, X } from "lucide-react";
// import { mockCurriculumCoverage, computeOverall } from "@/lib/mock-data";

// function getColorClass(val: number) {
//   if (val < 40) return "bg-red-50 text-red-600 border border-red-200";
//   if (val <= 70) return "bg-amber-50 text-amber-600 border border-amber-200";
//   return "bg-emerald-50 text-emerald-600 border border-emerald-200";
// }

// export default function CurriculumPage() {
//   const [showUploadModal, setShowUploadModal] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const t = setTimeout(() => setIsLoading(false), 500);
//     return () => clearTimeout(t);
//   }, []);

//   return (
//     <div className="max-w-6xl pb-20">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
//         <div>
//           <h1 className="text-xl font-bold text-gray-900 mb-4">Curriculum Gap Matrix</h1>
          
//           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//             <div className="max-w-3xl">
//               <p className="text-sm text-gray-500">
//                 Analyze the alignment between current academic curriculum and industry expectations across different company tiers. Values indicate percentage of required syllabus covered.
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center gap-3 shrink-0 self-start md:self-end">
//           <div className="hidden lg:flex items-center gap-2">
//             <button className="flex items-center gap-1 text-sm font-medium text-gray-600 bg-white px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors">
//               Batch: 2024 <ChevronDown className="w-4 h-4 text-gray-400" />
//             </button>
//             <button className="flex items-center gap-1 text-sm font-medium text-gray-600 bg-white px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors">
//               Branch: CS <ChevronDown className="w-4 h-4 text-gray-400" />
//             </button>
//           </div>
          
//           <button 
//             onClick={() => setShowUploadModal(true)}
//             className="flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white px-4 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors h-9"
//           >
//             <Upload className="w-4 h-4" />
//             <span className="hidden sm:inline">Upload Syllabus</span>
//           </button>
//           <button 
//             onClick={() => alert("PDF export coming soon")}
//             className="flex items-center gap-1.5 text-sm font-medium text-white bg-gray-900 px-4 py-1.5 rounded hover:bg-black transition-colors h-9"
//           >
//             <Download className="w-4 h-4" />
//             <span className="hidden sm:inline">Export PDF</span>
//           </button>
//         </div>
//       </div>

//       {/* Legend */}
//       <div className="flex items-center justify-end gap-4 mb-4">
//         <div className="flex items-center gap-3 text-xs font-medium bg-white px-3 py-2 rounded border border-gray-200 shadow-sm">
//           <div className="flex items-center gap-1.5">
//             <div className="w-3 h-3 bg-red-50 border border-red-200 rounded-sm"></div> 
//             <span className="text-gray-500">&lt; 40%</span>
//           </div>
//           <div className="flex items-center gap-1.5">
//             <div className="w-3 h-3 bg-amber-50 border border-amber-200 rounded-sm"></div> 
//             <span className="text-gray-500">40-70%</span>
//           </div>
//           <div className="flex items-center gap-1.5">
//             <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded-sm"></div> 
//             <span className="text-gray-500">&gt; 70%</span>
//           </div>
//         </div>
//       </div>

//       {isLoading ? (
//         <div className="space-y-4">
//           <div className="h-10 bg-gray-100 animate-pulse rounded w-1/3"></div>
//           <div className="h-64 bg-gray-100 animate-pulse rounded-xl"></div>
//           <div className="grid grid-cols-2 gap-4">
//             <div className="h-40 bg-gray-100 animate-pulse rounded-xl"></div>
//             <div className="h-40 bg-gray-100 animate-pulse rounded-xl"></div>
//           </div>
//         </div>
//       ) : (
//         <>
//       {/* Heatmap Table */}
//       <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6 flex flex-col">
//         <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
//           <h3 className="font-bold text-gray-900">Coverage Heatmap</h3>
//           <span className="px-2.5 py-1 bg-white text-gray-500 text-[11px] rounded border border-gray-200 font-semibold uppercase tracking-wider">
//             Academic Year 2023-24
//           </span>
//         </div>
        
//         <div className="overflow-x-auto">
//           <table className="w-full text-left border-collapse min-w-[700px]">
//             <thead>
//               <tr className="text-xs uppercase tracking-wider font-bold text-gray-500 bg-gray-50 border-b border-gray-200">
//                 <th className="px-5 py-4 sticky left-0 z-20 bg-gray-50 border-r border-gray-200 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Subject Area</th>
//                 <th className="px-4 py-4 text-center min-w-[120px]">FAANG</th>
//                 <th className="px-4 py-4 text-center min-w-[120px]">Indian Product</th>
//                 <th className="px-4 py-4 text-center min-w-[120px]">Indian Service</th>
//                 <th className="px-4 py-4 text-center min-w-[120px]">Startups</th>
//                 <th className="px-4 py-4 text-center min-w-[120px] border-l border-gray-200 bg-white">Overall</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100 text-sm">
//               {mockCurriculumCoverage.map((subject, idx) => {
//                 const overall = computeOverall(subject.coverage);
//                 return (
//                   <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
//                     <td className="px-5 py-4 sticky left-0 z-10 bg-white border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
//                       <div className="font-bold text-gray-900">{subject.subjectName}</div>
//                       <div className="text-xs text-gray-400 mt-0.5">{subject.courseCode}</div>
//                     </td>
//                     <td className="p-3">
//                       <div className={`h-11 rounded flex items-center justify-center font-bold text-sm transition-transform hover:scale-105 ${getColorClass(subject.coverage.faang)}`}>
//                         {subject.coverage.faang}%
//                       </div>
//                     </td>
//                     <td className="p-3">
//                       <div className={`h-11 rounded flex items-center justify-center font-bold text-sm transition-transform hover:scale-105 ${getColorClass(subject.coverage.indianProduct)}`}>
//                         {subject.coverage.indianProduct}%
//                       </div>
//                     </td>
//                     <td className="p-3">
//                       <div className={`h-11 rounded flex items-center justify-center font-bold text-sm transition-transform hover:scale-105 ${getColorClass(subject.coverage.indianService)}`}>
//                         {subject.coverage.indianService}%
//                       </div>
//                     </td>
//                     <td className="p-3">
//                       <div className={`h-11 rounded flex items-center justify-center font-bold text-sm transition-transform hover:scale-105 ${getColorClass(subject.coverage.startups)}`}>
//                         {subject.coverage.startups}%
//                       </div>
//                     </td>
//                     <td className="p-3 border-l border-gray-200 bg-gray-50/30">
//                       <div className="bg-white text-gray-900 border border-gray-200 rounded h-11 flex items-center justify-center font-bold text-sm shadow-sm">
//                         {overall}%
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       {/* Note: In a future iteration, these lists could be derived programmatically from the SubjectCoverage data by threshold. */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
//         {/* Critical Gaps */}
//         <div className="bg-white border-l-4 border-l-red-500 border border-gray-200 rounded-xl shadow-sm p-5 relative overflow-hidden group">
//           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
//             <AlertTriangle className="w-16 h-16 text-red-500" />
//           </div>
//           <div className="flex items-center gap-2 mb-3">
//             <div className="bg-red-50 p-1.5 rounded-md text-red-600">
//               <AlertTriangle className="w-4 h-4" />
//             </div>
//             <h4 className="font-bold text-gray-900">Critical Gaps</h4>
//           </div>
//           <p className="text-xs text-gray-500 mb-4 leading-relaxed">
//             Syllabus areas completely missing required industry context.
//           </p>
//           <ul className="space-y-2.5 text-sm text-gray-900 font-medium">
//             <li className="flex items-center justify-between">
//               <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Scalability & Microservices</span> 
//               <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-semibold tracking-wide">Sys Design</span>
//             </li>
//             <li className="flex items-center justify-between">
//               <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Dynamic Programming (Adv)</span> 
//               <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-semibold tracking-wide">DSA</span>
//             </li>
//             <li className="flex items-center justify-between">
//               <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> React / Next.js Basics</span> 
//               <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-semibold tracking-wide">Web Dev</span>
//             </li>
//             <li className="flex items-center justify-between">
//               <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Graph Algorithms</span> 
//               <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-semibold tracking-wide">DSA</span>
//             </li>
//             <li className="flex items-center justify-between">
//               <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Cloud Deployment (AWS/GCP)</span> 
//               <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-semibold tracking-wide">Web Dev</span>
//             </li>
//           </ul>
//         </div>

//         {/* Over-indexed */}
//         <div className="bg-white border-l-4 border-l-amber-500 border border-gray-200 rounded-xl shadow-sm p-5 relative overflow-hidden group">
//           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
//             <Scale className="w-16 h-16 text-amber-500" />
//           </div>
//           <div className="flex items-center gap-2 mb-3">
//             <div className="bg-amber-50 p-1.5 rounded-md text-amber-600">
//               <Scale className="w-4 h-4" />
//             </div>
//             <h4 className="font-bold text-gray-900">Over-indexed</h4>
//           </div>
//           <p className="text-xs text-gray-500 mb-4 leading-relaxed">
//             Areas receiving disproportionate academic focus vs industry need.
//           </p>
//           <ul className="space-y-3.5 text-sm text-gray-900 font-medium">
//             <li className="flex flex-col gap-1.5">
//               <div className="flex justify-between items-center">
//                 <span>Legacy Desktop Apps</span> 
//                 <span className="text-[11px] text-gray-500 font-medium">80% Time</span>
//               </div>
//               <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
//                 <div className="bg-amber-400 h-full w-[80%] rounded-full"></div>
//               </div>
//             </li>
//             <li className="flex flex-col gap-1.5">
//               <div className="flex justify-between items-center">
//                 <span>Theory of Computation</span> 
//                 <span className="text-[11px] text-gray-500 font-medium">65% Time</span>
//               </div>
//               <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
//                 <div className="bg-amber-400 h-full w-[65%] rounded-full"></div>
//               </div>
//             </li>
//             <li className="flex flex-col gap-1.5">
//               <div className="flex justify-between items-center">
//                 <span>Microprocessors (8085)</span> 
//                 <span className="text-[11px] text-gray-500 font-medium">70% Time</span>
//               </div>
//               <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
//                 <div className="bg-amber-400 h-full w-[70%] rounded-full"></div>
//               </div>
//             </li>
//           </ul>
//         </div>

//         {/* Well Aligned */}
//         <div className="bg-white border-l-4 border-l-emerald-500 border border-gray-200 rounded-xl shadow-sm p-5 relative overflow-hidden group">
//           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
//             <CheckCircle className="w-16 h-16 text-emerald-500" />
//           </div>
//           <div className="flex items-center gap-2 mb-3">
//             <div className="bg-emerald-50 p-1.5 rounded-md text-emerald-600">
//               <CheckCircle className="w-4 h-4" />
//             </div>
//             <h4 className="font-bold text-gray-900">Well Aligned</h4>
//           </div>
//           <p className="text-xs text-gray-500 mb-4 leading-relaxed">
//             Strong syllabus correlation with hiring requirements.
//           </p>
//           <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
//             <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
//               <CheckCircle className="w-3.5 h-3.5" /> SQL Queries
//             </span>
//             <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
//               <CheckCircle className="w-3.5 h-3.5" /> OOPS Concepts
//             </span>
//             <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
//               <CheckCircle className="w-3.5 h-3.5" /> Basic Arrays/Strings
//             </span>
//             <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
//               <CheckCircle className="w-3.5 h-3.5" /> OS Scheduling
//             </span>
//             <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
//               <CheckCircle className="w-3.5 h-3.5" /> TCP/IP Basics
//             </span>
//           </div>
//         </div>

//       </div>

//       {/* Simple Upload Modal */}
//       {showUploadModal && (
//         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-lg w-full max-w-sm shadow-xl p-5 relative">
//             <button 
//               onClick={() => setShowUploadModal(false)}
//               className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
//             >
//               <X className="w-4 h-4" />
//             </button>
//             <h3 className="font-bold text-gray-900 mb-4">Upload Syllabus</h3>
//             <p className="text-sm text-gray-500 mb-4">Upload a PDF or DOCX file to analyze gap coverage automatically.</p>
//             <input type="file" className="text-sm w-full mb-4 text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
//             <button 
//               onClick={() => setShowUploadModal(false)}
//               className="w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition-colors"
//             >
//               Start Analysis
//             </button>
//           </div>
//         </div>
//       )}
//       </>
//       )}
//     </div>
//   );
// }
