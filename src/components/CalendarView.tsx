"use client";

import { useState } from "react";
import type { ScoreBreakdown } from "@/types";

interface MonthScore {
  month: number;
  scores: ScoreBreakdown;
}

interface CalendarViewProps {
  cityId: string;
  cityNameKo: string;
  scores: MonthScore[];
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

function getScoreBgTint(score: number): string {
  if (score >= 8) return "bg-emerald-50 border-emerald-200";
  if (score >= 6) return "bg-yellow-50 border-yellow-200";
  if (score >= 4) return "bg-orange-50 border-orange-200";
  return "bg-red-50 border-red-200";
}

function getScoreBarColor(score: number): string {
  if (score >= 8) return "bg-emerald-500";
  if (score >= 6) return "bg-yellow-500";
  if (score >= 4) return "bg-orange-500";
  return "bg-red-500";
}

function getGradeLabel(score: number): string {
  if (score >= 8) return "최적";
  if (score >= 6) return "좋음";
  if (score >= 4) return "보통";
  return "비추";
}

export default function CalendarView({ cityNameKo, scores }: CalendarViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const currentMonth = new Date().getMonth() + 1;

  const bestMonth = scores.reduce(
    (best, s) => (s.scores.total > best.scores.total ? s : best),
    scores[0]
  );

  const selectedData = selectedMonth
    ? scores.find((s) => s.month === selectedMonth)
    : null;

  return (
    <div className="w-full">
      {/* Calendar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {scores.map((ms) => {
          const isCurrentMonth = ms.month === currentMonth;
          const isBestMonth = ms.month === bestMonth.month;
          const isSelected = ms.month === selectedMonth;

          return (
            <button
              key={ms.month}
              onClick={() =>
                setSelectedMonth(isSelected ? null : ms.month)
              }
              className={`
                relative group rounded-2xl border-2 p-4 text-left
                transition-all duration-300 cursor-pointer
                ${getScoreBgTint(ms.scores.total)}
                ${isSelected
                  ? "ring-2 ring-emerald-500 ring-offset-2 scale-[1.02] shadow-lg"
                  : "hover:shadow-md hover:scale-[1.01]"
                }
                ${isCurrentMonth && !isSelected
                  ? "border-emerald-400 border-dashed"
                  : ""
                }
              `}
            >
              {/* Best month crown */}
              {isBestMonth && (
                <span className="absolute -top-2.5 -right-2 text-lg drop-shadow-sm">
                  👑
                </span>
              )}

              {/* Current month dot */}
              {isCurrentMonth && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}

              {/* Month label */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-semibold ${
                    isCurrentMonth ? "text-emerald-700" : "text-gray-600"
                  }`}
                >
                  {MONTH_NAMES[ms.month - 1]}
                  {isCurrentMonth && (
                    <span className="ml-1 text-[10px] text-emerald-500 font-normal">
                      지금
                    </span>
                  )}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-end gap-1.5">
                <span
                  className={`text-2xl font-bold tabular-nums ${getScoreTextColor(
                    ms.scores.total
                  )}`}
                >
                  {ms.scores.total.toFixed(1)}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mb-1 ${getScoreColor(
                    ms.scores.total
                  )} text-white`}
                >
                  {getGradeLabel(ms.scores.total)}
                </span>
              </div>

              {/* Mini bar indicators */}
              <div className="mt-3 flex gap-1">
                {SCORE_LABELS.map(({ key }) => (
                  <div
                    key={key}
                    className="flex-1 h-1 rounded-full bg-gray-200 overflow-hidden"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(
                        ms.scores[key]
                      )}`}
                      style={{ width: `${ms.scores[key] * 10}%` }}
                    />
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail Panel */}
      <div
        className={`
          mt-6 overflow-hidden transition-all duration-500 ease-in-out
          ${selectedData ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        {selectedData && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {cityNameKo}{" "}
                  <span className="text-emerald-600">
                    {MONTH_NAMES[selectedData.month - 1]}
                  </span>
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  종합 점수 분석
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-3xl font-extrabold tabular-nums ${getScoreTextColor(
                    selectedData.scores.total
                  )}`}
                >
                  {selectedData.scores.total.toFixed(1)}
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getScoreColor(
                    selectedData.scores.total
                  )} text-white`}
                >
                  {getGradeLabel(selectedData.scores.total)}
                </span>
              </div>
            </div>

            {/* Score Bars */}
            <div className="space-y-4">
              {SCORE_LABELS.map(({ key, label, icon }) => {
                const val = selectedData.scores[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center">{icon}</span>
                    <span className="text-sm font-medium text-gray-700 w-12">
                      {label}
                    </span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
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

            {/* Highlights */}
            {(() => {
              const highlights: string[] = [];
              if (selectedData.scores.weather >= 8) highlights.push("쾌적한 날씨");
              if (selectedData.scores.cost >= 8) highlights.push("환율 유리");
              if (selectedData.scores.crowd >= 8) highlights.push("한산한 시기");
              if (selectedData.scores.buzz >= 8) highlights.push("인기 시즌");
              if (selectedData.scores.weather <= 3) highlights.push("날씨 주의");
              if (selectedData.scores.crowd <= 3) highlights.push("혼잡 주의");
              const tags = highlights.slice(0, 3);
              if (tags.length === 0) return null;
              return (
                <div className="mt-5 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
