"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { cities } from "@/data/cities";
import { getScoresForCity, getScoresForMonth } from "@/data/mock-scores";
import { generateHighlights } from "@/lib/highlights";
import type { AppMode, ScoreBreakdown } from "@/types";

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const MONTH_EN = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const SCORE_LABELS: Record<keyof ScoreBreakdown, string> = {
  weather: "날씨",
  cost: "비용",
  crowd: "혼잡도",
  buzz: "버즈",
  total: "종합",
};

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

// ─── Score color helpers ─────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 8.0) return "#D4A853";
  if (score >= 6.0) return "#C4956A";
  if (score >= 4.0) return "#9CA3AF";
  return "#6B7280";
}

function getScoreGradient(score: number): string {
  if (score >= 8.0) return "linear-gradient(135deg, #D4A853, #E8C97A)";
  if (score >= 6.0) return "linear-gradient(135deg, #C4956A, #D4A87A)";
  if (score >= 4.0) return "linear-gradient(135deg, #9CA3AF, #B0B8C4)";
  return "linear-gradient(135deg, #6B7280, #7E8A96)";
}

function getScoreLabel(score: number): string {
  if (score >= 8.0) return "최적";
  if (score >= 6.0) return "좋음";
  if (score >= 4.0) return "보통";
  return "비추";
}

function getScoreBg(score: number): string {
  if (score >= 8.0) return "rgba(212, 168, 83, 0.12)";
  if (score >= 6.0) return "rgba(196, 149, 106, 0.08)";
  if (score >= 4.0) return "rgba(156, 163, 175, 0.06)";
  return "rgba(107, 114, 128, 0.04)";
}

function getFlag(countryCode: string): string {
  return String.fromCodePoint(
    ...countryCode
      .toUpperCase()
      .split("")
      .map((c) => 127397 + c.charCodeAt(0))
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function V1Page() {
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mode A: city → 12 months
  const calendarScores = useMemo(() => {
    if (!selectedCityId) return [];
    return getScoresForCity(selectedCityId);
  }, [selectedCityId]);

  // Mode B: month → ranked cities
  const monthRankings = useMemo(() => {
    const monthScores = getScoresForMonth(selectedMonth);
    return cities
      .map((city) => {
        const monthData = monthScores.find((s) => s.cityId === city.id);
        const scores = monthData?.scores || {
          weather: 5,
          cost: 5,
          crowd: 5,
          buzz: 5,
          total: 5,
        };
        return {
          cityId: city.id,
          cityNameKo: city.nameKo,
          cityNameEn: city.nameEn,
          country: city.country,
          countryCode: city.countryCode,
          scores,
          highlights: generateHighlights(city.id, selectedMonth, scores),
        };
      })
      .sort((a, b) => b.scores.total - a.scores.total);
  }, [selectedMonth]);

  const selectedCity = cities.find((c) => c.id === selectedCityId);

  const filteredCities = useMemo(
    () =>
      cities.filter(
        (c) =>
          c.nameKo.includes(citySearchQuery) ||
          c.nameEn.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          c.country.includes(citySearchQuery)
      ),
    [citySearchQuery]
  );

  const handleCitySelect = useCallback((cityId: string) => {
    setSelectedCityId(cityId);
    setCitySearchQuery("");
    setIsCityDropdownOpen(false);
    setExpandedMonth(null);
  }, []);

  const handleModeSwitch = useCallback((newMode: AppMode) => {
    setMode(newMode);
    setExpandedMonth(null);
    setExpandedCity(null);
  }, []);

  return (
    <>
      {/* Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      <main
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: "#0C0C0E",
          backgroundImage: NOISE_SVG,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
        className="min-h-screen text-[#F5F0E8] selection:bg-[#D4A853]/30 selection:text-white"
      >
        {/* ─── Grain overlay ──────────────────────────────────────── */}
        <div
          className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
          style={{
            backgroundImage: NOISE_SVG,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
            mixBlendMode: "overlay",
          }}
        />

        {/* ─── Header ─────────────────────────────────────────────── */}
        <header className="relative pt-14 sm:pt-20 pb-10 px-6 text-center">
          {/* Subtle gold glow behind logo */}
          <div
            className="absolute left-1/2 top-12 -translate-x-1/2 w-80 h-40 rounded-full opacity-[0.06] blur-3xl"
            style={{ background: "radial-gradient(circle, #D4A853 0%, transparent 70%)" }}
          />

          <h1
            className="relative text-5xl sm:text-7xl lg:text-8xl font-bold tracking-[-0.03em] leading-none"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            where
            <span
              className="inline-block"
              style={{
                background: "linear-gradient(135deg, #D4A853, #E8C97A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontStyle: "italic",
              }}
            >
              or
            </span>
            when
          </h1>

          <p
            className="mt-4 text-sm sm:text-base tracking-[0.2em] uppercase"
            style={{ color: "#7C8B6F" }}
          >
            여행의 최적 시기를 찾아드립니다
          </p>

          {/* Gold accent line */}
          <div className="mx-auto mt-8 flex items-center justify-center gap-3">
            <div className="h-px w-12 sm:w-20" style={{ background: "linear-gradient(to right, transparent, #D4A853)" }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#D4A853" }} />
            <div className="h-px w-12 sm:w-20" style={{ background: "linear-gradient(to left, transparent, #D4A853)" }} />
          </div>
        </header>

        {/* ─── Content ────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">

          {/* ─── Mode Toggle ────────────────────────────────────── */}
          <div className="flex justify-center mb-12 sm:mb-16">
            <div
              className="relative inline-flex rounded-full p-1"
              style={{ background: "#18181B", border: "1px solid rgba(212, 168, 83, 0.15)" }}
            >
              <div
                className="absolute top-1 bottom-1 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  width: "calc(50% - 4px)",
                  left: mode === "where-to-when" ? "4px" : "calc(50%)",
                  background: "linear-gradient(135deg, rgba(212, 168, 83, 0.15), rgba(212, 168, 83, 0.08))",
                  border: "1px solid rgba(212, 168, 83, 0.25)",
                }}
              />

              <button
                onClick={() => handleModeSwitch("where-to-when")}
                className="relative z-10 px-5 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors duration-300 cursor-pointer"
                style={{ color: mode === "where-to-when" ? "#D4A853" : "#6B7280" }}
              >
                도시 → 시기
              </button>

              <button
                onClick={() => handleModeSwitch("when-to-where")}
                className="relative z-10 px-5 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors duration-300 cursor-pointer"
                style={{ color: mode === "when-to-where" ? "#D4A853" : "#6B7280" }}
              >
                시기 → 도시
              </button>
            </div>
          </div>

          {/* ─── Mode A: Where → When ───────────────────────────── */}
          {mode === "where-to-when" && (
            <section>
              {/* City search */}
              <div className="max-w-xl mx-auto mb-12 sm:mb-16" ref={dropdownRef}>
                <label
                  className="block text-[10px] sm:text-xs font-semibold tracking-[0.25em] uppercase mb-3"
                  style={{ color: "#7C8B6F" }}
                >
                  여행지 선택
                </label>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="도시를 검색하세요"
                    value={
                      isCityDropdownOpen
                        ? citySearchQuery
                        : selectedCity
                          ? `${selectedCity.nameKo} · ${selectedCity.nameEn}`
                          : citySearchQuery
                    }
                    onChange={(e) => {
                      setCitySearchQuery(e.target.value);
                      setIsCityDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setIsCityDropdownOpen(true);
                      if (selectedCity) setCitySearchQuery("");
                    }}
                    className="w-full px-5 py-4 rounded-xl text-sm transition-all duration-300 outline-none placeholder:text-[#4B5563]"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      background: "#18181B",
                      border: "1px solid rgba(212, 168, 83, 0.15)",
                      color: "#F5F0E8",
                    }}
                  />

                  {/* Search icon */}
                  <svg
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "#4B5563" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>

                  {/* Dropdown */}
                  {isCityDropdownOpen && (
                    <div
                      className="absolute z-40 w-full mt-2 rounded-xl max-h-80 overflow-y-auto overflow-x-hidden"
                      style={{
                        background: "#18181B",
                        border: "1px solid rgba(212, 168, 83, 0.15)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                      }}
                    >
                      {filteredCities.length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm" style={{ color: "#4B5563" }}>
                          검색 결과가 없습니다
                        </div>
                      ) : (
                        filteredCities.map((city) => (
                          <button
                            key={city.id}
                            onClick={() => handleCitySelect(city.id)}
                            className="w-full text-left px-5 py-3.5 flex items-center gap-3 transition-all duration-200 cursor-pointer group"
                            style={{
                              background:
                                selectedCityId === city.id
                                  ? "rgba(212, 168, 83, 0.08)"
                                  : "transparent",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background =
                                "rgba(212, 168, 83, 0.08)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background =
                                selectedCityId === city.id
                                  ? "rgba(212, 168, 83, 0.08)"
                                  : "transparent";
                            }}
                          >
                            <span className="text-lg shrink-0">{getFlag(city.countryCode)}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold" style={{ color: "#F5F0E8" }}>
                                {city.nameKo}
                              </span>
                              <span className="text-xs ml-2" style={{ color: "#6B7280" }}>
                                {city.nameEn}
                              </span>
                            </div>
                            <span
                              className="text-[10px] tracking-widest uppercase"
                              style={{ color: "#4B5563" }}
                            >
                              {city.country}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Calendar / Results */}
              {selectedCityId && selectedCity ? (
                <div>
                  {/* City header */}
                  <div className="flex items-end gap-4 sm:gap-6 mb-8 sm:mb-12">
                    <span className="text-4xl sm:text-5xl">{getFlag(selectedCity.countryCode)}</span>
                    <div>
                      <h2
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
                        style={{ fontFamily: "'Playfair Display', serif", color: "#F5F0E8" }}
                      >
                        {selectedCity.nameKo}
                      </h2>
                      <p
                        className="text-xs sm:text-sm tracking-[0.15em] uppercase mt-1"
                        style={{ color: "#6B7280" }}
                      >
                        {selectedCity.nameEn} · {selectedCity.country}
                      </p>
                    </div>
                  </div>

                  {/* Gold divider */}
                  <div
                    className="h-px mb-8 sm:mb-12"
                    style={{ background: "linear-gradient(to right, #D4A853, transparent)" }}
                  />

                  {/* 12 Month Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {calendarScores.map((ms) => {
                      const isExpanded = expandedMonth === ms.month;
                      const highlights = generateHighlights(
                        selectedCityId,
                        ms.month,
                        ms.scores
                      );
                      const isBest =
                        ms.scores.total ===
                        Math.max(...calendarScores.map((s) => s.scores.total));

                      return (
                        <div
                          key={ms.month}
                          onClick={() =>
                            setExpandedMonth(isExpanded ? null : ms.month)
                          }
                          className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                          style={{
                            background: isExpanded
                              ? "rgba(212, 168, 83, 0.06)"
                              : "#18181B",
                            border: `1px solid ${
                              isBest
                                ? "rgba(212, 168, 83, 0.35)"
                                : isExpanded
                                  ? "rgba(212, 168, 83, 0.2)"
                                  : "rgba(255, 255, 255, 0.04)"
                            }`,
                            transform: isExpanded ? "scale(1.02)" : "scale(1)",
                          }}
                        >
                          {/* Best badge */}
                          {isBest && (
                            <div
                              className="absolute top-0 right-0 px-2 py-0.5 text-[8px] sm:text-[9px] font-bold tracking-[0.2em] uppercase rounded-bl-lg"
                              style={{
                                background: "linear-gradient(135deg, #D4A853, #E8C97A)",
                                color: "#0C0C0E",
                              }}
                            >
                              BEST
                            </div>
                          )}

                          <div className="p-4 sm:p-5">
                            {/* Month label */}
                            <div className="flex items-baseline justify-between mb-3">
                              <div>
                                <span
                                  className="text-[10px] font-semibold tracking-[0.3em] uppercase block"
                                  style={{ color: "#7C8B6F" }}
                                >
                                  {MONTH_EN[ms.month - 1]}
                                </span>
                                <span
                                  className="text-lg sm:text-xl font-bold"
                                  style={{
                                    fontFamily: "'Playfair Display', serif",
                                    color: "#F5F0E8",
                                  }}
                                >
                                  {MONTH_LABELS[ms.month - 1]}
                                </span>
                              </div>

                              {/* Score circle */}
                              <div className="text-right">
                                <span
                                  className="text-2xl sm:text-3xl font-bold block leading-none"
                                  style={{
                                    fontFamily: "'Playfair Display', serif",
                                    background: getScoreGradient(ms.scores.total),
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                  }}
                                >
                                  {ms.scores.total.toFixed(1)}
                                </span>
                                <span
                                  className="text-[9px] tracking-[0.15em] uppercase"
                                  style={{ color: getScoreColor(ms.scores.total) }}
                                >
                                  {getScoreLabel(ms.scores.total)}
                                </span>
                              </div>
                            </div>

                            {/* Score bar */}
                            <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.05)" }}>
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${ms.scores.total * 10}%`,
                                  background: getScoreGradient(ms.scores.total),
                                }}
                              />
                            </div>

                            {/* Highlights */}
                            {highlights.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {highlights.map((h, i) => (
                                  <span
                                    key={i}
                                    className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full"
                                    style={{
                                      background: "rgba(124, 139, 111, 0.15)",
                                      color: "#7C8B6F",
                                      border: "1px solid rgba(124, 139, 111, 0.2)",
                                    }}
                                  >
                                    {h}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Expanded detail */}
                            <div
                              className="overflow-hidden transition-all duration-500"
                              style={{
                                maxHeight: isExpanded ? "200px" : "0",
                                opacity: isExpanded ? 1 : 0,
                                marginTop: isExpanded ? "12px" : "0",
                              }}
                            >
                              <div
                                className="h-px mb-3"
                                style={{ background: "rgba(212, 168, 83, 0.15)" }}
                              />
                              {(
                                ["weather", "cost", "crowd", "buzz"] as (keyof ScoreBreakdown)[]
                              ).map((key) => (
                                <div key={key} className="flex items-center justify-between py-1.5">
                                  <span
                                    className="text-[10px] tracking-[0.15em] uppercase"
                                    style={{ color: "#6B7280" }}
                                  >
                                    {SCORE_LABELS[key]}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-16 sm:w-20 h-1 rounded-full overflow-hidden"
                                      style={{ background: "rgba(255,255,255,0.05)" }}
                                    >
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${ms.scores[key] * 10}%`,
                                          background: getScoreColor(ms.scores[key]),
                                        }}
                                      />
                                    </div>
                                    <span
                                      className="text-xs font-semibold w-7 text-right"
                                      style={{ color: getScoreColor(ms.scores[key]) }}
                                    >
                                      {ms.scores[key].toFixed(1)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Empty State */
                <EmptyState />
              )}
            </section>
          )}

          {/* ─── Mode B: When → Where ───────────────────────────── */}
          {mode === "when-to-where" && (
            <section>
              {/* Month selector */}
              <div className="max-w-2xl mx-auto mb-12 sm:mb-16">
                <label
                  className="block text-[10px] sm:text-xs font-semibold tracking-[0.25em] uppercase mb-4 text-center"
                  style={{ color: "#7C8B6F" }}
                >
                  여행 시기 선택
                </label>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
                  {MONTH_LABELS.map((name, idx) => {
                    const month = idx + 1;
                    const isActive = selectedMonth === month;
                    const isCurrent = new Date().getMonth() + 1 === month;

                    return (
                      <button
                        key={month}
                        onClick={() => {
                          setSelectedMonth(month);
                          setExpandedCity(null);
                        }}
                        className="relative py-3 sm:py-3.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer"
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          background: isActive
                            ? "linear-gradient(135deg, rgba(212, 168, 83, 0.2), rgba(212, 168, 83, 0.08))"
                            : "#18181B",
                          border: `1px solid ${
                            isActive
                              ? "rgba(212, 168, 83, 0.4)"
                              : "rgba(255, 255, 255, 0.04)"
                          }`,
                          color: isActive ? "#D4A853" : "#6B7280",
                        }}
                      >
                        <span className="block text-[9px] tracking-[0.2em] mb-0.5" style={{ color: isActive ? "#D4A853" : "#4B5563" }}>
                          {MONTH_EN[idx]}
                        </span>
                        {name}
                        {isCurrent && !isActive && (
                          <span
                            className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                            style={{ background: "#7C8B6F" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ranking header */}
              <div className="flex items-end justify-between mb-6 sm:mb-8">
                <div>
                  <span
                    className="text-[10px] sm:text-xs tracking-[0.25em] uppercase block"
                    style={{ color: "#7C8B6F" }}
                  >
                    {MONTH_EN[selectedMonth - 1]} RANKING
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
                    style={{ fontFamily: "'Playfair Display', serif", color: "#F5F0E8" }}
                  >
                    {MONTH_LABELS[selectedMonth - 1]} 추천 여행지
                  </h2>
                </div>
                <span
                  className="text-xs tracking-wider"
                  style={{ color: "#4B5563" }}
                >
                  {monthRankings.length}개 도시
                </span>
              </div>

              {/* Gold divider */}
              <div
                className="h-px mb-6 sm:mb-8"
                style={{ background: "linear-gradient(to right, #D4A853, transparent)" }}
              />

              {/* Ranking list */}
              <div className="space-y-3">
                {monthRankings.map((item, idx) => {
                  const rank = idx + 1;
                  const isExpanded = expandedCity === item.cityId;
                  const isTop3 = rank <= 3;

                  return (
                    <div
                      key={item.cityId}
                      onClick={() =>
                        setExpandedCity(isExpanded ? null : item.cityId)
                      }
                      className="rounded-xl overflow-hidden cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{
                        background: isExpanded
                          ? "rgba(212, 168, 83, 0.05)"
                          : "#18181B",
                        border: `1px solid ${
                          isTop3 && !isExpanded
                            ? "rgba(212, 168, 83, 0.12)"
                            : isExpanded
                              ? "rgba(212, 168, 83, 0.2)"
                              : "rgba(255, 255, 255, 0.03)"
                        }`,
                      }}
                    >
                      <div className="flex items-center gap-3 sm:gap-5 p-4 sm:p-5">
                        {/* Rank number */}
                        <div className="w-8 sm:w-10 shrink-0 text-center">
                          <span
                            className="text-lg sm:text-2xl font-bold"
                            style={{
                              fontFamily: "'Playfair Display', serif",
                              color: isTop3 ? "#D4A853" : "#4B5563",
                            }}
                          >
                            {rank}
                          </span>
                        </div>

                        {/* Flag + city info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl sm:text-3xl shrink-0">
                            {getFlag(item.countryCode)}
                          </span>
                          <div className="min-w-0">
                            <h3
                              className="text-base sm:text-lg font-bold truncate"
                              style={{
                                fontFamily: "'Playfair Display', serif",
                                color: "#F5F0E8",
                              }}
                            >
                              {item.cityNameKo}
                            </h3>
                            <p
                              className="text-[10px] sm:text-xs tracking-[0.1em] uppercase truncate"
                              style={{ color: "#6B7280" }}
                            >
                              {item.cityNameEn} · {item.country}
                            </p>
                          </div>
                        </div>

                        {/* Highlights */}
                        <div className="hidden sm:flex gap-1.5 shrink-0">
                          {item.highlights.slice(0, 2).map((h, i) => (
                            <span
                              key={i}
                              className="text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap"
                              style={{
                                background: "rgba(124, 139, 111, 0.12)",
                                color: "#7C8B6F",
                                border: "1px solid rgba(124, 139, 111, 0.15)",
                              }}
                            >
                              {h}
                            </span>
                          ))}
                        </div>

                        {/* Score */}
                        <div className="text-right shrink-0 ml-2">
                          <span
                            className="text-xl sm:text-2xl font-bold block leading-none"
                            style={{
                              fontFamily: "'Playfair Display', serif",
                              background: getScoreGradient(item.scores.total),
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            {item.scores.total.toFixed(1)}
                          </span>
                          <span
                            className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase"
                            style={{ color: getScoreColor(item.scores.total) }}
                          >
                            {getScoreLabel(item.scores.total)}
                          </span>
                        </div>

                        {/* Chevron */}
                        <svg
                          className="w-4 h-4 shrink-0 transition-transform duration-300"
                          style={{
                            color: "#4B5563",
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>

                      {/* Expanded detail */}
                      <div
                        className="overflow-hidden transition-all duration-500"
                        style={{
                          maxHeight: isExpanded ? "300px" : "0",
                          opacity: isExpanded ? 1 : 0,
                        }}
                      >
                        <div className="px-4 sm:px-5 pb-5">
                          <div
                            className="h-px mb-4"
                            style={{ background: "rgba(212, 168, 83, 0.1)" }}
                          />

                          {/* Mobile highlights */}
                          {item.highlights.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4 sm:hidden">
                              {item.highlights.map((h, i) => (
                                <span
                                  key={i}
                                  className="text-[9px] px-2 py-0.5 rounded-full"
                                  style={{
                                    background: "rgba(124, 139, 111, 0.12)",
                                    color: "#7C8B6F",
                                    border: "1px solid rgba(124, 139, 111, 0.15)",
                                  }}
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Score breakdown */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(
                              ["weather", "cost", "crowd", "buzz"] as (keyof ScoreBreakdown)[]
                            ).map((key) => (
                              <div
                                key={key}
                                className="rounded-lg p-3"
                                style={{ background: getScoreBg(item.scores[key]) }}
                              >
                                <span
                                  className="text-[9px] tracking-[0.2em] uppercase block mb-1"
                                  style={{ color: "#6B7280" }}
                                >
                                  {SCORE_LABELS[key]}
                                </span>
                                <span
                                  className="text-lg font-bold"
                                  style={{
                                    fontFamily: "'Playfair Display', serif",
                                    color: getScoreColor(item.scores[key]),
                                  }}
                                >
                                  {item.scores[key].toFixed(1)}
                                </span>
                                {/* Mini bar */}
                                <div
                                  className="h-0.5 rounded-full mt-2 overflow-hidden"
                                  style={{ background: "rgba(255,255,255,0.05)" }}
                                >
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${item.scores[key] * 10}%`,
                                      background: getScoreColor(item.scores[key]),
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ─── Footer ───────────────────────────────────────────── */}
        <footer className="relative pb-12 pt-16 text-center">
          {/* Gold line */}
          <div className="mx-auto mb-8 flex items-center justify-center gap-3">
            <div className="h-px w-16 sm:w-24" style={{ background: "linear-gradient(to right, transparent, rgba(212, 168, 83, 0.3))" }} />
            <div className="w-1 h-1 rotate-45" style={{ background: "rgba(212, 168, 83, 0.4)" }} />
            <div className="h-px w-16 sm:w-24" style={{ background: "linear-gradient(to left, transparent, rgba(212, 168, 83, 0.3))" }} />
          </div>

          <p
            className="text-[10px] sm:text-xs tracking-[0.2em] uppercase"
            style={{ color: "#4B5563" }}
          >
            날씨 · 환율 · 혼잡도 · 버즈 — 4가지 데이터를 하나의 점수로
          </p>
          <p className="mt-3 text-xs" style={{ color: "#374151" }}>
            <span style={{ fontFamily: "'Playfair Display', serif" }}>
              where
              <span
                style={{
                  background: "linear-gradient(135deg, #D4A853, #E8C97A)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontStyle: "italic",
                }}
              >
                or
              </span>
              when
            </span>
            {" "}© {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 sm:py-32 text-center">
      {/* Decorative compass */}
      <div
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-6"
        style={{
          background: "rgba(212, 168, 83, 0.06)",
          border: "1px solid rgba(212, 168, 83, 0.12)",
        }}
      >
        <svg
          className="w-8 h-8 sm:w-10 sm:h-10"
          style={{ color: "#D4A853", opacity: 0.5 }}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
          />
        </svg>
      </div>

      <h3
        className="text-xl sm:text-2xl font-bold mb-2"
        style={{ fontFamily: "'Playfair Display', serif", color: "#F5F0E8" }}
      >
        여행지를 선택해주세요
      </h3>
      <p className="text-sm max-w-xs" style={{ color: "#6B7280" }}>
        도시를 검색하면 12개월 최적 여행 시기를
        <br />
        종합 점수로 알려드립니다
      </p>

      {/* Decorative lines */}
      <div className="mt-8 flex items-center gap-2">
        <div className="h-px w-8" style={{ background: "rgba(212, 168, 83, 0.2)" }} />
        <div className="w-1 h-1 rotate-45" style={{ background: "rgba(212, 168, 83, 0.3)" }} />
        <div className="h-px w-8" style={{ background: "rgba(212, 168, 83, 0.2)" }} />
      </div>
    </div>
  );
}
