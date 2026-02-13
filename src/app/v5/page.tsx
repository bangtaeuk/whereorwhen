"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { cities } from "@/data/cities";
import { getScoresForCity, getScoresForMonth } from "@/data/mock-scores";
import { generateHighlights } from "@/lib/highlights";
import type { AppMode, ScoreBreakdown } from "@/types";

/* ─── Constants ─────────────────────────────────────────── */

const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const SUB_SCORE_KEYS: (keyof Omit<ScoreBreakdown, "total">)[] = [
  "weather", "cost", "crowd", "buzz",
];

const SCORE_LABELS: Record<keyof Omit<ScoreBreakdown, "total">, string> = {
  weather: "날씨",
  cost: "비용",
  crowd: "혼잡도",
  buzz: "버즈",
};

const CURRENT_MONTH = new Date().getMonth() + 1;

/* ─── Helpers ───────────────────────────────────────────── */

function getScoreColor(score: number): string {
  if (score >= 8.0) return "#00C471";
  if (score >= 6.0) return "#4A90D9";
  if (score >= 4.0) return "#F5A623";
  return "#E8554F";
}

function getScoreGrade(score: number): string {
  if (score >= 8.0) return "최적";
  if (score >= 6.0) return "좋음";
  if (score >= 4.0) return "보통";
  return "비추천";
}

/* ─── Thin Score Line ──────────────────────────────────── */

function ScoreLine({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const color = getScoreColor(value);
  return (
    <div className="flex items-center gap-4 py-1.5">
      <span className="text-xs tracking-wide w-12 shrink-0" style={{ color: "#888" }}>
        {label}
      </span>
      <div className="flex-1 h-[2px] rounded-full overflow-hidden" style={{ background: "#F0F0F0" }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${(value / 10) * 100}%`, background: color }}
        />
      </div>
      <span
        className="text-xs tabular-nums w-7 text-right shrink-0 font-light"
        style={{ color }}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */

export default function V5Page() {
  /* state */
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(CURRENT_MONTH);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [expandedCityId, setExpandedCityId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  /* derived */
  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId) ?? null,
    [selectedCityId],
  );

  const cityScores = useMemo(
    () => (selectedCityId ? getScoresForCity(selectedCityId) : []),
    [selectedCityId],
  );

  const rankedCities = useMemo(
    () =>
      [...getScoresForMonth(selectedMonth)].sort(
        (a, b) => b.scores.total - a.scores.total,
      ),
    [selectedMonth],
  );

  const bestMonthNum = useMemo(() => {
    if (!cityScores.length) return null;
    return cityScores.reduce((best, cur) =>
      cur.scores.total > best.scores.total ? cur : best,
    ).month;
  }, [cityScores]);

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return cities;
    const q = searchQuery.toLowerCase();
    return cities.filter(
      (c) =>
        c.nameKo.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.country.includes(q),
    );
  }, [searchQuery]);

  /* effects */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* handlers */
  const handleSelectCity = useCallback((cityId: string) => {
    setSelectedCityId(cityId);
    setSearchQuery(cities.find((c) => c.id === cityId)?.nameKo ?? "");
    setIsDropdownOpen(false);
    setExpandedMonth(null);
  }, []);

  const handleToggleMonth = useCallback((month: number) => {
    setExpandedMonth((prev) => (prev === month ? null : month));
  }, []);

  const handleToggleRankingCity = useCallback((cityId: string) => {
    setExpandedCityId((prev) => (prev === cityId ? null : cityId));
  }, []);

  /* ────────────────────── render ────────────────────────── */
  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ background: "#FFFFFF", color: "#111" }}
    >
      {/* ─── A. Header ─── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-6 h-16 flex items-center">
          <span className="text-base font-light tracking-[0.08em] select-none">
            where<span style={{ color: "#888" }}>or</span>when
          </span>
        </div>
        <div className="h-[0.5px]" style={{ background: "#EAEAEA" }} />
      </header>

      {/* ─── B. Hero ─── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h1
            className="text-center text-xl sm:text-2xl font-extralight tracking-tight"
            style={{ color: "#111" }}
          >
            언제 떠나면 좋을까?
          </h1>
          <p
            className="text-center text-sm font-light mt-3"
            style={{ color: "#888" }}
          >
            날씨 · 환율 · 혼잡도 · 인기도 종합 분석
          </p>

          {/* Mode Toggle — just two words */}
          <div className="flex items-center justify-center gap-8 mt-12">
            <button
              onClick={() => {
                setMode("where-to-when");
                setExpandedCityId(null);
              }}
              className="relative pb-1.5 text-sm tracking-wide transition-colors duration-300 cursor-pointer"
              style={{
                color: mode === "where-to-when" ? "#111" : "#CCC",
                fontWeight: mode === "where-to-when" ? 400 : 300,
              }}
            >
              목적지로
              {mode === "where-to-when" && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[0.5px] transition-all duration-300"
                  style={{ background: "#111" }}
                />
              )}
            </button>
            <button
              onClick={() => {
                setMode("when-to-where");
                setExpandedMonth(null);
              }}
              className="relative pb-1.5 text-sm tracking-wide transition-colors duration-300 cursor-pointer"
              style={{
                color: mode === "when-to-where" ? "#111" : "#CCC",
                fontWeight: mode === "when-to-where" ? 400 : 300,
              }}
            >
              날짜로
              {mode === "when-to-where" && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[0.5px] transition-all duration-300"
                  style={{ background: "#111" }}
                />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ─── C. Content ─── */}
      <section className="flex-1 pb-24">
        <div className="mx-auto max-w-3xl px-6">
          {mode === "where-to-when" ? (
            /* ━━━━━ WHERE → WHEN ━━━━━ */
            <div>
              {/* City Selector — borderless, bottom line only */}
              <div ref={dropdownRef} className="relative max-w-sm mx-auto mb-16">
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    if (!e.target.value) {
                      setSelectedCityId(null);
                      setExpandedMonth(null);
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="도시 이름"
                  className="w-full bg-transparent text-center text-lg font-light tracking-wide pb-2 outline-none placeholder:text-[#DDD] border-none"
                  style={{ borderBottom: "0.5px solid #EAEAEA" }}
                />
                {/* Dropdown */}
                {isDropdownOpen && filteredCities.length > 0 && !selectedCity && (
                  <div
                    className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto z-40 bg-white"
                    style={{ borderBottom: "0.5px solid #EAEAEA" }}
                  >
                    {filteredCities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => handleSelectCity(city.id)}
                        className="w-full text-left px-4 py-3 text-sm font-light transition-colors duration-200 cursor-pointer hover:bg-[#FAFAFA]"
                        style={{ color: "#111" }}
                      >
                        <span>{city.nameKo}</span>
                        <span className="ml-2" style={{ color: "#CCC" }}>
                          {city.nameEn}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Empty State */}
              {!selectedCity && (
                <div className="flex items-center justify-center py-24">
                  <span
                    className="text-6xl sm:text-7xl font-extralight select-none"
                    style={{ color: "#DDD" }}
                  >
                    어디로?
                  </span>
                </div>
              )}

              {/* Calendar Grid — no borders, floating numbers */}
              {selectedCity && cityScores.length > 0 && (
                <div>
                  {/* City name + country */}
                  <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl font-extralight tracking-tight">
                      {selectedCity.nameKo}
                    </h2>
                    <p className="text-xs font-light mt-2" style={{ color: "#888" }}>
                      {selectedCity.nameEn} · {selectedCity.country}
                    </p>
                  </div>

                  {/* Month Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-6 max-w-xl mx-auto">
                    {cityScores.map((ms) => {
                      const isExpanded = expandedMonth === ms.month;
                      const isBest = ms.month === bestMonthNum;
                      const color = getScoreColor(ms.scores.total);
                      return (
                        <button
                          key={ms.month}
                          onClick={() => handleToggleMonth(ms.month)}
                          className="group relative flex flex-col items-center py-6 cursor-pointer transition-all duration-300"
                          style={{
                            background: isExpanded ? "#FAFAFA" : "transparent",
                            borderRadius: isExpanded ? "8px" : "0",
                          }}
                        >
                          {/* Month label */}
                          <span
                            className="text-xs tracking-wider mb-3"
                            style={{ color: "#888" }}
                          >
                            {MONTH_NAMES[ms.month - 1]}
                          </span>
                          {/* Score — HUGE, thin */}
                          <span
                            className="text-5xl font-light tabular-nums leading-none transition-colors duration-300"
                            style={{ color }}
                          >
                            {ms.scores.total.toFixed(1)}
                          </span>
                          {/* Best badge */}
                          {isBest && (
                            <span
                              className="text-[10px] tracking-widest uppercase mt-3 font-light"
                              style={{ color: "#00C471" }}
                            >
                              best
                            </span>
                          )}
                          {/* Hover dot */}
                          <span
                            className="absolute bottom-2 w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: "#CCC" }}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Detail Panel — thin line separator, minimal */}
                  {expandedMonth !== null && (() => {
                    const ms = cityScores.find((m) => m.month === expandedMonth);
                    if (!ms) return null;
                    const highlights = generateHighlights(
                      selectedCity.id,
                      ms.month,
                      ms.scores,
                    );
                    return (
                      <div className="mt-12 max-w-md mx-auto">
                        {/* Separator */}
                        <div className="h-[0.5px] mb-8" style={{ background: "#EAEAEA" }} />

                        {/* Header */}
                        <div className="flex items-baseline justify-between mb-6">
                          <div>
                            <span className="text-sm font-light" style={{ color: "#888" }}>
                              {selectedCity.nameKo}
                            </span>
                            <span className="text-sm font-light mx-2" style={{ color: "#DDD" }}>
                              ·
                            </span>
                            <span className="text-sm font-light" style={{ color: "#111" }}>
                              {MONTH_NAMES[ms.month - 1]}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span
                              className="text-3xl font-light tabular-nums"
                              style={{ color: getScoreColor(ms.scores.total) }}
                            >
                              {ms.scores.total.toFixed(1)}
                            </span>
                            <span className="text-xs font-light" style={{ color: "#888" }}>
                              {getScoreGrade(ms.scores.total)}
                            </span>
                          </div>
                        </div>

                        {/* Score lines — 2px thin bars */}
                        <div className="space-y-1">
                          {SUB_SCORE_KEYS.map((key) => (
                            <ScoreLine
                              key={key}
                              label={SCORE_LABELS[key]}
                              value={ms.scores[key]}
                            />
                          ))}
                        </div>

                        {/* Highlights */}
                        {highlights.length > 0 && (
                          <div className="mt-6 flex flex-wrap gap-2">
                            {highlights.map((h) => (
                              <span
                                key={h}
                                className="text-xs font-light px-2.5 py-1 rounded-full"
                                style={{ color: "#888", background: "#FAFAFA" }}
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            /* ━━━━━ WHEN → WHERE ━━━━━ */
            <div>
              {/* Month selector — minimal horizontal scroll */}
              <div className="flex justify-center gap-1 mb-16 flex-wrap">
                {MONTH_NAMES.map((name, i) => {
                  const m = i + 1;
                  const isActive = selectedMonth === m;
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setSelectedMonth(m);
                        setExpandedCityId(null);
                      }}
                      className="relative px-3 py-1.5 text-sm transition-all duration-300 cursor-pointer"
                      style={{
                        color: isActive ? "#111" : "#CCC",
                        fontWeight: isActive ? 400 : 300,
                      }}
                    >
                      {name}
                      {isActive && (
                        <span
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                          style={{ background: "#111" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Ranking — minimal list, stock ticker style */}
              <div className="max-w-md mx-auto">
                {rankedCities.map((ms, idx) => {
                  const city = cities.find((c) => c.id === ms.cityId);
                  if (!city) return null;
                  const isExpanded = expandedCityId === ms.cityId;
                  const color = getScoreColor(ms.scores.total);
                  const highlights = generateHighlights(
                    ms.cityId,
                    selectedMonth,
                    ms.scores,
                  );

                  return (
                    <div key={ms.cityId}>
                      <button
                        onClick={() => handleToggleRankingCity(ms.cityId)}
                        className="w-full flex items-center py-4 cursor-pointer transition-colors duration-200 group"
                      >
                        {/* Rank */}
                        <span
                          className="text-xs tabular-nums w-6 shrink-0 font-light"
                          style={{ color: idx < 3 ? "#111" : "#CCC" }}
                        >
                          {idx + 1}
                        </span>

                        {/* City name */}
                        <span className="flex-1 text-left text-sm font-light tracking-wide">
                          {city.nameKo}
                          <span className="ml-2 text-xs" style={{ color: "#CCC" }}>
                            {city.nameEn}
                          </span>
                        </span>

                        {/* Score */}
                        <span
                          className="text-2xl font-light tabular-nums"
                          style={{ color }}
                        >
                          {ms.scores.total.toFixed(1)}
                        </span>

                        {/* Hover dot */}
                        <span
                          className="ml-3 w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: "#CCC" }}
                        />
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="pb-6 pl-6 pr-0">
                          {/* Thin separator */}
                          <div className="h-[0.5px] mb-5" style={{ background: "#EAEAEA" }} />

                          {/* Score breakdown — thin lines */}
                          <div className="space-y-1">
                            {SUB_SCORE_KEYS.map((key) => (
                              <ScoreLine
                                key={key}
                                label={SCORE_LABELS[key]}
                                value={ms.scores[key]}
                              />
                            ))}
                          </div>

                          {/* Highlights */}
                          {highlights.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {highlights.map((h) => (
                                <span
                                  key={h}
                                  className="text-xs font-light px-2.5 py-1 rounded-full"
                                  style={{ color: "#888", background: "#FAFAFA" }}
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Divider between items — barely visible */}
                      {idx < rankedCities.length - 1 && !isExpanded && (
                        <div className="h-[0.5px]" style={{ background: "#F5F5F5" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── D. Footer ─── */}
      <footer className="py-12">
        <div className="mx-auto max-w-3xl px-6">
          <div className="h-[0.5px] mb-8" style={{ background: "#EAEAEA" }} />
          <p className="text-center text-xs font-light" style={{ color: "#CCC" }}>
            whereorwhen · 여행 최적 시기 분석
          </p>
        </div>
      </footer>
    </div>
  );
}
