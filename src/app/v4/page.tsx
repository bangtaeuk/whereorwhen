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

const POPULAR_CITY_IDS = ["osaka", "tokyo", "bangkok", "danang", "guam", "cebu"];

const CURRENT_MONTH = new Date().getMonth() + 1;

/* ─── Helpers ───────────────────────────────────────────── */

function getFlagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

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

/* ─── Score Bar ─────────────────────────────────────────── */

function ScoreBar({
  label,
  value,
  size = "md",
}: {
  label: string;
  value: number;
  size?: "sm" | "md";
}) {
  const barColor = getScoreColor(value);
  const isSm = size === "sm";
  return (
    <div className="flex items-center gap-3">
      <span
        className={`${isSm ? "text-xs w-12" : "text-sm w-14"} shrink-0`}
        style={{ color: "#6B7684" }}
      >
        {label}
      </span>
      <div
        className={`flex-1 ${isSm ? "h-1.5" : "h-2"} rounded-full overflow-hidden`}
        style={{ background: "#F2F3F5" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(value / 10) * 100}%`, background: barColor }}
        />
      </div>
      <span
        className={`${isSm ? "text-xs w-7" : "text-sm w-8"} font-semibold text-right shrink-0`}
        style={{ color: barColor }}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */

export default function V4Page() {
  /* state */
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(CURRENT_MONTH);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [expandedCityId, setExpandedCityId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (expandedMonth !== null && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [expandedMonth]);

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
    <div className="min-h-screen flex flex-col" style={{ background: "#FFFFFF", color: "#1B1D1F" }}>
      {/* ─── A. Header ─── */}
      <header
        className="sticky top-0 z-50 bg-white"
        style={{ borderBottom: "1px solid #F2F3F5" }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center">
          <span className="text-lg font-bold tracking-tight select-none">
            where<span style={{ color: "#6B7684" }}>or</span>when
          </span>
        </div>
      </header>

      {/* ─── B. Hero ─── */}
      <section style={{ background: "#F7F8FA" }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-10 pb-8 sm:pt-14 sm:pb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2" style={{ color: "#1B1D1F" }}>
            언제 떠나면 좋을까?
          </h1>
          <p className="text-center text-sm sm:text-base mb-8" style={{ color: "#6B7684" }}>
            날씨, 환율, 혼잡도, 인기도를 종합 분석해 알려드려요
          </p>

          {/* Mode Toggle — clean text tabs */}
          <div
            className="mx-auto max-w-xs rounded-xl overflow-hidden flex"
            style={{ background: "#FFFFFF", border: "1px solid #E8EBED" }}
          >
            <button
              onClick={() => {
                setMode("where-to-when");
                setExpandedCityId(null);
              }}
              className="flex-1 py-3 text-sm font-medium transition-all duration-200 cursor-pointer relative"
              style={{
                color: mode === "where-to-when" ? "#1B1D1F" : "#ADB5BD",
                fontWeight: mode === "where-to-when" ? 700 : 500,
              }}
            >
              목적지로 검색
              {mode === "where-to-when" && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-0.5"
                  style={{ background: "#1B1D1F" }}
                />
              )}
            </button>
            <div className="w-px self-stretch my-2" style={{ background: "#E8EBED" }} />
            <button
              onClick={() => {
                setMode("when-to-where");
                setExpandedMonth(null);
              }}
              className="flex-1 py-3 text-sm font-medium transition-all duration-200 cursor-pointer relative"
              style={{
                color: mode === "when-to-where" ? "#1B1D1F" : "#ADB5BD",
                fontWeight: mode === "when-to-where" ? 700 : 500,
              }}
            >
              날짜로 검색
              {mode === "when-to-where" && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-0.5"
                  style={{ background: "#1B1D1F" }}
                />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ─── C. Input Section ─── */}
      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-6 sm:py-8">
        {mode === "where-to-when" ? (
          <div className="max-w-lg mx-auto">
            {/* Search Input */}
            <div ref={dropdownRef} className="relative">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: "#ADB5BD" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    if (!e.target.value) setSelectedCityId(null);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="어디로 떠나시나요? (예: 오사카)"
                  className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-xl text-sm sm:text-base outline-none transition-all duration-200"
                  style={{
                    border: `1px solid ${isDropdownOpen ? "#1B1D1F" : "#E8EBED"}`,
                    color: "#1B1D1F",
                  }}
                />
              </div>

              {/* Dropdown */}
              {isDropdownOpen && filteredCities.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-40"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E8EBED",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    maxHeight: 280,
                    overflowY: "auto",
                  }}
                >
                  {filteredCities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelectCity(city.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors duration-150 cursor-pointer"
                      style={{ borderBottom: "1px solid #F2F3F5" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#F7F8FA"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
                    >
                      <span className="text-base">{getFlagEmoji(city.countryCode)}</span>
                      <div>
                        <span className="font-medium text-sm" style={{ color: "#1B1D1F" }}>
                          {city.nameKo}
                        </span>
                        <span className="ml-2 text-xs" style={{ color: "#ADB5BD" }}>
                          {city.nameEn}, {city.country}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Popular Chips */}
            <div className="mt-5">
              <span className="text-xs tracking-wider mb-2.5 block" style={{ color: "#ADB5BD" }}>
                인기 여행지
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CITY_IDS.map((id) => {
                  const c = cities.find((city) => city.id === id);
                  if (!c) return null;
                  const isActive = selectedCityId === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handleSelectCity(id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm transition-all duration-200 cursor-pointer"
                      style={{
                        border: `1px solid ${isActive ? "#1B1D1F" : "#E8EBED"}`,
                        background: isActive ? "#1B1D1F" : "#FFFFFF",
                        color: isActive ? "#FFFFFF" : "#1B1D1F",
                      }}
                    >
                      {c.nameKo}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Month Selector */
          <div className="max-w-lg mx-auto">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {MONTH_NAMES.map((name, i) => {
                const month = i + 1;
                const isActive = selectedMonth === month;
                const isCurrent = CURRENT_MONTH === month;
                return (
                  <button
                    key={month}
                    onClick={() => {
                      setSelectedMonth(month);
                      setExpandedCityId(null);
                    }}
                    className="relative h-10 sm:h-11 rounded-xl text-sm transition-all duration-200 cursor-pointer"
                    style={{
                      background: isActive ? "#1B1D1F" : "#FFFFFF",
                      color: isActive ? "#FFFFFF" : "#1B1D1F",
                      border: `1px solid ${isActive ? "#1B1D1F" : "#E8EBED"}`,
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {name}
                    {isCurrent && !isActive && (
                      <span
                        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: "#1B1D1F" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ─── D. Results ─── */}

      {/* Mode A — Calendar View */}
      {mode === "where-to-when" && selectedCity && cityScores.length > 0 && (
        <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 pb-16">
          <div className="mb-5">
            <h2 className="text-lg font-bold" style={{ color: "#1B1D1F" }}>
              {selectedCity.nameKo} 여행 점수
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#6B7684" }}>
              12개월 중 최적의 시기를 찾아보세요
            </p>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {cityScores.map((ms) => {
              const isBest = bestMonthNum === ms.month;
              const isCurrent = CURRENT_MONTH === ms.month;
              const isSelected = expandedMonth === ms.month;
              const color = getScoreColor(ms.scores.total);
              const grade = getScoreGrade(ms.scores.total);
              return (
                <button
                  key={ms.month}
                  onClick={() => handleToggleMonth(ms.month)}
                  className="relative rounded-xl p-4 text-left transition-all duration-200 cursor-pointer"
                  style={{
                    background: "#FFFFFF",
                    border: isCurrent && !isSelected
                      ? "1.5px dashed #1B1D1F"
                      : `1px solid #E8EBED`,
                    boxShadow: isSelected
                      ? "0 4px 16px rgba(0,0,0,0.08)"
                      : "none",
                    transform: isSelected ? "translateY(-2px)" : undefined,
                    outline: isSelected ? "2px solid #1B1D1F" : "none",
                    outlineOffset: "-1px",
                  }}
                >
                  {/* Best badge */}
                  {isBest && (
                    <span
                      className="absolute top-2 right-2 px-1.5 py-0.5 rounded font-bold leading-none"
                      style={{
                        background: "#1B1D1F",
                        color: "#FFFFFF",
                        fontSize: "10px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      BEST
                    </span>
                  )}

                  {/* Month label */}
                  <div className="text-sm font-medium mb-2" style={{ color: "#6B7684" }}>
                    {MONTH_NAMES[ms.month - 1]}
                  </div>

                  {/* Score */}
                  <div className="text-2xl font-bold mb-1" style={{ color }}>
                    {ms.scores.total.toFixed(1)}
                  </div>

                  {/* Grade text */}
                  <span className="text-xs font-medium" style={{ color }}>
                    {grade}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detail Panel */}
          {expandedMonth !== null &&
            (() => {
              const ms = cityScores.find((s) => s.month === expandedMonth);
              if (!ms || !selectedCity) return null;
              const color = getScoreColor(ms.scores.total);
              const grade = getScoreGrade(ms.scores.total);
              const highlights = generateHighlights(
                selectedCity.id,
                ms.month,
                ms.scores,
              );
              return (
                <div
                  ref={detailRef}
                  className="mt-4 rounded-xl overflow-hidden"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E8EBED",
                    borderLeft: `4px solid ${color}`,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="p-5 sm:p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold" style={{ color: "#1B1D1F" }}>
                          {selectedCity.nameKo} · {MONTH_NAMES[ms.month - 1]}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: "#ADB5BD" }}>
                          {selectedCity.nameEn}, {selectedCity.country}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold" style={{ color }}>
                          {ms.scores.total.toFixed(1)}
                        </div>
                        <span className="text-xs font-medium" style={{ color }}>
                          {grade}
                        </span>
                      </div>
                    </div>

                    {/* Score Bars */}
                    <div className="space-y-3">
                      {SUB_SCORE_KEYS.map((key) => (
                        <ScoreBar
                          key={key}
                          label={SCORE_LABELS[key]}
                          value={ms.scores[key]}
                        />
                      ))}
                    </div>

                    {/* Highlights */}
                    {highlights.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-5 pt-5" style={{ borderTop: "1px solid #F2F3F5" }}>
                        {highlights.map((h) => (
                          <span
                            key={h}
                            className="px-3 py-1 rounded-full text-xs"
                            style={{
                              color: "#6B7684",
                              border: "1px solid #E8EBED",
                            }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
        </section>
      )}

      {/* Mode B — Ranking View */}
      {mode === "when-to-where" && (
        <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 pb-16">
          <div className="mb-5">
            <h2 className="text-lg font-bold" style={{ color: "#1B1D1F" }}>
              {MONTH_NAMES[selectedMonth - 1]} 여행지 추천
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#6B7684" }}>
              종합 점수 기준 추천 순위예요
            </p>
          </div>

          {/* Top 3 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {rankedCities.slice(0, 3).map((ms, i) => {
              const city = cities.find((c) => c.id === ms.cityId);
              if (!city) return null;
              const color = getScoreColor(ms.scores.total);
              const highlights = generateHighlights(city.id, selectedMonth, ms.scores);
              return (
                <div
                  key={ms.cityId}
                  className="rounded-xl p-5 transition-all duration-200"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E8EBED",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.03)"; }}
                >
                  <div className="flex items-center justify-between mb-3">
                    {/* Rank badge — black circle */}
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "#1B1D1F", color: "#FFFFFF" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xl font-bold" style={{ color }}>
                      {ms.scores.total.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{getFlagEmoji(city.countryCode)}</span>
                    <span className="font-bold text-sm" style={{ color: "#1B1D1F" }}>
                      {city.nameKo}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "#ADB5BD" }}>
                    {city.nameEn}, {city.country}
                  </span>
                  {highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {highlights.map((h) => (
                        <span
                          key={h}
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{ border: "1px solid #E8EBED", color: "#6B7684" }}
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

          {/* Full Ranking List (4–20) */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid #E8EBED" }}
          >
            {rankedCities.slice(3).map((ms, i) => {
              const city = cities.find((c) => c.id === ms.cityId);
              if (!city) return null;
              const color = getScoreColor(ms.scores.total);
              const rank = i + 4;
              const isExpanded = expandedCityId === ms.cityId;
              const highlights = generateHighlights(city.id, selectedMonth, ms.scores);
              return (
                <div key={ms.cityId}>
                  <button
                    onClick={() => handleToggleRankingCity(ms.cityId)}
                    className="w-full px-4 sm:px-5 py-3.5 flex items-center gap-3 sm:gap-4 text-left transition-colors duration-150 cursor-pointer"
                    style={{
                      borderBottom: "1px solid #F2F3F5",
                      background: isExpanded ? "#F7F8FA" : "#FFFFFF",
                    }}
                    onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = "#F7F8FA"; }}
                    onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = "#FFFFFF"; }}
                  >
                    {/* Rank */}
                    <span
                      className="text-sm font-medium w-6 text-center shrink-0"
                      style={{ color: "#ADB5BD" }}
                    >
                      {rank}
                    </span>

                    {/* City */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-base shrink-0">
                        {getFlagEmoji(city.countryCode)}
                      </span>
                      <span className="font-medium text-sm truncate" style={{ color: "#1B1D1F" }}>
                        {city.nameKo}
                      </span>
                    </div>

                    {/* Tags (desktop only) */}
                    <div className="hidden md:flex gap-1.5 shrink-0">
                      {highlights.slice(0, 2).map((h) => (
                        <span
                          key={h}
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            border: "1px solid #E8EBED",
                            color: "#6B7684",
                          }}
                        >
                          {h}
                        </span>
                      ))}
                    </div>

                    {/* Score */}
                    <span
                      className="text-sm font-bold shrink-0"
                      style={{ color }}
                    >
                      {ms.scores.total.toFixed(1)}
                    </span>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div
                      className="px-4 sm:px-5 py-4"
                      style={{
                        background: "#F7F8FA",
                        borderBottom: "1px solid #E8EBED",
                      }}
                    >
                      {/* Mobile tags */}
                      {highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4 md:hidden">
                          {highlights.map((h) => (
                            <span
                              key={h}
                              className="px-2 py-0.5 rounded-full text-xs"
                              style={{
                                border: "1px solid #E8EBED",
                                color: "#6B7684",
                                background: "#FFFFFF",
                              }}
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Score bars */}
                      <div className="space-y-2.5 max-w-md">
                        {SUB_SCORE_KEYS.map((key) => (
                          <ScoreBar
                            key={key}
                            label={SCORE_LABELS[key]}
                            value={ms.scores[key]}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State (Mode A, no city selected) */}
      {mode === "where-to-when" && !selectedCity && (
        <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-16 text-center">
          <div className="text-4xl mb-4 opacity-30">✈️</div>
          <p className="text-base font-medium mb-1" style={{ color: "#6B7684" }}>
            여행지를 선택하면
          </p>
          <p className="text-base font-medium mb-6" style={{ color: "#6B7684" }}>
            12개월 최적 시기를 알려드릴게요
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {POPULAR_CITY_IDS.map((id) => {
              const c = cities.find((city) => city.id === id);
              if (!c) return null;
              return (
                <button
                  key={id}
                  onClick={() => handleSelectCity(id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm transition-all duration-200 cursor-pointer"
                  style={{
                    border: "1px solid #E8EBED",
                    background: "#FFFFFF",
                    color: "#1B1D1F",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#F7F8FA"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
                >
                  <span className="text-xs">{getFlagEmoji(c.countryCode)}</span>
                  {c.nameKo}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── E. Footer ─── */}
      <footer
        className="mt-auto py-8 text-center"
        style={{ borderTop: "1px solid #F2F3F5" }}
      >
        <p className="text-xs" style={{ color: "#ADB5BD" }}>
          날씨 · 환율 · 혼잡도 · 버즈 — 4가지 데이터를 하나의 점수로
        </p>
        <p className="text-xs mt-2" style={{ color: "#ADB5BD" }}>
          whereorwhen © 2026
        </p>
      </footer>
    </div>
  );
}
