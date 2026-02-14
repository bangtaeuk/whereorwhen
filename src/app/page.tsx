"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { cities } from "@/data/cities";
import { getScoresForCity, getScoresForMonth } from "@/data/mock-scores";
import { generateHighlights } from "@/lib/highlights";
import type { AppMode, ScoreBreakdown } from "@/types";

/* ── Constants ────────────────────────────────────────────── */

const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const POPULAR_CITY_IDS = ["osaka", "tokyo", "danang", "bangkok", "paris", "bali", "guam", "cebu"];

const SUB_KEYS: (keyof Omit<ScoreBreakdown, "total">)[] = [
  "weather", "cost", "crowd", "buzz",
];

const SUB_LABELS: Record<string, string> = {
  weather: "날씨",
  cost: "비용",
  crowd: "혼잡도",
  buzz: "버즈",
};

const SUB_DESCRIPTIONS: Record<string, string> = {
  weather: "10년 평균 기상 데이터 기반 · 맑은 날 비율 + 쾌적 기온",
  cost: "365일 평균 환율 대비 현재 환율 · 저렴할수록 높은 점수",
  crowd: "한국·현지 공휴일 + 성수기 종합 · 한산할수록 높은 점수",
  buzz: "네이버 검색 트렌드 기반 · 인기 시즌일수록 높은 점수",
};

const NOW_MONTH = new Date().getMonth() + 1;

/* ── Score Utilities ──────────────────────────────────────── */

function scoreColor(v: number): string {
  if (v >= 8) return "#00C471";
  if (v >= 6) return "#3182F6";
  if (v >= 4) return "#F5A623";
  return "#E8554F";
}

function scoreGrade(v: number): string {
  if (v >= 8) return "최적";
  if (v >= 6) return "좋음";
  if (v >= 4) return "보통";
  return "비추";
}

function countryFlag(cc: string): string {
  return cc
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

/* ── Thin Score Bar ───────────────────────────────────────── */

function ScoreBar({
  label,
  value,
  animate,
}: {
  label: string;
  value: number;
  animate: boolean;
}) {
  const color = scoreColor(value);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span
        className="text-xs font-medium w-12 shrink-0"
        style={{ color: "#6B7684" }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "#F2F3F5" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: animate ? `${(value / 10) * 100}%` : "0%",
            backgroundColor: color,
          }}
        />
      </div>
      <span
        className="text-xs tabular-nums w-7 text-right shrink-0 font-bold"
        style={{ color }}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */

export default function V15Page() {
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(NOW_MONTH);
  const [expandedMonthKey, setExpandedMonthKey] = useState<number | null>(null);
  const [expandedRankCity, setExpandedRankCity] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchQuery((prev) => (selectedCityId ? prev : ""));
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selectedCityId]);

  /* Scroll active month into view */
  useEffect(() => {
    if (mode === "when-to-where" && monthScrollRef.current) {
      const active = monthScrollRef.current.querySelector("[data-active=\"true\"]");
      if (active) {
        active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [selectedMonth, mode]);

  /* Filtered cities for search dropdown */
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim() || selectedCityId) return [];
    const q = searchQuery.toLowerCase();
    return cities.filter(
      (c) =>
        c.nameKo.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.country.includes(q),
    );
  }, [searchQuery, selectedCityId]);

  /* Mode A: city → monthly scores */
  const cityScores = useMemo(() => {
    if (!selectedCityId) return [];
    return getScoresForCity(selectedCityId);
  }, [selectedCityId]);

  const bestMonth = useMemo(() => {
    if (cityScores.length === 0) return -1;
    return cityScores.reduce((b, c) =>
      c.scores.total > b.scores.total ? c : b,
    ).month;
  }, [cityScores]);

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId) ?? null,
    [selectedCityId],
  );

  /* Mode B: month → city rankings */
  const cityRankings = useMemo(() => {
    return getScoresForMonth(selectedMonth)
      .map((ms) => {
        const city = cities.find((c) => c.id === ms.cityId)!;
        const highlights = generateHighlights(ms.cityId, ms.month, ms.scores);
        return { ...ms, city, highlights };
      })
      .sort((a, b) => b.scores.total - a.scores.total);
  }, [selectedMonth]);

  /* Handlers */
  function handleSelectCity(cityId: string) {
    setSelectedCityId(cityId);
    const c = cities.find((ci) => ci.id === cityId);
    if (c) setSearchQuery(c.nameKo);
    setExpandedMonthKey(null);
  }

  function handleClearCity() {
    setSelectedCityId(null);
    setSearchQuery("");
    setExpandedMonthKey(null);
  }

  function handleModeSwitch(newMode: AppMode) {
    setMode(newMode);
    setSelectedCityId(null);
    setSearchQuery("");
    setExpandedMonthKey(null);
    setExpandedRankCity(null);
  }

  function handleMonthSelect(m: number) {
    setSelectedMonth(m);
    setExpandedRankCity(null);
  }

  function handleRankCityToCalendar(cityId: string) {
    setMode("where-to-when");
    handleSelectCity(cityId);
  }

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FFFFFF", color: "#1B1D1F" }}
    >
      {/* ── A. Sticky Header ─────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-sm border-b"
        style={{
          backgroundColor: "rgba(255,255,255,0.90)",
          borderColor: "#E8EBED",
          height: 56,
        }}
      >
        <div className="max-w-4xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <h1
            className="text-lg font-bold tracking-tight select-none"
            style={{ color: "#1B1D1F" }}
          >
            where<span style={{ color: "#ADB5BD" }}>or</span>when
          </h1>

          {/* Segmented Control */}
          <div
            className="flex rounded-full p-1"
            style={{ backgroundColor: "#F7F8FA" }}
          >
            <button
              onClick={() => handleModeSwitch("where-to-when")}
              className="px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200"
              style={
                mode === "where-to-when"
                  ? {
                      backgroundColor: "#FFFFFF",
                      color: "#1B1D1F",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
                    }
                  : { backgroundColor: "transparent", color: "#ADB5BD" }
              }
            >
              도시 → 시기
            </button>
            <button
              onClick={() => handleModeSwitch("when-to-where")}
              className="px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200"
              style={
                mode === "when-to-where"
                  ? {
                      backgroundColor: "#FFFFFF",
                      color: "#1B1D1F",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
                    }
                  : { backgroundColor: "transparent", color: "#ADB5BD" }
              }
            >
              시기 → 도시
            </button>
          </div>
        </div>
      </header>

      {/* ── B. Hero Section ──────────────────────────────── */}
      <section
        className="py-8 sm:py-10 text-center"
        style={{ backgroundColor: "#F7F8FA" }}
      >
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{ color: "#1B1D1F" }}
        >
          언제 떠나면 좋을까?
        </h2>
        <p
          className="mt-2 text-sm"
          style={{ color: "#6B7684" }}
        >
          날씨, 환율, 혼잡도, 인기도를 종합 분석해 알려드려요
        </p>
      </section>

      {/* ── C + D. Input & Results ────────────────────────── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {mode === "where-to-when" ? (
          /* ═══ Mode A: 도시 → 시기 ═══ */
          <ModeAContent
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredCities={filteredCities}
            selectedCityId={selectedCityId}
            selectedCity={selectedCity}
            cityScores={cityScores}
            bestMonth={bestMonth}
            expandedMonthKey={expandedMonthKey}
            setExpandedMonthKey={setExpandedMonthKey}
            onSelectCity={handleSelectCity}
            onClearCity={handleClearCity}
            dropdownRef={dropdownRef}
          />
        ) : (
          /* ═══ Mode B: 시기 → 도시 ═══ */
          <ModeBContent
            selectedMonth={selectedMonth}
            onMonthSelect={handleMonthSelect}
            cityRankings={cityRankings}
            expandedRankCity={expandedRankCity}
            setExpandedRankCity={setExpandedRankCity}
            onCityToCalendar={handleRankCityToCalendar}
            monthScrollRef={monthScrollRef}
          />
        )}
      </main>

      {/* ── Data Sources ──────────────────────────────────── */}
      <section
        className="max-w-4xl mx-auto px-4 py-6 mt-8 rounded-2xl"
        style={{ backgroundColor: "#F7F8FA" }}
      >
        <p className="text-xs font-bold mb-3" style={{ color: "#6B7684" }}>
          점수 산출 기준
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SUB_KEYS.map((key) => (
            <div key={key}>
              <p className="text-xs font-bold" style={{ color: "#1B1D1F" }}>
                {SUB_LABELS[key]}
              </p>
              <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: "#6B7684" }}>
                {SUB_DESCRIPTIONS[key]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── E. Footer ────────────────────────────────────── */}
      <footer
        className="border-t py-6 text-center mt-4"
        style={{ borderColor: "#E8EBED" }}
      >
        <p className="text-xs" style={{ color: "#ADB5BD" }}>
          날씨 · 환율 · 혼잡도 · 버즈 — 4가지 데이터를 하나의 점수로
        </p>
        <p className="mt-1" style={{ fontSize: 10, color: "#ADB5BD" }}>
          whereorwhen © 2026
        </p>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Mode A: 도시 → 시기 (Calendar View)
   ═══════════════════════════════════════════════════════════════ */

function ModeAContent({
  searchQuery,
  setSearchQuery,
  filteredCities,
  selectedCityId,
  selectedCity,
  cityScores,
  bestMonth,
  expandedMonthKey,
  setExpandedMonthKey,
  onSelectCity,
  onClearCity,
  dropdownRef,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredCities: typeof cities;
  selectedCityId: string | null;
  selectedCity: (typeof cities)[number] | null;
  cityScores: ReturnType<typeof getScoresForCity>;
  bestMonth: number;
  expandedMonthKey: number | null;
  setExpandedMonthKey: (v: number | null) => void;
  onSelectCity: (id: string) => void;
  onClearCity: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div>
      {/* Search Input */}
      <div ref={dropdownRef} className="relative">
        <div
          className="relative flex items-center h-12 rounded-2xl px-4 gap-3"
          style={{
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          }}
        >
          {/* Search icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ADB5BD"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (selectedCityId) {
                onClearCity();
                setSearchQuery(e.target.value);
              }
            }}
            placeholder="어디로 떠나고 싶으세요?"
            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[#ADB5BD]"
            style={{ color: "#1B1D1F" }}
          />
          {searchQuery && (
            <button
              onClick={onClearCity}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-colors active:scale-95"
              style={{ backgroundColor: "#E8EBED" }}
            >
              <span className="text-[10px]" style={{ color: "#6B7684" }}>
                ✕
              </span>
            </button>
          )}
        </div>

        {/* Dropdown */}
        {filteredCities.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full mt-2 rounded-2xl overflow-hidden z-40"
            style={{
              backgroundColor: "#FFFFFF",
              boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
            }}
          >
            {filteredCities.map((city, idx) => (
              <button
                key={city.id}
                onClick={() => onSelectCity(city.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{
                  borderBottom:
                    idx < filteredCities.length - 1
                      ? "1px solid #E8EBED"
                      : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#F7F8FA")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <span className="text-lg">{countryFlag(city.countryCode)}</span>
                <span className="text-sm font-semibold" style={{ color: "#1B1D1F" }}>
                  {city.nameKo}
                </span>
                <span className="text-xs" style={{ color: "#6B7684" }}>
                  {city.nameEn}
                </span>
                <span className="ml-auto text-xs" style={{ color: "#ADB5BD" }}>
                  {city.country}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular Chips + Empty State (no city selected) */}
      {!selectedCityId && !searchQuery && (
        <>
          <p
            className="mt-5 mb-3 text-xs font-semibold tracking-wide"
            style={{ color: "#6B7684" }}
          >
            인기 여행지
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {POPULAR_CITY_IDS.map((cid) => {
              const city = cities.find((c) => c.id === cid);
              if (!city) return null;
              return (
                <button
                  key={city.id}
                  onClick={() => onSelectCity(city.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95"
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "#1B1D1F",
                    boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <span className="text-base">{countryFlag(city.countryCode)}</span>
                  {city.nameKo}
                </button>
              );
            })}
          </div>

          {/* Empty State */}
          <div className="mt-12 flex flex-col items-center text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
              style={{ backgroundColor: "#F7F8FA" }}
            >
              <span className="text-3xl">✈️</span>
            </div>
            <p className="text-base font-semibold" style={{ color: "#1B1D1F" }}>
              여행지를 검색해보세요
            </p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "#6B7684" }}>
              도시를 선택하면 월별 최적 시기를
              <br />
              한눈에 확인할 수 있어요
            </p>
          </div>
        </>
      )}

      {/* Calendar Grid + Inline Detail (city selected) */}
      {selectedCityId && selectedCity && cityScores.length > 0 && (
        <CalendarView
          selectedCity={selectedCity}
          cityScores={cityScores}
          bestMonth={bestMonth}
          expandedMonthKey={expandedMonthKey}
          setExpandedMonthKey={setExpandedMonthKey}
          onClearCity={onClearCity}
        />
      )}
    </div>
  );
}

/* ── Calendar View ────────────────────────────────────────── */

function CalendarView({
  selectedCity,
  cityScores,
  bestMonth,
  expandedMonthKey,
  setExpandedMonthKey,
  onClearCity,
}: {
  selectedCity: (typeof cities)[number];
  cityScores: ReturnType<typeof getScoresForCity>;
  bestMonth: number;
  expandedMonthKey: number | null;
  setExpandedMonthKey: (v: number | null) => void;
  onClearCity: () => void;
}) {
  return (
    <div>
      {/* City Header */}
      <div className="mt-5 flex items-center gap-3">
        <span className="text-2xl">{countryFlag(selectedCity.countryCode)}</span>
        <div className="flex-1 min-w-0">
          <span className="text-base font-bold" style={{ color: "#1B1D1F" }}>
            {selectedCity.nameKo}
          </span>
          <span className="ml-2 text-xs" style={{ color: "#6B7684" }}>
            {selectedCity.nameEn}, {selectedCity.country}
          </span>
        </div>
        <button
          onClick={onClearCity}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-95"
          style={{ backgroundColor: "#F7F8FA" }}
        >
          <span className="text-xs" style={{ color: "#6B7684" }}>✕</span>
        </button>
      </div>

      {/* Calendar Grid (chronological 1-12) — grid is STABLE, never shifts */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cityScores.map((ms) => {
          const v = ms.scores.total;
          const color = scoreColor(v);
          const isBest = ms.month === bestMonth;
          const isCurrent = ms.month === NOW_MONTH;
          const isSelected = expandedMonthKey === ms.month;

          return (
            <button
              key={ms.month}
              onClick={() =>
                setExpandedMonthKey(isSelected ? null : ms.month)
              }
              className={`relative rounded-2xl p-4 text-left transition-all duration-200 active:scale-95${isSelected ? " ring-2 ring-[#1B1D1F] z-10" : ""}`}
              style={{
                backgroundColor: "#FFFFFF",
                borderTop: `3px solid ${color}`,
                borderLeft: `1px ${isCurrent && !isSelected ? "dashed" : "solid"} ${isCurrent && !isSelected ? "#1B1D1F" : "transparent"}`,
                borderRight: `1px ${isCurrent && !isSelected ? "dashed" : "solid"} ${isCurrent && !isSelected ? "#1B1D1F" : "transparent"}`,
                borderBottom: `1px ${isCurrent && !isSelected ? "dashed" : "solid"} ${isCurrent && !isSelected ? "#1B1D1F" : "transparent"}`,
                boxShadow: isSelected
                  ? "0 4px 16px rgba(0,0,0,0.10)"
                  : "0 1px 8px rgba(0,0,0,0.06)",
                transform: isSelected ? "scale(1.02) translateY(-2px)" : "translateY(0)",
              }}
            >
              {/* BEST badge */}
              {isBest && (
                <span
                  className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "#1B1D1F",
                    color: "#FFFFFF",
                  }}
                >
                  BEST
                </span>
              )}

              {/* Month label */}
              <p className="text-xs" style={{ color: "#6B7684" }}>
                {MONTH_LABELS[ms.month - 1]}
              </p>

              {/* Score */}
              <p
                className="mt-1 text-2xl font-bold tabular-nums leading-none"
                style={{ color }}
              >
                {v.toFixed(1)}
              </p>

              {/* Grade */}
              <div className="mt-1.5 flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium" style={{ fontSize: 10, color }}>
                  {scoreGrade(v)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel — BELOW grid, grid never shifts */}
      {expandedMonthKey !== null && (() => {
        const ms = cityScores.find((s) => s.month === expandedMonthKey);
        if (!ms) return null;
        const color = scoreColor(ms.scores.total);
        return (
          <div className="mt-3">
            <CalendarDetailPanel
              city={selectedCity}
              month={ms.month}
              scores={ms.scores}
              highlights={generateHighlights(ms.cityId, ms.month, ms.scores)}
              color={color}
              onClose={() => setExpandedMonthKey(null)}
            />
          </div>
        );
      })()}
    </div>
  );
}

/* ── Calendar Detail Panel ────────────────────────────────── */

function CalendarDetailPanel({
  city,
  month,
  scores,
  highlights,
  color,
  onClose,
}: {
  city: (typeof cities)[number];
  month: number;
  scores: ScoreBreakdown;
  highlights: string[];
  color: string;
  onClose: () => void;
}) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="rounded-2xl p-5 border-l-4"
      style={{
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        borderLeftColor: color,
      }}
    >
      {/* Header — city info + highlights inline + score + close */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: "#1B1D1F" }}>
            {city.nameKo} · {MONTH_LABELS[month - 1]}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: "#6B7684" }}>
              {city.nameEn}
            </span>
            {highlights.map((h, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#F7F8FA", color: "#6B7684" }}
              >
                {h}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span
              className="text-3xl font-bold tabular-nums"
              style={{ color }}
            >
              {scores.total.toFixed(1)}
            </span>
            <p className="text-xs font-medium" style={{ color }}>
              {scoreGrade(scores.total)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95"
            style={{ backgroundColor: "#F7F8FA" }}
          >
            <span className="text-sm" style={{ color: "#6B7684" }}>✕</span>
          </button>
        </div>
      </div>

      {/* Thin separator */}
      <div className="my-3" style={{ height: 1, backgroundColor: "#E8EBED" }} />

      {/* Score bars */}
      <div>
        {SUB_KEYS.map((key) => (
          <ScoreBar
            key={key}
            label={SUB_LABELS[key]}
            value={scores[key]}
            animate={animate}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Mode B: 시기 → 도시 (3-Tier Ranking)
   ═══════════════════════════════════════════════════════════════ */

function ModeBContent({
  selectedMonth,
  onMonthSelect,
  cityRankings,
  expandedRankCity,
  setExpandedRankCity,
  onCityToCalendar,
  monthScrollRef,
}: {
  selectedMonth: number;
  onMonthSelect: (m: number) => void;
  cityRankings: {
    cityId: string;
    month: number;
    scores: ScoreBreakdown;
    city: (typeof cities)[number];
    highlights: string[];
  }[];
  expandedRankCity: string | null;
  setExpandedRankCity: (v: string | null) => void;
  onCityToCalendar: (id: string) => void;
  monthScrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const top3 = cityRankings.slice(0, 3);
  const mid = cityRankings.slice(3, 10);
  const rest = cityRankings.slice(10);

  return (
    <div>
      {/* Month Selector — horizontal scrollable pills */}
      <div
        ref={monthScrollRef}
        className="flex gap-2 overflow-x-auto pb-3"
        style={{ scrollbarWidth: "none" }}
      >
        {MONTH_LABELS.map((label, i) => {
          const m = i + 1;
          const isActive = selectedMonth === m;
          const isCurrent = m === NOW_MONTH;
          return (
            <button
              key={m}
              data-active={isActive ? "true" : "false"}
              onClick={() => onMonthSelect(m)}
              className="relative flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95"
              style={
                isActive
                  ? {
                      backgroundColor: "#1B1D1F",
                      color: "#FFFFFF",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }
                  : {
                      backgroundColor: "#FFFFFF",
                      color: "#1B1D1F",
                      boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                    }
              }
            >
              {label}
              {isCurrent && !isActive && (
                <span
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#00C471" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Section Title */}
      <div className="mt-6 mb-5">
        <h3
          className="text-xl font-bold"
          style={{ color: "#1B1D1F" }}
        >
          {MONTH_LABELS[selectedMonth - 1]} 여행지 추천
        </h3>
        <p className="text-xs mt-1" style={{ color: "#6B7684" }}>
          20개 도시 종합 순위
        </p>
      </div>

      {/* ── Top 3 Hero Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {top3.map((item, idx) => {
          const medals = ["🥇", "🥈", "🥉"];
          const color = scoreColor(item.scores.total);
          const hasGlow = item.scores.total >= 8;

          return (
            <div
              key={item.cityId}
              className="rounded-2xl p-4 transition-all duration-200"
              style={{
                backgroundColor: "#FFFFFF",
                borderLeft: `4px solid ${color}`,
                boxShadow: hasGlow
                  ? "0 1px 8px rgba(0,0,0,0.06), 0 0 16px rgba(0,196,113,0.12)"
                  : "0 1px 8px rgba(0,0,0,0.06)",
              }}
            >
              {/* Medal + Score */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-xl">{medals[idx]}</span>
                <div className="text-right">
                  <span
                    className="text-2xl font-bold tabular-nums"
                    style={{ color }}
                  >
                    {item.scores.total.toFixed(1)}
                  </span>
                  <p className="text-[10px] font-medium" style={{ color }}>
                    {scoreGrade(item.scores.total)}
                  </p>
                </div>
              </div>

              {/* City info */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{countryFlag(item.city.countryCode)}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#1B1D1F" }}>
                    {item.city.nameKo}
                  </p>
                  <p className="text-[11px]" style={{ color: "#6B7684" }}>
                    {item.city.nameEn}, {item.city.country}
                  </p>
                </div>
              </div>

              {/* Sub-score bars */}
              <TopCardScoreBars scores={item.scores} />

              {/* Highlights */}
              {item.highlights.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: "#F7F8FA", color: "#6B7684" }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA to calendar */}
              <button
                onClick={() => onCityToCalendar(item.cityId)}
                className="mt-3 w-full text-xs font-medium py-2 rounded-xl transition-colors active:scale-95"
                style={{
                  backgroundColor: "#F7F8FA",
                  color: "#1B1D1F",
                }}
              >
                월별 상세 보기 →
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Ranks 4-10 Compact Cards ─────────────────── */}
      {mid.length > 0 && (
        <div className="space-y-2 mb-4">
          {mid.map((item, idx) => {
            const rank = idx + 4;
            const color = scoreColor(item.scores.total);
            const isExpanded = expandedRankCity === item.cityId;

            return (
              <div key={item.cityId}>
                <button
                  onClick={() =>
                    setExpandedRankCity(isExpanded ? null : item.cityId)
                  }
                  className="w-full rounded-2xl p-3 text-left transition-all duration-200 active:scale-[0.98]"
                  style={{
                    backgroundColor: isExpanded ? "#F7F8FA" : "#FFFFFF",
                    boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <span
                      className="text-xs font-bold w-6 text-center tabular-nums"
                      style={{ color: "#ADB5BD" }}
                    >
                      {rank}
                    </span>
                    {/* Flag */}
                    <span className="text-lg">{countryFlag(item.city.countryCode)}</span>
                    {/* City */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold" style={{ color: "#1B1D1F" }}>
                          {item.city.nameKo}
                        </span>
                        <span className="text-[11px]" style={{ color: "#ADB5BD" }}>
                          {item.city.nameEn}
                        </span>
                      </div>
                      {item.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {item.highlights.slice(0, 2).map((h, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: "#F7F8FA", color: "#6B7684" }}
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Score badge */}
                    <span
                      className="text-base font-bold tabular-nums shrink-0"
                      style={{ color }}
                    >
                      {item.scores.total.toFixed(1)}
                    </span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <MidRankExpandedDetail
                    item={item}
                    onCityToCalendar={onCityToCalendar}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Ranks 11-20 Minimal List ─────────────────── */}
      {rest.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid #E8EBED" }}
        >
          {rest.map((item, idx) => {
            const rank = idx + 11;
            const color = scoreColor(item.scores.total);
            const isEven = idx % 2 === 0;

            return (
              <div
                key={item.cityId}
                className="flex items-center gap-3 px-4 py-2.5"
                style={{
                  backgroundColor: isEven ? "#FFFFFF" : "#F7F8FA",
                  borderBottom:
                    idx < rest.length - 1 ? "1px solid #E8EBED" : "none",
                }}
              >
                <span
                  className="text-xs w-6 text-center tabular-nums"
                  style={{ color: "#ADB5BD" }}
                >
                  {rank}
                </span>
                <span className="text-base">{countryFlag(item.city.countryCode)}</span>
                <span className="flex-1 text-sm" style={{ color: "#1B1D1F" }}>
                  {item.city.nameKo}
                </span>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color }}
                >
                  {item.scores.total.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Top 3 Card Score Bars ────────────────────────────────── */

function TopCardScoreBars({ scores }: { scores: ScoreBreakdown }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-0.5">
      {SUB_KEYS.map((key) => (
        <ScoreBar
          key={key}
          label={SUB_LABELS[key]}
          value={scores[key]}
          animate={animate}
        />
      ))}
    </div>
  );
}

/* ── Mid-Rank Expanded Detail ─────────────────────────────── */

function MidRankExpandedDetail({
  item,
  onCityToCalendar,
}: {
  item: {
    cityId: string;
    month: number;
    scores: ScoreBreakdown;
    city: (typeof cities)[number];
    highlights: string[];
  };
  onCityToCalendar: (id: string) => void;
}) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="mx-3 mt-1 mb-2 px-4 py-3 rounded-xl transition-all duration-300"
      style={{ backgroundColor: "#F7F8FA" }}
    >
      <div className="space-y-0.5 pl-6">
        {SUB_KEYS.map((key) => (
          <ScoreBar
            key={key}
            label={SUB_LABELS[key]}
            value={item.scores[key]}
            animate={animate}
          
          />
        ))}
      </div>
      <div className="pl-6 mt-3">
        <button
          onClick={() => onCityToCalendar(item.cityId)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors active:scale-95"
          style={{
            backgroundColor: "#FFFFFF",
            color: "#1B1D1F",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          월별 상세 보기 →
        </button>
      </div>
    </div>
  );
}
