"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronRight, Plus, Check, XCircle } from "lucide-react";
import { useCompanies, useRoadmap } from "@/lib/hooks";
import AddToRoadmapModal from "@/components/modals/AddToRoadmapModal";

// BUG-FIX B2: corrected labels ("Indian Service" not "Service") and order
const FILTERS = ["All", "FAANG", "Product", "Service", "Startup"] as const;
type Filter = typeof FILTERS[number];

type Company = {
  _id?: string;
  slug: string;
  name: string;
  category?: string;
  type?: string;
  hiringStatus?: string;
  questionCount?: number;
  questions?: number;
  topTopic?: string;
};

export default function CompaniesPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [modalCompany, setModalCompany] = useState<Company | null>(null);
  const [showLimitToast, setShowLimitToast] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100); // BUG-FIX B1: paginate 100 at a time

  // BUG-FIX B1: reset visible count whenever filter or search changes
  useEffect(() => { setVisibleCount(100); }, [activeFilter, search]);

  // Real API data
  const { data: companiesData, isLoading } = useCompanies();
  const { data: roadmapData } = useRoadmap();

  // BUG-W3 FIX: fetcher unwraps .data, so companiesData is already the array
  const allCompanies: Company[] = Array.isArray(companiesData) ? companiesData : [];

  // BUG-W3 FIX: same for roadmapData — already a raw array from fetcher
  const roadmapSlugs: string[] = (Array.isArray(roadmapData) ? roadmapData : []).map(
    (r: any) => r.companySlug
  );


  // Category mapping from API → filter
  const categoryMatch = (co: Company): string[] => {
    const cat = (co.category ?? co.type ?? "").toLowerCase();
    if (cat.includes("faang") || cat === "maang") return ["FAANG"];
    if (cat.includes("product")) return ["Product"];
    if (cat.includes("startup")) return ["Startup"];
    if (cat.includes("service")) return ["Service"]; // BUG-FIX B2: match renamed chip
    return [];
  };

  const filtered = allCompanies.filter((c) => {
    const matchesFilter = activeFilter === "All" || categoryMatch(c).includes(activeFilter);
    const matchesSearch = !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAddClick = (co: Company, inRoadmap: boolean) => {
    if (inRoadmap) return;
    if (roadmapSlugs.length >= 5) {
      setShowLimitToast(true);
      setTimeout(() => setShowLimitToast(false), 3000);
      return;
    }
    setModalCompany(co);
  };

  const handleAdded = () => {
    // SWR will revalidate roadmap automatically
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Explore Companies</h1>
      <p className="text-sm text-gray-500 mb-6">
        View interview intel, round structure, and real questions. Add companies to your roadmap to track prep.
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a company..."
          className="w-full max-w-sm pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`text-sm font-medium px-4 py-1.5 rounded-full border transition-colors ${
              activeFilter === f
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse h-40" />
          ))}
        </div>
      )}

      {/* Company Grid */}
      {!isLoading && filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {search ? `No companies found for "${search}"` : "No companies available yet."}
        </div>
      ) : !isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.slice(0, visibleCount).map((co) => { // BUG-FIX B1: render only up to visibleCount
            const inRoadmap = roadmapSlugs.includes(co.slug);
            return (
              <div
                key={co.slug}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://www.google.com/s2/favicons?sz=64&domain=${co.slug.toLowerCase()}.com`}
                    alt={co.name}
                    className="w-10 h-10 rounded-lg shrink-0 object-contain bg-white border border-gray-100 p-1"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?sz=64&domain=example.com"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{co.name}</div>
                    <div className="text-xs text-gray-400">{co.category ?? co.type}</div>
                  </div>
                  {inRoadmap && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5 shrink-0">
                      In Roadmap
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex justify-between text-xs text-gray-500 mb-4">
                  <span>
                    <span className="font-semibold text-gray-900">
                      {(co.questionCount ?? co.questions ?? 0).toLocaleString()}
                    </span>{" "}
                    questions
                  </span>
                  {co.topTopic && <span>Top: {co.topTopic}</span>}
                </div>

                {/* CTAs */}
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => handleAddClick(co, inRoadmap)}
                    disabled={inRoadmap}
                    className={`flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border ${
                      inRoadmap
                        ? "border-green-200 bg-green-50 text-green-600 cursor-default"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {inRoadmap ? (
                      <><Check className="w-3 h-3" /> Added</>
                    ) : (
                      <><Plus className="w-3 h-3" /> Roadmap</>
                    )}
                  </button>

                  <Link
                    href={`/companies/${co.slug}`}
                    className="flex-1 text-center bg-gray-900 text-white text-xs font-semibold py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                  >
                    View Intel <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* BUG-FIX B1: Load more button + updated summary */}
      {!isLoading && visibleCount < filtered.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount(v => v + 100)}
            className="text-sm font-medium px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Load 100 more
          </button>
        </div>
      )}

      {/* Summary */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} companies
      </p>

      {/* Add to Roadmap Modal */}
      {modalCompany && (
        <AddToRoadmapModal
          company={modalCompany as any}
          onClose={() => setModalCompany(null)}
          onAdded={handleAdded}
        />
      )}

      {/* Limit Reached Toast */}
      {showLimitToast && (
        <div className="fixed bottom-5 right-5 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 text-sm transition-opacity duration-300">
          <div className="bg-red-100 text-red-600 rounded-full p-1 shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
          <span className="font-semibold">Cannot add more than 5 roadmaps. It gets messy!</span>
        </div>
      )}
    </div>
  );
}
