"use client";

import { useState } from "react";
import type { ScoreBreakdown } from "@/types";

interface RankingItem {
  cityId: string;
  cityNameKo: string;
  cityNameEn: string;
  country: string;
  countryCode: string;
  scores: ScoreBreakdown;
  highlights: string[];
}

interface RankingViewProps {
  month: number;
  rankings: RankingItem[];
}

const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const SCORE_LABELS: { key: keyof Omit<ScoreBreakdown, "total">; label: string; icon: string }[] = [
  { key: "weather", label: "날씨", icon: "☀️" },
  { key: "cost", label: "비용", icon: "💰" },
  { key: "crowd", label: "혼잡도", icon: "👥" },
  { key: "buzz", label: "버즈", icon: "🔥" },
];

function getScoreColor(score: number): string {
  if (score >= 8) return "bg-emerald-500";
  if (score >= 6) return "bg-yellow-500";
  if (score >= 4) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreTextColor(score: number): string {
  if (score >= 8) return "text-emerald-700";
  if (score >= 6) return "text-yellow-700";
  if (score >= 4) return "text-orange-700";
  return "text-red-700";
}

function getScoreBarColor(score: number): string {
  if (score >= 8) return "bg-emerald-500";
  if (score >= 6) return "bg-yellow-500";
  if (score >= 4) return "bg-orange-500";
  return "bg-red-500";
}

function getFlag(code: string): string {
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => 127397 + c.charCodeAt(0))
  );
}

function getRankStyle(rank: number): {
  accent: string;
  badge: string;
  ring: string;
  medal: string;
} {
  switch (rank) {
    case 1:
      return {
        accent: "from-amber-50 to-yellow-50 border-amber-300",
        badge: "bg-amber-500 text-white",
        ring: "ring-amber-300",
        medal: "🥇",
      };
    case 2:
      return {
        accent: "from-gray-50 to-slate-50 border-gray-300",
        badge: "bg-gray-400 text-white",
        ring: "ring-gray-300",
        medal: "🥈",
      };
    case 3:
      return {
        accent: "from-orange-50 to-amber-50 border-orange-300",
        badge: "bg-orange-600 text-white",
        ring: "ring-orange-300",
        medal: "🥉",
      };
    default:
      return {
        accent: "from-white to-gray-50/50 border-gray-200",
        badge: "bg-gray-200 text-gray-700",
        ring: "",
        medal: "",
      };
  }
}

export default function RankingView({ month, rankings }: RankingViewProps) {
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  const sorted = [...rankings].sort(
    (a, b) => b.scores.total - a.scores.total
  );

  return (
    <div className="w-full">
      {/* Month badge */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500">
          {MONTH_NAMES[month - 1]} 여행지 추천 순위
        </span>
        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
          {sorted.length}개 도시
        </span>
      </div>

      {/* Rankings */}
      <div className="space-y-3">
        {sorted.map((item, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;
          const isExpanded = expandedCity === item.cityId;
          const style = getRankStyle(rank);

          return (
            <div key={item.cityId} className="relative">
              <button
                onClick={() =>
                  setExpandedCity(isExpanded ? null : item.cityId)
                }
                className={`
                  w-full text-left rounded-2xl border-2 transition-all duration-300 cursor-pointer
                  bg-gradient-to-r ${style.accent}
                  ${isExpanded ? `ring-2 ${style.ring} ring-offset-1 shadow-lg` : "hover:shadow-md"}
                  ${isTop3 ? "p-5" : "p-4"}
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    {isTop3 ? (
                      <span className="text-2xl">{style.medal}</span>
                    ) : (
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${style.badge}`}
                      >
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* City info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-bold text-gray-900 truncate ${
                          isTop3 ? "text-lg" : "text-base"
                        }`}
                      >
                        {item.cityNameKo}
                      </h3>
                      <span className="text-sm text-gray-400 truncate">
                        {item.cityNameEn}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm">
                        {getFlag(item.countryCode)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.country}
                      </span>
                      {/* Highlights */}
                      {item.highlights.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1 ml-1">
                          {item.highlights.map((h) => (
                            <span
                              key={h}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Mobile highlights */}
                    {item.highlights.length > 0 && (
                      <div className="flex sm:hidden items-center gap-1 mt-1.5">
                        {item.highlights.map((h) => (
                          <span
                            key={h}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Score badge */}
                  <div className="flex-shrink-0 text-right">
                    <div
                      className={`${
                        isTop3 ? "text-2xl" : "text-xl"
                      } font-extrabold tabular-nums ${getScoreTextColor(
                        item.scores.total
                      )}`}
                    >
                      {item.scores.total.toFixed(1)}
                    </div>
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${getScoreColor(
                        item.scores.total
                      )} text-white mt-0.5`}
                    >
                      {item.scores.total >= 8
                        ? "최적"
                        : item.scores.total >= 6
                          ? "좋음"
                          : item.scores.total >= 4
                            ? "보통"
                            : "비추"}
                    </span>
                  </div>

                  {/* Expand indicator */}
                  <div className="flex-shrink-0 ml-1">
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              <div
                className={`
                  overflow-hidden transition-all duration-500 ease-in-out
                  ${isExpanded ? "max-h-[300px] opacity-100 mt-2" : "max-h-0 opacity-0"}
                `}
              >
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 ml-4 mr-4">
                  <div className="space-y-3">
                    {SCORE_LABELS.map(({ key, label, icon }) => {
                      const val = item.scores[key];
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-sm w-5 text-center">
                            {icon}
                          </span>
                          <span className="text-sm font-medium text-gray-700 w-12">
                            {label}
                          </span>
                          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${getScoreBarColor(
                                val
                              )}`}
                              style={{ width: `${val * 10}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-bold tabular-nums w-8 text-right ${getScoreTextColor(
                              val
                            )}`}
                          >
                            {val.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
