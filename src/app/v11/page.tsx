"use client";

import { useState, useMemo } from "react";
import { cities } from "@/data/cities";
import { getScoresForCity, getScoresForMonth } from "@/data/mock-scores";
import { generateHighlights } from "@/lib/highlights";
import type { AppMode, ScoreBreakdown } from "@/types";

/* ─── Constants ─────────────────────────────────────────── */

const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const SUB_KEYS: (keyof Omit<ScoreBreakdown, "total">)[] = [
  "weather", "cost", "crowd", "buzz",
];

const SUB_LABELS: Record<string, string> = {
  weather: "날씨",
  cost: "비용",
  crowd: "혼잡도",
  buzz: "버즈",
};

const SUB_ICONS: Record<string, string> = {
  weather: "☀️",
  cost: "💰",
  crowd: "👥",
  buzz: "📱",
};

const POPULAR_IDS = ["osaka", "tokyo", "bangkok", "danang", "guam", "cebu", "taipei", "bali"];

const NOW_MONTH = new Date().getMonth() + 1;

const BG_GRADIENT = `radial-gradient(circle at 20% 20%, rgba(52,199,89,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(90,200,250,0.05) 0%, transparent 50%), radial-gradient(circle at 50% 90%, rgba(255,159,10,0.04) 0%, transparent 50%), #F2F2F7`;

const GLASS_CARD = "bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30";
const GLASS_SHADOW = "0 2px 20px rgba(0,0,0,0.04)";

/* ─── Helpers ───────────────────────────────────────────── */

function scoreColor(v: number): string {
  if (v >= 8) return "#34C759";
  if (v >= 6) return "#5AC8FA";
  if (v >= 4) return "#FF9F0A";
  return "#FF3B30";
}

function scoreGlow(v: number): string {
  if (v >= 8) return "0 0 20px rgba(52,199,89,0.15)";
  return "none";
}

function gradeLabel(v: number): string {
  if (v >= 8) return "최적";
  if (v >= 6) return "좋음";
  if (v >= 4) return "보통";
  return "비추천";
}

function gradeEmoji(v: number): string {
  if (v >= 8) return "🟢";
  if (v >= 6) return "🔵";
  if (v >= 4) return "🟡";
  return "🔴";
}

function flag(cc: string): string {
  return cc
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

/* ─── Main Page ─────────────────────────────────────────── */

export default function V11Page() {
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(NOW_MONTH);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  /* Mode 1: city → months */
  const cityMatch = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.trim().toLowerCase();
    return (
      cities.find(
        (c) =>
          c.nameKo.includes(q) ||
          c.nameEn.toLowerCase().includes(q) ||
          c.country.includes(q)
      ) ?? null
    );
  }, [query]);

  const activeCityId = selectedCity ?? cityMatch?.id ?? null;

  const cityScores = useMemo(() => {
    if (!activeCityId) return [];
    return getScoresForCity(activeCityId);
  }, [activeCityId]);

  const bestMonth = useMemo(() => {
    if (cityScores.length === 0) return -1;
    return cityScores.reduce((b, c) =>
      c.scores.total > b.scores.total ? c : b
    ).month;
  }, [cityScores]);

  const activeCity = useMemo(() => {
    return cities.find((c) => c.id === activeCityId) ?? null;
  }, [activeCityId]);

  /* Mode 2: month → cities */
  const monthRanking = useMemo(() => {
    const scores = getScoresForMonth(selectedMonth);
    return scores
      .map((ms) => {
        const city = cities.find((c) => c.id === ms.cityId)!;
        const hl = generateHighlights(ms.cityId, ms.month, ms.scores);
        return { ...ms, city, highlights: hl };
      })
      .sort((a, b) => b.scores.total - a.scores.total);
  }, [selectedMonth]);

  /* Filtered suggestions */
  const suggestions = useMemo(() => {
    if (!query.trim() || activeCityId) return [];
    const q = query.trim().toLowerCase();
    return cities
      .filter(
        (c) =>
          c.nameKo.includes(q) ||
          c.nameEn.toLowerCase().includes(q) ||
          c.country.includes(q)
      )
      .slice(0, 6);
  }, [query, activeCityId]);

  const handleSelectCity = (id: string) => {
    setSelectedCity(id);
    const c = cities.find((ci) => ci.id === id);
    if (c) setQuery(c.nameKo);
    setSelectedCell(null);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedCity(null);
    setSelectedCell(null);
  };

  /* ================================================================ */

  return (
    <div
      className="min-h-screen"
      style={{ background: BG_GRADIENT, color: "#1C1C1E" }}
    >
      {/* ─── Glass Header ────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 border-b border-white/20"
        style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.04)" }}
      >
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight" style={{ color: "#1C1C1E" }}>
              whereorwhen
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/50 border border-white/30" style={{ color: "#8E8E93" }}>
              v11
            </span>
          </div>

          {/* Glass pill segmented control */}
          <div
            className="flex items-center rounded-full p-0.5 bg-white/40 backdrop-blur-sm border border-white/30"
            style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)" }}
          >
            <button
              onClick={() => { setMode("where-to-when"); handleClear(); }}
              className="px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300"
              style={{
                background: mode === "where-to-when" ? "rgba(255,255,255,0.85)" : "transparent",
                color: mode === "where-to-when" ? "#1C1C1E" : "#8E8E93",
                boxShadow: mode === "where-to-when" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              도시 → 시기
            </button>
            <button
              onClick={() => { setMode("when-to-where"); handleClear(); }}
              className="px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300"
              style={{
                background: mode === "when-to-where" ? "rgba(255,255,255,0.85)" : "transparent",
                color: mode === "when-to-where" ? "#1C1C1E" : "#8E8E93",
                boxShadow: mode === "when-to-where" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              시기 → 도시
            </button>
          </div>
        </div>
      </header>

      {/* ─── Content ─────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {mode === "where-to-when" ? (
          <CityToMonthView
            query={query}
            setQuery={setQuery}
            suggestions={suggestions}
            activeCityId={activeCityId}
            activeCity={activeCity}
            cityScores={cityScores}
            bestMonth={bestMonth}
            selectedCell={selectedCell}
            setSelectedCell={setSelectedCell}
            onSelectCity={handleSelectCity}
            onClear={handleClear}
          />
        ) : (
          <MonthToCityView
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            ranking={monthRanking}
            onSelectCity={(id) => {
              setMode("where-to-when");
              handleSelectCity(id);
            }}
          />
        )}
      </main>
    </div>
  );
}

/* ================================================================
   MODE 1: 도시 → 시기 (Calendar Cards)
   ================================================================ */

function CityToMonthView({
  query,
  setQuery,
  suggestions,
  activeCityId,
  activeCity,
  cityScores,
  bestMonth,
  selectedCell,
  setSelectedCell,
  onSelectCity,
  onClear,
}: {
  query: string;
  setQuery: (v: string) => void;
  suggestions: typeof cities;
  activeCityId: string | null;
  activeCity: (typeof cities)[number] | null;
  cityScores: ReturnType<typeof getScoresForCity>;
  bestMonth: number;
  selectedCell: number | null;
  setSelectedCell: (v: number | null) => void;
  onSelectCity: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      {/* Glass Search */}
      <div className="relative mb-6">
        <div
          className={`${GLASS_CARD} flex items-center h-12 px-4 gap-3`}
          style={{ boxShadow: GLASS_SHADOW }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (activeCityId) {
                onClear();
                setQuery(e.target.value);
              }
            }}
            placeholder="도시명 검색 (예: 오사카, Tokyo)"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#AEAEB2]"
            style={{ color: "#1C1C1E" }}
          />
          {query && (
            <button
              onClick={onClear}
              className="w-5 h-5 rounded-full bg-white/50 flex items-center justify-center text-[10px] transition-colors hover:bg-white/80"
              style={{ color: "#8E8E93" }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Glass Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div
            className={`absolute left-0 right-0 top-full mt-2 ${GLASS_CARD} z-40 overflow-hidden`}
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
          >
            {suggestions.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => onSelectCity(c.id)}
                className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-all duration-200 hover:bg-white/50"
                style={{
                  borderBottom: idx < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.3)" : "none",
                }}
              >
                <span className="text-base">{flag(c.countryCode)}</span>
                <span className="font-medium" style={{ color: "#1C1C1E" }}>{c.nameKo}</span>
                <span style={{ color: "#AEAEB2" }}>{c.nameEn}</span>
                <span className="ml-auto text-xs" style={{ color: "#AEAEB2" }}>{c.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular chips */}
      {!activeCityId && !query && (
        <div className="mb-6">
          <p className="text-xs mb-3" style={{ color: "#8E8E93" }}>인기 여행지</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_IDS.map((id) => {
              const c = cities.find((ci) => ci.id === id)!;
              return (
                <button
                  key={id}
                  onClick={() => onSelectCity(id)}
                  className={`${GLASS_CARD} px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-all duration-300 hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98]`}
                  style={{ boxShadow: GLASS_SHADOW, color: "#1C1C1E" }}
                >
                  <span>{flag(c.countryCode)}</span>
                  {c.nameKo}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!activeCityId && (
        <div className="flex flex-col items-center justify-center py-20">
          <div
            className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-xl border border-white/30 flex items-center justify-center mb-4"
            style={{ boxShadow: GLASS_SHADOW }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: "#8E8E93" }}>여행할 도시를 검색해 보세요</p>
          <p className="text-xs mt-1" style={{ color: "#AEAEB2" }}>
            월별 종합 점수로 최적의 여행 시기를 알려드려요
          </p>
        </div>
      )}

      {/* Calendar Cards + Detail */}
      {activeCityId && activeCity && cityScores.length > 0 && (
        <div>
          {/* City info glass card */}
          <div
            className={`${GLASS_CARD} p-4 mb-5`}
            style={{ boxShadow: GLASS_SHADOW }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{flag(activeCity.countryCode)}</span>
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#1C1C1E" }}>
                  {activeCity.nameKo}
                </h2>
                <p className="text-xs" style={{ color: "#8E8E93" }}>
                  {activeCity.nameEn} · {activeCity.country}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#AEAEB2" }}>
                  최적 시기
                </p>
                <p className="text-sm font-bold" style={{ color: "#34C759" }}>
                  {bestMonth}월
                </p>
              </div>
            </div>
          </div>

          {/* Month calendar grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-5">
            {cityScores.map((ms) => {
              const v = ms.scores.total;
              const m = ms.month;
              const isBest = m === bestMonth;
              const isSelected = selectedCell === m;
              const isCurrent = m === NOW_MONTH;
              const hl = generateHighlights(ms.cityId, ms.month, ms.scores);

              return (
                <button
                  key={m}
                  onClick={() => setSelectedCell(isSelected ? null : m)}
                  className={`${GLASS_CARD} relative p-3 text-center transition-all duration-300 hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98]`}
                  style={{
                    boxShadow: isSelected
                      ? `0 4px 24px rgba(0,0,0,0.08)`
                      : v >= 8
                      ? scoreGlow(v) + ", " + GLASS_SHADOW
                      : GLASS_SHADOW,
                    border: isSelected
                      ? "2px solid #1C1C1E"
                      : isBest
                      ? "2px solid #34C759"
                      : "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  {/* Month label */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-medium"
                      style={{ color: isCurrent ? "#5AC8FA" : "#8E8E93" }}
                    >
                      {MONTH_NAMES[m - 1]}
                    </span>
                    {isBest && (
                      <span className="text-[10px] px-1 py-0.5 rounded-full bg-[#34C759]/10 text-[#34C759] font-medium">
                        BEST
                      </span>
                    )}
                    {isCurrent && !isBest && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5AC8FA]" />
                    )}
                  </div>

                  {/* Score number */}
                  <div
                    className="text-2xl font-bold tabular-nums leading-none mb-1"
                    style={{ color: scoreColor(v) }}
                  >
                    {v.toFixed(1)}
                  </div>

                  {/* Grade */}
                  <div className="text-[10px] font-medium" style={{ color: scoreColor(v) }}>
                    {gradeLabel(v)}
                  </div>

                  {/* Highlight tag */}
                  {hl.length > 0 && (
                    <div
                      className="mt-2 text-[9px] leading-tight truncate"
                      style={{ color: "#AEAEB2" }}
                    >
                      {hl[0]}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected month detail panel */}
          {selectedCell &&
            (() => {
              const ms = cityScores.find((s) => s.month === selectedCell);
              if (!ms) return null;
              const hl = generateHighlights(ms.cityId, ms.month, ms.scores);
              return (
                <div
                  className={`${GLASS_CARD} p-5 transition-all duration-300`}
                  style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold" style={{ color: "#1C1C1E" }}>
                        {activeCity.nameKo} · {selectedCell}월
                      </h3>
                      {hl.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {hl.map((h, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-white/50 border border-white/30"
                              style={{ color: "#8E8E93" }}
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div
                        className="text-3xl font-bold tabular-nums"
                        style={{ color: scoreColor(ms.scores.total) }}
                      >
                        {ms.scores.total.toFixed(1)}
                      </div>
                      <div
                        className="text-xs font-medium"
                        style={{ color: scoreColor(ms.scores.total) }}
                      >
                        {gradeEmoji(ms.scores.total)} {gradeLabel(ms.scores.total)}
                      </div>
                    </div>
                  </div>

                  {/* Score bars */}
                  <div className="space-y-3">
                    {SUB_KEYS.map((key) => {
                      const v = ms.scores[key];
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs" style={{ color: "#8E8E93" }}>
                              {SUB_ICONS[key]} {SUB_LABELS[key]}
                            </span>
                            <span
                              className="text-xs font-semibold tabular-nums"
                              style={{ color: scoreColor(v) }}
                            >
                              {v.toFixed(1)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-white/40 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{
                                width: `${v * 10}%`,
                                background: scoreColor(v),
                                opacity: 0.7,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   MODE 2: 시기 → 도시 (Ranking)
   ================================================================ */

function MonthToCityView({
  selectedMonth,
  setSelectedMonth,
  ranking,
  onSelectCity,
}: {
  selectedMonth: number;
  setSelectedMonth: (v: number) => void;
  ranking: {
    cityId: string;
    month: number;
    scores: ScoreBreakdown;
    city: (typeof cities)[number];
    highlights: string[];
  }[];
  onSelectCity: (id: string) => void;
}) {
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  return (
    <div>
      {/* Month selector — glass pills */}
      <div
        className={`${GLASS_CARD} p-1.5 mb-6 overflow-x-auto`}
        style={{ boxShadow: GLASS_SHADOW }}
      >
        <div className="flex items-center gap-1 min-w-max">
          {MONTH_NAMES.map((name, i) => {
            const m = i + 1;
            const active = m === selectedMonth;
            const isCurrent = m === NOW_MONTH;
            return (
              <button
                key={m}
                onClick={() => { setSelectedMonth(m); setExpandedCity(null); }}
                className="text-xs px-3 py-2 rounded-xl font-medium transition-all duration-300 shrink-0"
                style={{
                  background: active ? "rgba(255,255,255,0.9)" : "transparent",
                  color: active ? "#1C1C1E" : isCurrent ? "#5AC8FA" : "#8E8E93",
                  boxShadow: active ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
                  fontWeight: active ? 600 : isCurrent ? 600 : 400,
                }}
              >
                {name}
                {isCurrent && !active && (
                  <span className="inline-block w-1 h-1 rounded-full bg-[#5AC8FA] ml-1 align-super" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ranking title */}
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="text-lg font-bold" style={{ color: "#1C1C1E" }}>
          {selectedMonth}월 추천 여행지
        </h2>
        <span className="text-xs" style={{ color: "#AEAEB2" }}>
          종합 점수 기준
        </span>
      </div>

      {/* Top 3 — large glass cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {ranking.slice(0, 3).map((item, idx) => {
          const rank = idx + 1;
          const medals = ["🥇", "🥈", "🥉"];
          const isExpanded = expandedCity === item.cityId;
          return (
            <button
              key={item.cityId}
              onClick={() => setExpandedCity(isExpanded ? null : item.cityId)}
              className={`${GLASS_CARD} p-4 text-left transition-all duration-300 hover:bg-white/90 hover:scale-[1.01] active:scale-[0.99]`}
              style={{
                boxShadow:
                  item.scores.total >= 8
                    ? `${scoreGlow(item.scores.total)}, 0 4px 24px rgba(0,0,0,0.06)`
                    : "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xl">{medals[rank - 1]}</span>
                <div
                  className="text-2xl font-bold tabular-nums"
                  style={{
                    color: scoreColor(item.scores.total),
                    textShadow:
                      item.scores.total >= 8
                        ? `0 0 12px rgba(52,199,89,0.2)`
                        : "none",
                  }}
                >
                  {item.scores.total.toFixed(1)}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{flag(item.city.countryCode)}</span>
                <div>
                  <div className="text-sm font-bold" style={{ color: "#1C1C1E" }}>
                    {item.city.nameKo}
                  </div>
                  <div className="text-[11px]" style={{ color: "#AEAEB2" }}>
                    {item.city.nameEn}
                  </div>
                </div>
              </div>

              {item.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/50 border border-white/20"
                      style={{ color: "#8E8E93" }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}

              {/* Expanded detail */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                  {SUB_KEYS.map((key) => {
                    const v = item.scores[key];
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[11px] w-12" style={{ color: "#8E8E93" }}>
                          {SUB_LABELS[key]}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/40 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${v * 10}%`,
                              background: scoreColor(v),
                              opacity: 0.7,
                            }}
                          />
                        </div>
                        <span
                          className="text-[11px] tabular-nums font-medium w-7 text-right"
                          style={{ color: scoreColor(v) }}
                        >
                          {v.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCity(item.cityId);
                    }}
                    className="w-full mt-2 text-[11px] font-medium py-1.5 rounded-lg bg-white/50 border border-white/30 transition-colors hover:bg-white/80"
                    style={{ color: "#1C1C1E" }}
                  >
                    월별 상세 보기 →
                  </button>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 4-20: compact glass rows */}
      <div className="space-y-2">
        {ranking.slice(3).map((item, idx) => {
          const rank = idx + 4;
          const isExpanded = expandedCity === item.cityId;
          return (
            <button
              key={item.cityId}
              onClick={() => setExpandedCity(isExpanded ? null : item.cityId)}
              className={`${GLASS_CARD} w-full p-3 text-left transition-all duration-300 hover:bg-white/90`}
              style={{ boxShadow: GLASS_SHADOW }}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <span
                  className="text-xs font-semibold w-6 text-center tabular-nums"
                  style={{ color: "#AEAEB2" }}
                >
                  {rank}
                </span>

                {/* Flag + Name */}
                <span className="text-base">{flag(item.city.countryCode)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>
                      {item.city.nameKo}
                    </span>
                    <span className="text-[11px]" style={{ color: "#AEAEB2" }}>
                      {item.city.nameEn}
                    </span>
                  </div>
                  {item.highlights.length > 0 && (
                    <div className="text-[10px] mt-0.5 truncate" style={{ color: "#AEAEB2" }}>
                      {item.highlights.join(" · ")}
                    </div>
                  )}
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <div
                    className="text-base font-bold tabular-nums"
                    style={{ color: scoreColor(item.scores.total) }}
                  >
                    {item.scores.total.toFixed(1)}
                  </div>
                  <div className="text-[10px]" style={{ color: scoreColor(item.scores.total) }}>
                    {gradeLabel(item.scores.total)}
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                  {SUB_KEYS.map((key) => {
                    const v = item.scores[key];
                    return (
                      <div key={key} className="flex items-center gap-2 pl-9">
                        <span className="text-[11px] w-12" style={{ color: "#8E8E93" }}>
                          {SUB_LABELS[key]}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/40 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${v * 10}%`,
                              background: scoreColor(v),
                              opacity: 0.7,
                            }}
                          />
                        </div>
                        <span
                          className="text-[11px] tabular-nums font-medium w-7 text-right"
                          style={{ color: scoreColor(v) }}
                        >
                          {v.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="pl-9">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCity(item.cityId);
                      }}
                      className="text-[11px] font-medium py-1 px-3 rounded-lg bg-white/50 border border-white/30 transition-colors hover:bg-white/80 mt-1"
                      style={{ color: "#1C1C1E" }}
                    >
                      월별 상세 보기 →
                    </button>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
