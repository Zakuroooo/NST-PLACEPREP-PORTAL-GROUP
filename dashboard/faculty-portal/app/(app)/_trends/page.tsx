import { notFound } from "next/navigation";

export default function CurriculumPage() {
  notFound();
}

// "use client";

// import { useState, useEffect } from "react";
// import { Radar, TrendingUp, TrendingDown, Minus } from "lucide-react";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
// import { mockTrendAlerts } from "@/lib/mock-data";

// const chartData = [
//   { month: "Jan", "System Design": 30, "Dynamic Programming": 65, "SQL": 40 },
//   { month: "Feb", "System Design": 35, "Dynamic Programming": 60, "SQL": 42 },
//   { month: "Mar", "System Design": 45, "Dynamic Programming": 55, "SQL": 45 },
//   { month: "Apr", "System Design": 55, "Dynamic Programming": 50, "SQL": 44 },
//   { month: "May", "System Design": 65, "Dynamic Programming": 45, "SQL": 48 },
//   { month: "Jun", "System Design": 75, "Dynamic Programming": 40, "SQL": 50 },
// ];

// export default function TrendsPage() {
//   const [activeFilter, setActiveFilter] = useState("All");
//   const filters = ["All", "FAANG", "Indian Product", "Indian Service", "Startups"];
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const t = setTimeout(() => setIsLoading(false), 500);
//     return () => clearTimeout(t);
//   }, []);


//   const getAlertDot = (severity: string) => {
//     switch (severity) {
//       case "high": return "border-red-500";
//       case "medium": return "border-amber-500";
//       case "info": return "border-blue-500";
//       default: return "border-gray-500";
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto pb-20">
//       {/* Page Header */}
//       <div className="mb-8">
//         <h1 className="text-2xl font-bold text-gray-900 mb-1">Industry Trends</h1>
//         <p className="text-sm text-gray-500">Track how interview patterns are shifting across companies and topics over time.</p>
//       </div>

//       {isLoading ? (
//         <div className="space-y-6">
//           <div className="h-64 bg-gray-100 animate-pulse rounded-xl"></div>
//           <div className="h-8 bg-gray-100 animate-pulse rounded-lg w-3/4"></div>
//           {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl"></div>)}
//         </div>
//       ) : (
//         <>
//       {/* Chart Section */}
//       <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-8">
//         <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
//           <TrendingUp className="w-5 h-5 text-blue-600" />
//           Topic Frequency Over Time
//         </h2>
//         <div className="h-[300px] w-full">
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
//               <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
//               <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
//               <Tooltip 
//                 contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', fontSize: '12px' }}
//                 cursor={{ stroke: '#E5E7EB', strokeWidth: 2 }}
//               />
//               <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
//               <Line type="monotone" dataKey="System Design" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
//               <Line type="monotone" dataKey="Dynamic Programming" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
//               <Line type="monotone" dataKey="SQL" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       {/* Feed Section */}
//       <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
//         <div className="p-5 border-b border-gray-200 bg-gray-50 flex flex-col gap-4">
//           <h2 className="font-bold text-gray-900 flex items-center gap-2">
//             <Radar className="w-5 h-5 text-blue-600" />
//             Live Insights Feed
//           </h2>
//           <div className="flex flex-wrap gap-2">
//             {filters.map(filter => (
//               <button 
//                 key={filter}
//                 onClick={() => setActiveFilter(filter)}
//                 className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
//                   activeFilter === filter 
//                     ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
//                     : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
//                 }`}
//               >
//                 {filter}
//               </button>
//             ))}
//           </div>
//         </div>
        
//         <div className="p-5 overflow-y-auto">
//           {/* Working filter! I've wired this up so clicking the buttons actually filters the alerts list. */}
//           <div className="space-y-8 ml-3 border-l-2 border-gray-100 pl-6 py-2">
//             {mockTrendAlerts
//               .filter(alert => activeFilter === "All" || alert.source.includes(activeFilter) || (activeFilter === "FAANG" && ["Meta", "Amazon", "Google"].some(s => alert.source.includes(s))))
//               .map((alert) => (
//               <div key={alert.id} className="relative">
//                 <div className={`absolute -left-[33px] top-0.5 w-4 h-4 rounded-full bg-white border-[3px] ${getAlertDot(alert.severity)}`}></div>
//                 <span className="text-xs text-gray-500 font-semibold block mb-1">
//                   {alert.timeAgo} • {alert.source}
//                 </span>
//                 <p className="font-semibold text-gray-900 mb-1 text-base leading-snug">
//                   {alert.headline}
//                 </p>
//                 <p className="text-sm text-gray-600 mb-3 leading-relaxed max-w-3xl">
//                   {alert.description}
//                 </p>
//                 {alert.tags && alert.tags.length > 0 && (
//                   <div className="flex gap-2 flex-wrap">
//                     {alert.tags.map(tag => (
//                       <span key={tag} className="text-[10px] bg-gray-50 px-2 py-0.5 rounded text-gray-600 font-semibold border border-gray-200 uppercase tracking-wide">
//                         {tag}
//                       </span>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ))}
            
//             {mockTrendAlerts.filter(alert => activeFilter === "All" || alert.source.includes(activeFilter) || (activeFilter === "FAANG" && ["Meta", "Amazon", "Google"].some(s => alert.source.includes(s)))).length === 0 && (
//               <div className="text-sm text-gray-500 py-4">No alerts found for this filter.</div>
//             )}
//           </div>
//         </div>
//       </div>
//       </>
//       )}
//     </div>
//   );
// }
