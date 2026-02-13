"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { cities } from "@/data/cities";
import { getScoresForCity, getScoresForMonth } from "@/data/mock-scores";
import { generateHighlights } from "@/lib/highlights";
import type { AppMode, ScoreBreakdown } from "@/types";

/* ─── Constants ─────────────────────────────────────── */
const MONTHS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const SCORE_LABELS: { key: keyof Omit<ScoreBreakdown, "total">; label: string; color: string }[] = [
  { key: "weather", label: "날씨", color: "#F59E0B" },
  { key: "cost", label: "비용", color: "#10B981" },
  { key: "crowd", label: "혼잡도", color: "#8B5CF6" },
  { key: "buzz", label: "버즈", color: "#EC4899" },
];

function gradeColor(score: number): string {
  if (score >= 8) return "#16A34A";
  if (score >= 6) return "#3B82F6";
  if (score >= 4) return "#EAB308";
  return "#DC2626";
}

function gradeLabel(score: number): string {
  if (score >= 8) return "최적";
  if (score >= 6) return "좋음";
  if (score >= 4) return "보통";
  return "비추천";
}

const FLAG_URL = (code: string) =>
  `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;

const currentMonth = new Date().getMonth() + 1; // 1-12

/* ─── Component ─────────────────────────────────────── */
export default function V10Page() {
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [detailMonth, setDetailMonth] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  /* ─── Derived data ─── */
  const cityObj = useMemo(
    () => cities.find((c) => c.id === selectedCity) ?? null,
    [selectedCity]
  );

  // Mode A: city → 12-month timeline
  const monthlyScores = useMemo(() => {
    if (mode !== "where-to-when" || !selectedCity) return [];
    return getScoresForCity(selectedCity).sort((a, b) => a.month - b.month);
  }, [mode, selectedCity]);

  const bestMonth = useMemo(() => {
    if (!monthlyScores.length) return -1;
    return monthlyScores.reduce((best, cur) =>
      cur.scores.total > best.scores.total ? cur : best
    ).month;
  }, [monthlyScores]);

  // Mode B: month → city ranking
  const cityRanking = useMemo(() => {
    if (mode !== "when-to-where") return [];
    return getScoresForMonth(selectedMonth)
      .sort((a, b) => b.scores.total - a.scores.total)
      .map((ms, idx) => ({
        ...ms,
        rank: idx + 1,
        city: cities.find((c) => c.id === ms.cityId)!,
      }));
  }, [mode, selectedMonth]);

  // Detail data
  const detailData = useMemo(() => {
    if (detailMonth === null || !selectedCity) return null;
    const ms = monthlyScores.find((s) => s.month === detailMonth);
    if (!ms) return null;
    return {
      scores: ms.scores,
      highlights: generateHighlights(selectedCity, detailMonth, ms.scores),
    };
  }, [detailMonth, selectedCity, monthlyScores]);

  // Scroll current month bar into view on first load
  useEffect(() => {
    if (mode === "where-to-when" && monthlyScores.length && timelineRef.current) {
      const el = timelineRef.current.querySelector(`[data-month="${currentMonth}"]`);
      el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [mode, monthlyScores]);

  /* ─── Mode B month bar selector ─── */
  const modeBScores = useMemo(() => {
    if (mode !== "when-to-where") return [];
    // Average total score across all cities for each month
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const scores = getScoresForMonth(month);
      const avg =
        Math.round(
          (scores.reduce((sum, s) => sum + s.scores.total, 0) / scores.length) * 10
        ) / 10;
      return { month, avg };
    });
  }, [mode]);

  const modeBBestMonth = useMemo(() => {
    if (!modeBScores.length) return -1;
    return modeBScores.reduce((best, cur) =>
      cur.avg > best.avg ? cur : best
    ).month;
  }, [modeBScores]);

  /* ─── Render ─── */
  return (
    <div className="min-h-screen" style={{ background: "#FFF", color: "#1A1A1A" }}>
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #E8E8E8" }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            where<span style={{ color: "#888" }}>or</span>when
          </h1>
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#F5F5F5" }}>
            <button
              onClick={() => { setMode("where-to-when"); setDetailMonth(null); }}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-all"
              style={{
                background: mode === "where-to-when" ? "#FFF" : "transparent",
                color: mode === "where-to-when" ? "#1A1A1A" : "#888",
                boxShadow: mode === "where-to-when" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              도시 → 시기
            </button>
            <button
              onClick={() => { setMode("when-to-where"); setDetailMonth(null); }}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-all"
              style={{
                background: mode === "when-to-where" ? "#FFF" : "transparent",
                color: mode === "when-to-where" ? "#1A1A1A" : "#888",
                boxShadow: mode === "when-to-where" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              시기 → 도시
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* ═══ MODE A: where-to-when ═══ */}
        {mode === "where-to-when" && (
          <>
            {/* City selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: "#888" }}>
                여행 도시 선택
              </label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setDetailMonth(null);
                }}
                className="w-full max-w-xs px-4 py-2.5 rounded-lg text-sm appearance-none cursor-pointer transition-colors"
                style={{
                  border: "1px solid #E8E8E8",
                  background: "#FAFAFA",
                  color: selectedCity ? "#1A1A1A" : "#888",
                  outline: "none",
                }}
              >
                <option value="">도시를 선택하세요</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameKo} ({c.nameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Empty state */}
            {!selectedCity && (
              <div className="relative py-24">
                <div className="h-px w-full" style={{ background: "#E8E8E8" }} />
                <p
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm whitespace-nowrap px-4 py-2 rounded-full"
                  style={{ color: "#888", background: "#FFF" }}
                >
                  도시를 선택하면 여기에 12개월 타임라인이 표시됩니다
                </p>
              </div>
            )}

            {/* Timeline bar chart */}
            {selectedCity && monthlyScores.length > 0 && (
              <div className="mb-2">
                {/* City info */}
                {cityObj && (
                  <div className="flex items-center gap-2 mb-4">
                    <img
                      src={FLAG_URL(cityObj.countryCode)}
                      alt={cityObj.country}
                      className="rounded-sm"
                      width={24}
                      height={18}
                    />
                    <span className="font-semibold text-lg">{cityObj.nameKo}</span>
                    <span className="text-sm" style={{ color: "#888" }}>{cityObj.nameEn}</span>
                  </div>
                )}

                {/* Bar chart timeline */}
                <div
                  ref={timelineRef}
                  className="flex gap-2 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#E8E8E8 transparent",
                  }}
                >
                  {monthlyScores.map((ms) => {
                    const score = ms.scores.total;
                    const color = gradeColor(score);
                    const isBest = ms.month === bestMonth;
                    const isCurrent = ms.month === currentMonth;
                    const isSelected = ms.month === detailMonth;
                    // Height: score 1-10 → 40px-200px
                    const barHeight = 40 + (score / 10) * 160;

                    return (
                      <button
                        key={ms.month}
                        data-month={ms.month}
                        onClick={() => setDetailMonth(isSelected ? null : ms.month)}
                        className="snap-center shrink-0 flex flex-col items-center group"
                        style={{ width: "clamp(56px, 7.5vw, 72px)" }}
                      >
                        {/* Crown for best month */}
                        <div className="h-6 flex items-end justify-center mb-1">
                          {isBest && (
                            <span className="text-sm" title="최적의 달">👑</span>
                          )}
                        </div>

                        {/* Score label */}
                        <span
                          className="text-xs font-bold mb-1 transition-transform"
                          style={{
                            color,
                            transform: isSelected ? "scale(1.15)" : "scale(1)",
                          }}
                        >
                          {score.toFixed(1)}
                        </span>

                        {/* Bar */}
                        <div
                          className="w-full rounded-t-lg transition-all duration-300 relative"
                          style={{
                            height: `${barHeight}px`,
                            background: isSelected
                              ? color
                              : `${color}22`,
                            border: `2px solid ${color}`,
                            borderBottom: "none",
                            boxShadow: isSelected
                              ? `0 0 16px ${color}33`
                              : "none",
                          }}
                        >
                          {/* Hover fill */}
                          <div
                            className="absolute inset-0 rounded-t-md transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                            style={{ background: `${color}18` }}
                          />
                        </div>

                        {/* Timeline connector line */}
                        <div
                          className="w-full h-px relative"
                          style={{ background: "#E8E8E8" }}
                        >
                          {/* Current month pulsing dot */}
                          {isCurrent && (
                            <span
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 block w-2.5 h-2.5 rounded-full"
                              style={{
                                background: color,
                                animation: "pulse-dot 2s ease-in-out infinite",
                              }}
                            />
                          )}
                        </div>

                        {/* Month label */}
                        <span
                          className="text-xs mt-2 font-medium transition-colors"
                          style={{
                            color: isSelected ? "#1A1A1A" : isCurrent ? color : "#888",
                          }}
                        >
                          {MONTHS[ms.month - 1]}
                        </span>

                        {/* Grade pill */}
                        <span
                          className="text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            background: `${color}15`,
                            color,
                          }}
                        >
                          {gradeLabel(score)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Detail bottom sheet */}
            <div
              className="transition-all duration-500 ease-out overflow-hidden"
              style={{
                maxHeight: detailData ? "600px" : "0px",
                opacity: detailData ? 1 : 0,
              }}
            >
              {detailData && detailMonth !== null && cityObj && (
                <div
                  className="rounded-2xl p-5 mt-2"
                  style={{ background: "#FAFAFA", border: "1px solid #E8E8E8" }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={FLAG_URL(cityObj.countryCode)}
                          alt={cityObj.country}
                          className="rounded-sm"
                          width={20}
                          height={15}
                        />
                        <span className="font-semibold">{cityObj.nameKo}</span>
                      </div>
                      <span style={{ color: "#E8E8E8" }}>|</span>
                      <span className="text-sm font-medium" style={{ color: "#888" }}>
                        {MONTHS[detailMonth - 1]}
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: gradeColor(detailData.scores.total) }}
                      >
                        {detailData.scores.total.toFixed(1)}
                      </span>
                    </div>
                    <button
                      onClick={() => setDetailMonth(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                      style={{ color: "#888" }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Sub-score bars */}
                  <div className="space-y-3 mb-4">
                    {SCORE_LABELS.map(({ key, label, color }) => {
                      const val = detailData.scores[key];
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span style={{ color: "#888" }}>{label}</span>
                            <span className="font-semibold" style={{ color }}>{val.toFixed(1)}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E8E8E8" }}>
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${(val / 10) * 100}%`,
                                background: color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Highlights */}
                  {detailData.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {detailData.highlights.map((h, i) => (
                        <span
                          key={i}
                          className="text-xs px-3 py-1.5 rounded-full font-medium"
                          style={{
                            background: "#FFF",
                            border: "1px solid #E8E8E8",
                            color: "#1A1A1A",
                          }}
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ MODE B: when-to-where ═══ */}
        {mode === "when-to-where" && (
          <>
            {/* Month bar selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: "#888" }}>
                여행 시기 선택 — 막대를 클릭하세요
              </label>
              <div className="flex gap-1.5 items-end overflow-x-auto pb-3 snap-x snap-mandatory">
                {modeBScores.map(({ month, avg }) => {
                  const color = gradeColor(avg);
                  const isSelected = month === selectedMonth;
                  const isBest = month === modeBBestMonth;
                  const barH = 24 + (avg / 10) * 56;
                  return (
                    <button
                      key={month}
                      onClick={() => setSelectedMonth(month)}
                      className="snap-center shrink-0 flex flex-col items-center"
                      style={{ width: "clamp(40px, 7vw, 56px)" }}
                    >
                      {isBest && <span className="text-[10px] mb-0.5">👑</span>}
                      <div
                        className="w-full rounded-t-md transition-all duration-300"
                        style={{
                          height: `${barH}px`,
                          background: isSelected ? color : `${color}22`,
                          border: `1.5px solid ${color}`,
                          borderBottom: "none",
                        }}
                      />
                      <div className="w-full h-px" style={{ background: "#E8E8E8" }} />
                      <span
                        className="text-[11px] mt-1 font-medium"
                        style={{ color: isSelected ? "#1A1A1A" : "#888" }}
                      >
                        {MONTHS[month - 1]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* City ranking — horizontal bar leaderboard */}
            <div className="space-y-2">
              {cityRanking.map(({ rank, city, scores, cityId }, idx) => {
                const color = gradeColor(scores.total);
                const barWidth = (scores.total / 10) * 100;
                const isTop3 = rank <= 3;
                const highlights = generateHighlights(cityId, selectedMonth, scores);

                return (
                  <div
                    key={cityId}
                    className="rounded-xl overflow-hidden transition-all duration-300"
                    style={{
                      border: `1px solid ${isTop3 ? color + "44" : "#E8E8E8"}`,
                      background: isTop3 ? `${color}06` : "#FAFAFA",
                    }}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Rank */}
                      <span
                        className="font-bold text-sm w-7 text-center shrink-0"
                        style={{
                          color: isTop3 ? color : "#888",
                          fontSize: isTop3 ? "16px" : "14px",
                        }}
                      >
                        {rank}
                      </span>

                      {/* Flag + name */}
                      <div className="flex items-center gap-2 shrink-0" style={{ minWidth: "100px" }}>
                        <img
                          src={FLAG_URL(city.countryCode)}
                          alt={city.country}
                          className="rounded-sm"
                          width={20}
                          height={15}
                        />
                        <span
                          className="font-medium text-sm truncate"
                          style={{ color: "#1A1A1A" }}
                        >
                          {city.nameKo}
                        </span>
                      </div>

                      {/* Horizontal score bar */}
                      <div className="flex-1 mx-2">
                        <div className="h-3 rounded-full overflow-hidden" style={{ background: "#E8E8E8" }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${barWidth}%`,
                              background: `linear-gradient(90deg, ${color}88, ${color})`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Score */}
                      <span
                        className="font-bold text-sm shrink-0"
                        style={{ color }}
                      >
                        {scores.total.toFixed(1)}
                      </span>
                    </div>

                    {/* Highlights for top 3 */}
                    {isTop3 && highlights.length > 0 && (
                      <div className="px-4 pb-3 pt-0 flex flex-wrap gap-1.5" style={{ paddingLeft: "52px" }}>
                        {highlights.map((h, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background: "#FFF",
                              border: "1px solid #E8E8E8",
                              color: "#888",
                            }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs" style={{ color: "#888" }}>
          © 2025 whereorwhen · 여행의 최적 타이밍
        </p>
      </footer>

      {/* Pulse animation */}
      <style jsx global>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.8); }
        }
      `}</style>
    </div>
  );
}
