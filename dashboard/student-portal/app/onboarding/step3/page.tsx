"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Info } from "lucide-react";
import Stepper from "@/components/onboarding/Stepper";
import { type CompanyCategory, getTopicsForCategories, type TopicRating } from "@/lib/constants";

const durations = ["4 weeks", "8 weeks", "12 weeks", "16 weeks", "24 weeks"];

export default function SelfRatingPage() {
  const router = useRouter();

  const [topics] = useState<TopicRating[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem("onboarding_categories") : null;
      const cats = raw ? (JSON.parse(raw) as CompanyCategory[]) : [];
      return getTopicsForCategories(cats);
    } catch {
      return getTopicsForCategories([]);
    }
  });

  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem("onboarding_categories") : null;
      const cats = raw ? (JSON.parse(raw) as CompanyCategory[]) : [];
      const resolved = getTopicsForCategories(cats);
      const initial: Record<string, number> = {};
      resolved.forEach((t) => { initial[t.id] = t.defaultRating; });
      return initial;
    } catch {
      return {};
    }
  });

  const [time, setTime] = useState("12 weeks");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left brand panel */}
      <div className="hidden md:flex w-[320px] shrink-0 bg-gradient-to-br from-blue-700 to-indigo-800 flex-col justify-between px-10 py-12">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-white/20 rounded px-2 py-1 text-white font-bold text-xs">NST</div>
            <span className="font-bold text-white text-sm">PlacePrep</span>
          </div>
          <h2 className="text-white text-3xl font-extrabold leading-tight mb-3">
            Rate your<br />confidence
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            Be honest — this helps us weight topics correctly in your roadmap. You can always update this later.
          </p>
        </div>
        <div className="text-blue-300 text-xs">NST Placement Prep Portal · Student Edition</div>
      </div>

      {/* Right form panel — fixed height, no scroll */}
      <div className="flex-1 flex flex-col px-6 md:px-8 py-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto flex flex-col h-full">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mb-4">
            <div className="bg-blue-700 rounded px-2 py-1 text-white font-bold text-xs">NST</div>
            <span className="font-bold text-gray-900 text-sm">PlacePrep</span>
          </div>

          <Stepper currentStep={3} totalSteps={4} />
          <p className="text-xs text-gray-400 mt-2 mb-3">Step 3 of 4</p>
          <h1 className="text-xl font-bold text-gray-900 mb-0.5">Rate your topic-wise confidence</h1>
          <p className="text-sm text-gray-500 mb-3">Topics tailored to your selected company category</p>

          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-4 text-xs text-blue-700">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Topics shown are based on your selected company type. Backend will personalise these further.</span>
          </div>

          {/* Scrollable inner area just for topic sliders */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 overflow-y-auto min-h-0">
            {topics.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {topics.map((topic) => (
                  <div key={topic.id} className="flex items-center gap-3">
                    <div className="w-36 text-xs font-medium text-gray-800 shrink-0">{topic.label}</div>
                    <div className="flex-1">
                      <input
                        type="range" min="1" max="10" step="1"
                        value={ratings[topic.id] ?? topic.defaultRating}
                        onChange={(e) => setRatings((prev) => ({ ...prev, [topic.id]: parseInt(e.target.value) }))}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="w-6 text-right text-blue-600 font-bold text-xs shrink-0">
                      {ratings[topic.id] ?? topic.defaultRating}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Duration picker */}
            <div className="border-t border-gray-100 pt-4 mt-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">How much time do you have?</h3>
              <div className="flex flex-wrap gap-2">
                {durations.map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setTime(duration)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${time === duration ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons pinned to bottom */}
          <div className="flex gap-3 mt-4 shrink-0">
            <button
              onClick={() => router.push("/onboarding/step2")}
              className="flex-1 py-3 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("onboarding_ratings", JSON.stringify(ratings));
                  sessionStorage.setItem("onboarding_weeks", time.split(' ')[0]);
                }
                router.push("/onboarding/step4");
              }}
              className="flex-1 bg-gray-900 text-white rounded-lg py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
            >
              Generate Roadmap <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
