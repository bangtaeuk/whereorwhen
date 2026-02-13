"use client";
import { useState, useMemo } from "react";
import { cities } from "@/data/cities";
import { getScoresForCity, getScoresForMonth } from "@/data/mock-scores";
import { generateHighlights } from "@/lib/highlights";
import type { AppMode, ScoreBreakdown } from "@/types";

/* ── 상수 ─────────────────────────────────────────── */
const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const POPULAR_CITIES = ["osaka", "tokyo", "danang", "bangkok", "paris", "bali"];

const SCORE_LABELS: Record<string, string> = {
  weather: "날씨",
  cost: "비용",
  crowd: "혼잡도",
  buzz: "버즈",
};

/* ── 점수 색상 유틸 ─────────────────────────────────── */
function scoreColor(score: number): string {
  if (score >= 8) return "#34C759";
  if (score >= 6) return "#007AFF";
  if (score >= 4) return "#FF9F0A";
  return "#FF3B30";
}

function scoreBg(score: number): string {
  if (score >= 8) return "rgba(52,199,89,0.10)";
  if (score >= 6) return "rgba(0,122,255,0.10)";
  if (score >= 4) return "rgba(255,159,10,0.10)";
  return "rgba(255,59,48,0.10)";
}

function scoreGrade(score: number): string {
  if (score >= 8) return "최적";
  if (score >= 6) return "좋음";
  if (score >= 4) return "보통";
  return "비추";
}

/* ── 국기 이모지 ─────────────────────────────────────── */
function countryFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

/* ── 메인 컴포넌트 ──────────────────────────────────── */
export default function V7Page() {
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCity, setExpandedCity] = useState<string>("");

  /* 도시 검색 필터 */
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return cities.filter(
      (c) =>
        c.nameKo.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.country.includes(q)
    );
  }, [searchQuery]);

  /* 도시 → 월별 점수 (where-to-when) */
  const monthlyScores = useMemo(() => {
    if (!selectedCity) return [];
    return getScoresForCity(selectedCity);
  }, [selectedCity]);

  const bestMonth = useMemo(() => {
    if (monthlyScores.length === 0) return 0;
    return monthlyScores.reduce((best, cur) =>
      cur.scores.total > best.scores.total ? cur : best
    ).month;
  }, [monthlyScores]);

  /* 월 → 도시별 점수 (when-to-where) */
  const cityRankings = useMemo(() => {
    if (!selectedMonth) return [];
    return getScoresForMonth(selectedMonth).sort(
      (a, b) => b.scores.total - a.scores.total
    );
  }, [selectedMonth]);

  /* 선택된 도시 정보 */
  const selectedCityData = useMemo(
    () => cities.find((c) => c.id === selectedCity),
    [selectedCity]
  );

  /* 도시 선택 핸들러 */
  function handleCitySelect(cityId: string) {
    setSelectedCity(cityId);
    setSearchQuery("");
    setExpandedCity("");
  }

  /* 월 선택 핸들러 */
  function handleMonthSelect(month: number) {
    setSelectedMonth(month);
    setExpandedCity("");
  }

  /* 모드 전환 핸들러 */
  function handleModeSwitch(newMode: AppMode) {
    setMode(newMode);
    setSelectedCity("");
    setSelectedMonth(0);
    setSearchQuery("");
    setExpandedCity("");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F5F7" }}>
      {/* ── Header (Frosted Glass) ───────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{
          backgroundColor: "rgba(255,255,255,0.80)",
          borderColor: "#E5E5EA",
        }}
      >
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1
            className="text-center text-lg font-bold tracking-tight"
            style={{ color: "#1D1D1F" }}
          >
            where<span style={{ color: "#007AFF" }}>or</span>when
          </h1>

          {/* Mode Segmented Control */}
          <div
            className="mt-3 flex rounded-full p-1 mx-auto max-w-xs"
            style={{ backgroundColor: "#E5E5EA" }}
          >
            <button
              onClick={() => handleModeSwitch("where-to-when")}
              className="flex-1 py-2 text-sm font-semibold rounded-full transition-all duration-200"
              style={
                mode === "where-to-when"
                  ? {
                      backgroundColor: "#FFFFFF",
                      color: "#1D1D1F",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                    }
                  : { backgroundColor: "transparent", color: "#86868B" }
              }
            >
              도시 → 시기
            </button>
            <button
              onClick={() => handleModeSwitch("when-to-where")}
              className="flex-1 py-2 text-sm font-semibold rounded-full transition-all duration-200"
              style={
                mode === "when-to-where"
                  ? {
                      backgroundColor: "#FFFFFF",
                      color: "#1D1D1F",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                    }
                  : { backgroundColor: "transparent", color: "#86868B" }
              }
            >
              시기 → 도시
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────── */}
      <main className="max-w-lg mx-auto px-4 pb-12 pt-4">
        {mode === "where-to-when" ? (
          /* ═══ 도시 → 시기 모드 ═══ */
          <>
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value) setSelectedCity("");
                }}
                placeholder="어디로 떠나고 싶으세요?"
                className="w-full rounded-2xl px-5 text-base font-medium outline-none placeholder:text-[#86868B] transition-shadow focus:shadow-lg"
                style={{
                  height: 48,
                  backgroundColor: "#FFFFFF",
                  color: "#1D1D1F",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCity("");
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#E5E5EA" }}
                >
                  <span className="text-xs" style={{ color: "#86868B" }}>
                    ✕
                  </span>
                </button>
              )}
            </div>

            {/* Search Dropdown */}
            {searchQuery && filteredCities.length > 0 && !selectedCity && (
              <div
                className="mt-2 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
                }}
              >
                {filteredCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[#F5F5F7]"
                    style={{ borderBottom: "1px solid #E5E5EA" }}
                  >
                    <span className="text-xl">{countryFlag(city.countryCode)}</span>
                    <div>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "#1D1D1F" }}
                      >
                        {city.nameKo}
                      </span>
                      <span
                        className="ml-2 text-xs"
                        style={{ color: "#86868B" }}
                      >
                        {city.nameEn}, {city.country}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Cities (no selection) */}
            {!selectedCity && !searchQuery && (
              <>
                <p
                  className="mt-5 mb-3 text-xs font-semibold tracking-wide"
                  style={{ color: "#86868B" }}
                >
                  인기 여행지
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {POPULAR_CITIES.map((cid) => {
                    const city = cities.find((c) => c.id === cid);
                    if (!city) return null;
                    return (
                      <button
                        key={city.id}
                        onClick={() => handleCitySelect(city.id)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95"
                        style={{
                          backgroundColor: "#FFFFFF",
                          color: "#1D1D1F",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                      >
                        <span className="text-base">{countryFlag(city.countryCode)}</span>
                        {city.nameKo}
                      </button>
                    );
                  })}
                </div>

                {/* Empty State */}
                <div className="mt-10 flex flex-col items-center text-center">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                    style={{ backgroundColor: "#E5E5EA" }}
                  >
                    <span className="text-3xl">✈️</span>
                  </div>
                  <p
                    className="text-base font-semibold"
                    style={{ color: "#1D1D1F" }}
                  >
                    여행지를 검색해보세요
                  </p>
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ color: "#86868B" }}
                  >
                    도시를 선택하면 월별 최적 시기를
                    <br />
                    한눈에 확인할 수 있어요
                  </p>
                </div>
              </>
            )}

            {/* ── Calendar Grid (city selected) ────────── */}
            {selectedCity && selectedCityData && (
              <>
                {/* Selected City Chip */}
                <div className="mt-4 flex items-center gap-2">
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: "#FFFFFF",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  >
                    <span className="text-lg">
                      {countryFlag(selectedCityData.countryCode)}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: "#1D1D1F" }}
                    >
                      {selectedCityData.nameKo}
                    </span>
                    <span className="text-xs" style={{ color: "#86868B" }}>
                      {selectedCityData.country}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCity("");
                      setSearchQuery("");
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: "#E5E5EA" }}
                  >
                    <span className="text-xs" style={{ color: "#86868B" }}>
                      ✕
                    </span>
                  </button>
                </div>

                {/* 3x4 Calendar Grid */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {monthlyScores.map((ms) => {
                    const isBest = ms.month === bestMonth;
                    const isSelected = ms.month === expandedCity as unknown as number;
                    const color = scoreColor(ms.scores.total);

                    return (
                      <button
                        key={ms.month}
                        onClick={() =>
                          setExpandedCity(
                            expandedCity === String(ms.month)
                              ? ""
                              : String(ms.month)
                          )
                        }
                        className="relative rounded-2xl p-3 text-left transition-all duration-200 active:scale-95"
                        style={{
                          backgroundColor: "#FFFFFF",
                          borderTop: `4px solid ${color}`,
                          boxShadow:
                            expandedCity === String(ms.month)
                              ? `0 4px 20px rgba(0,0,0,0.12), 0 0 0 2px ${color}40`
                              : "0 2px 12px rgba(0,0,0,0.06)",
                          transform:
                            expandedCity === String(ms.month)
                              ? "scale(1.03)"
                              : "scale(1)",
                        }}
                      >
                        {/* Best month badge */}
                        {isBest && (
                          <span className="absolute -top-1 -right-1 text-sm">
                            ⭐
                          </span>
                        )}

                        {/* Month label */}
                        <p
                          className="text-xs font-semibold"
                          style={{ color: "#86868B" }}
                        >
                          {MONTH_LABELS[ms.month - 1]}
                        </p>

                        {/* Large score */}
                        <p
                          className="mt-1 text-2xl font-extrabold tracking-tight"
                          style={{ color }}
                        >
                          {ms.scores.total.toFixed(1)}
                        </p>

                        {/* Grade */}
                        <div className="mt-1 flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span
                            className="text-[10px] font-semibold"
                            style={{ color }}
                          >
                            {scoreGrade(ms.scores.total)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* ── Detail Panel (expanded month) ──────── */}
                {expandedCity && (
                  <DetailPanel
                    cityId={selectedCity}
                    month={Number(expandedCity)}
                    scores={
                      monthlyScores.find(
                        (ms) => ms.month === Number(expandedCity)
                      )!.scores
                    }
                  />
                )}
              </>
            )}
          </>
        ) : (
          /* ═══ 시기 → 도시 모드 ═══ */
          <>
            {/* Month Selector (horizontal scroll) */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {MONTH_LABELS.map((label, i) => {
                const month = i + 1;
                const isActive = selectedMonth === month;
                return (
                  <button
                    key={month}
                    onClick={() => handleMonthSelect(month)}
                    className="flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95"
                    style={
                      isActive
                        ? {
                            backgroundColor: "#1D1D1F",
                            color: "#FFFFFF",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          }
                        : {
                            backgroundColor: "#FFFFFF",
                            color: "#1D1D1F",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                          }
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Empty state */}
            {!selectedMonth && (
              <div className="mt-10 flex flex-col items-center text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                  style={{ backgroundColor: "#E5E5EA" }}
                >
                  <span className="text-3xl">📅</span>
                </div>
                <p
                  className="text-base font-semibold"
                  style={{ color: "#1D1D1F" }}
                >
                  여행 시기를 선택해보세요
                </p>
                <p
                  className="mt-1 text-sm leading-relaxed"
                  style={{ color: "#86868B" }}
                >
                  월을 선택하면 해당 시기에
                  <br />
                  최적인 여행지를 추천해드려요
                </p>
              </div>
            )}

            {/* City Rankings */}
            {selectedMonth > 0 && (
              <div className="mt-4 space-y-3">
                {cityRankings.map((ms, idx) => {
                  const city = cities.find((c) => c.id === ms.cityId);
                  if (!city) return null;
                  const isTop3 = idx < 3;
                  const color = scoreColor(ms.scores.total);
                  const isExpanded = expandedCity === ms.cityId;

                  return (
                    <div key={ms.cityId}>
                      <button
                        onClick={() =>
                          setExpandedCity(isExpanded ? "" : ms.cityId)
                        }
                        className="w-full rounded-2xl transition-all duration-200 active:scale-[0.98]"
                        style={{
                          backgroundColor: "#FFFFFF",
                          boxShadow: isExpanded
                            ? "0 4px 20px rgba(0,0,0,0.10)"
                            : "0 2px 12px rgba(0,0,0,0.06)",
                          padding: isTop3 ? "16px 20px" : "12px 20px",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Rank badge */}
                            <span
                              className="text-xs font-bold flex-shrink-0 w-5 text-center"
                              style={{
                                color: isTop3 ? color : "#86868B",
                              }}
                            >
                              {idx + 1}
                            </span>
                            {/* Flag */}
                            <span className={isTop3 ? "text-2xl" : "text-lg"}>
                              {countryFlag(city.countryCode)}
                            </span>
                            {/* City info */}
                            <div className="text-left">
                              <p
                                className={`font-bold ${isTop3 ? "text-base" : "text-sm"}`}
                                style={{ color: "#1D1D1F" }}
                              >
                                {city.nameKo}
                              </p>
                              <p className="text-xs" style={{ color: "#86868B" }}>
                                {city.nameEn}, {city.country}
                              </p>
                            </div>
                          </div>

                          {/* Score circle */}
                          <div
                            className={`flex-shrink-0 rounded-full flex items-center justify-center font-extrabold ${
                              isTop3
                                ? "w-12 h-12 text-base"
                                : "w-9 h-9 text-sm"
                            }`}
                            style={{
                              backgroundColor: scoreBg(ms.scores.total),
                              color: color,
                            }}
                          >
                            {ms.scores.total.toFixed(1)}
                          </div>
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div
                          className="mt-1 overflow-hidden transition-all duration-300"
                          style={{ maxHeight: isExpanded ? 400 : 0 }}
                        >
                          <DetailPanel
                            cityId={ms.cityId}
                            month={selectedMonth}
                            scores={ms.scores}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ── DetailPanel 컴포넌트 ─────────────────────────────── */
function DetailPanel({
  cityId,
  month,
  scores,
}: {
  cityId: string;
  month: number;
  scores: ScoreBreakdown;
}) {
  const highlights = generateHighlights(cityId, month, scores);
  const color = scoreColor(scores.total);
  const categories: (keyof typeof SCORE_LABELS)[] = [
    "weather",
    "cost",
    "crowd",
    "buzz",
  ];

  return (
    <div
      className="mt-3 rounded-2xl p-5"
      style={{
        backgroundColor: "#FFFFFF",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Top row: circular score + grade */}
      <div className="flex items-center gap-4">
        {/* Circular score indicator */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            border: `4px solid ${color}`,
            backgroundColor: scoreBg(scores.total),
          }}
        >
          <span
            className="text-xl font-extrabold"
            style={{ color }}
          >
            {scores.total.toFixed(1)}
          </span>
        </div>
        <div>
          <p className="text-base font-bold" style={{ color: "#1D1D1F" }}>
            {MONTH_LABELS[month - 1]} 종합 점수
          </p>
          <p className="text-sm font-semibold" style={{ color }}>
            {scoreGrade(scores.total)}
          </p>
        </div>
      </div>

      {/* Score bars */}
      <div className="mt-4 space-y-3">
        {categories.map((key) => {
          const val = scores[key as keyof ScoreBreakdown];
          const barColor = scoreColor(val);
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#86868B" }}
                >
                  {SCORE_LABELS[key]}
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: barColor }}
                >
                  {val.toFixed(1)}
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "#F5F5F7" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(val / 10) * 100}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {highlights.map((h, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: scoreBg(scores.total),
                color: scoreColor(scores.total),
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: scoreColor(scores.total) }}
              />
              {h}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
