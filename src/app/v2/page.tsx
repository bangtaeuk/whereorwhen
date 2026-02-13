"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { cities } from "@/data/cities";
import { getScoresForCity, getScoresForMonth } from "@/data/mock-scores";
import { generateHighlights } from "@/lib/highlights";
import type { AppMode, ScoreBreakdown } from "@/types";

/* ─── Constants ───────────────────────────────────────────────────────────────── */

const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const MONTH_LABELS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const SCORE_LABELS: Record<string, string> = {
  weather: "날씨",
  cost: "비용",
  crowd: "혼잡도",
  buzz: "버즈",
};

const SCORE_ICONS: Record<string, string> = {
  weather: "☀️",
  cost: "💰",
  crowd: "👥",
  buzz: "📱",
};

/* ─── Score color helpers ─────────────────────────────────────────────────────── */

function getScoreColor(score: number): string {
  if (score >= 8.0) return "#5B8C5A";
  if (score >= 6.0) return "#C49B37";
  if (score >= 4.0) return "#C4704B";
  return "#8B6B7B";
}

function getScoreBg(score: number): string {
  if (score >= 8.0) return "rgba(91,140,90,0.10)";
  if (score >= 6.0) return "rgba(196,155,55,0.10)";
  if (score >= 4.0) return "rgba(196,112,75,0.10)";
  return "rgba(139,107,123,0.10)";
}

function getScoreGradient(score: number): string {
  if (score >= 8.0) return "linear-gradient(135deg, rgba(91,140,90,0.18) 0%, rgba(91,140,90,0.04) 100%)";
  if (score >= 6.0) return "linear-gradient(135deg, rgba(196,155,55,0.18) 0%, rgba(196,155,55,0.04) 100%)";
  if (score >= 4.0) return "linear-gradient(135deg, rgba(196,112,75,0.18) 0%, rgba(196,112,75,0.04) 100%)";
  return "linear-gradient(135deg, rgba(139,107,123,0.18) 0%, rgba(139,107,123,0.04) 100%)";
}

function getScoreLabel(score: number): string {
  if (score >= 8.0) return "최적";
  if (score >= 6.0) return "좋음";
  if (score >= 4.0) return "보통";
  return "비추";
}

function getFlag(countryCode: string): string {
  return String.fromCodePoint(
    ...countryCode
      .toUpperCase()
      .split("")
      .map((c) => 127397 + c.charCodeAt(0))
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────────── */

export default function V2Page() {
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [expandedRankingId, setExpandedRankingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Mode A: calendar scores
  const calendarScores = useMemo(() => {
    if (!selectedCityId) return [];
    return getScoresForCity(selectedCityId).map((ms) => ({
      month: ms.month,
      scores: ms.scores,
    }));
  }, [selectedCityId]);

  // Mode B: ranking data
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

  const filteredCities = cities.filter(
    (c) =>
      c.nameKo.includes(citySearchQuery) ||
      c.nameEn.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
      c.country.includes(citySearchQuery)
  );

  // Best month for selected city
  const bestMonth = useMemo(() => {
    if (!calendarScores.length) return null;
    return calendarScores.reduce((best, cur) =>
      cur.scores.total > best.scores.total ? cur : best
    );
  }, [calendarScores]);

  return (
    <>
      {/* Google Fonts */}
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,800&family=Nunito:wght@400;500;600;700&display=swap');`}</style>

      <div
        style={{
          fontFamily: "'Nunito', sans-serif",
          backgroundColor: "#FDF8F0",
          color: "#6B5E50",
          minHeight: "100vh",
        }}
      >
        {/* Dot pattern overlay */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage: "radial-gradient(circle, #D4B89620 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* ─── Header ────────────────────────────────────────── */}
          <header className="pt-12 pb-4 px-4 text-center">
            <h1
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "clamp(2.2rem, 6vw, 3.5rem)",
                fontWeight: 700,
                color: "#3D2E1F",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              where<span style={{ color: "#C4704B" }}>or</span>when
            </h1>
            <p
              className="mt-3"
              style={{
                fontSize: "0.95rem",
                color: "#8B7B6B",
                maxWidth: "360px",
                margin: "12px auto 0",
                lineHeight: 1.6,
              }}
            >
              여행지별 최적 시기를 종합 점수로 알려드립니다
            </p>
          </header>

          {/* ─── Content ────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto px-4 pb-24">
            {/* ─── Mode Toggle ──────────────────────────────────── */}
            <div
              className="relative flex mb-10 mx-auto"
              style={{
                maxWidth: "420px",
                background: "#F0E8DC",
                borderRadius: "24px",
                padding: "5px",
              }}
            >
              {/* Sliding pill */}
              <div
                style={{
                  position: "absolute",
                  top: "5px",
                  bottom: "5px",
                  width: "calc(50% - 5px)",
                  background: "#FFFFFF",
                  borderRadius: "20px",
                  boxShadow: "0 2px 12px rgba(61,46,31,0.08)",
                  transition: "transform 500ms cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: mode === "where-to-when" ? "translateX(0)" : "translateX(calc(100% + 5px))",
                }}
              />

              <button
                onClick={() => setMode("where-to-when")}
                className="relative z-10 flex-1 flex items-center justify-center gap-2 py-3.5 cursor-pointer"
                style={{
                  borderRadius: "20px",
                  fontSize: "0.875rem",
                  fontWeight: mode === "where-to-when" ? 700 : 500,
                  color: mode === "where-to-when" ? "#3D2E1F" : "#8B7B6B",
                  transition: "all 500ms ease",
                  border: "none",
                  background: "transparent",
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                <span>🗺️</span>
                <span>목적지로 검색</span>
              </button>

              <button
                onClick={() => setMode("when-to-where")}
                className="relative z-10 flex-1 flex items-center justify-center gap-2 py-3.5 cursor-pointer"
                style={{
                  borderRadius: "20px",
                  fontSize: "0.875rem",
                  fontWeight: mode === "when-to-where" ? 700 : 500,
                  color: mode === "when-to-where" ? "#3D2E1F" : "#8B7B6B",
                  transition: "all 500ms ease",
                  border: "none",
                  background: "transparent",
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                <span>📅</span>
                <span>날짜로 검색</span>
              </button>
            </div>

            {/* ─── Input Section ──────────────────────────────────── */}
            <div className="mb-10">
              {mode === "where-to-when" ? (
                /* City Search */
                <div ref={dropdownRef} className="relative">
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#8B7B6B",
                      marginBottom: "8px",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    어디로 떠나시나요?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="도시를 검색하세요 (예: 오사카, Tokyo)"
                      value={
                        isCityDropdownOpen
                          ? citySearchQuery
                          : selectedCity
                            ? `${selectedCity.nameKo} (${selectedCity.nameEn})`
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
                      style={{
                        width: "100%",
                        padding: "14px 48px 14px 18px",
                        background: "#FFFFFF",
                        border: "2px solid #E8DFD3",
                        borderRadius: "20px",
                        fontSize: "0.925rem",
                        color: "#3D2E1F",
                        fontFamily: "'Nunito', sans-serif",
                        outline: "none",
                        transition: "all 300ms ease",
                        boxShadow: "0 2px 12px rgba(61,46,31,0.04)",
                      }}
                      onBlur={(e) => {
                        // Style change handled by onFocus on next elem
                      }}
                    />
                    <svg
                      style={{
                        position: "absolute",
                        right: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "18px",
                        height: "18px",
                        color: "#B5A898",
                      }}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                      />
                    </svg>
                  </div>

                  {/* Dropdown */}
                  {isCityDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        zIndex: 50,
                        width: "100%",
                        marginTop: "8px",
                        background: "#FFFFFF",
                        border: "2px solid #E8DFD3",
                        borderRadius: "20px",
                        boxShadow: "0 12px 40px rgba(61,46,31,0.10)",
                        maxHeight: "300px",
                        overflowY: "auto",
                      }}
                    >
                      {filteredCities.length === 0 ? (
                        <div
                          style={{
                            padding: "24px",
                            textAlign: "center",
                            fontSize: "0.875rem",
                            color: "#B5A898",
                          }}
                        >
                          검색 결과가 없습니다
                        </div>
                      ) : (
                        filteredCities.map((city, i) => (
                          <button
                            key={city.id}
                            onClick={() => {
                              setSelectedCityId(city.id);
                              setCitySearchQuery("");
                              setIsCityDropdownOpen(false);
                              setExpandedMonth(null);
                            }}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "12px 18px",
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              background: selectedCityId === city.id ? "rgba(196,112,75,0.06)" : "transparent",
                              border: "none",
                              cursor: "pointer",
                              transition: "background 200ms ease",
                              borderTop: i > 0 ? "1px solid #F0E8DC" : "none",
                              fontFamily: "'Nunito', sans-serif",
                              borderRadius: i === 0
                                ? "18px 18px 0 0"
                                : i === filteredCities.length - 1
                                  ? "0 0 18px 18px"
                                  : "0",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = "rgba(196,112,75,0.06)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background =
                                selectedCityId === city.id ? "rgba(196,112,75,0.06)" : "transparent";
                            }}
                          >
                            <span style={{ fontSize: "1.25rem" }}>{getFlag(city.countryCode)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span
                                style={{
                                  fontSize: "0.9rem",
                                  fontWeight: 700,
                                  color: "#3D2E1F",
                                }}
                              >
                                {city.nameKo}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#B5A898",
                                  marginLeft: "8px",
                                }}
                              >
                                {city.nameEn}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                color: "#B5A898",
                                fontWeight: 500,
                              }}
                            >
                              {city.country}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Month Selector */
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#8B7B6B",
                      marginBottom: "12px",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    언제 떠나시나요?
                  </label>
                  <div
                    className="grid gap-2.5"
                    style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
                  >
                    {MONTH_NAMES.map((name, idx) => {
                      const month = idx + 1;
                      const isActive = selectedMonth === month;
                      const isCurrent = new Date().getMonth() + 1 === month;
                      return (
                        <button
                          key={month}
                          onClick={() => {
                            setSelectedMonth(month);
                            setExpandedRankingId(null);
                          }}
                          style={{
                            position: "relative",
                            padding: "14px 0",
                            borderRadius: "16px",
                            fontSize: "0.875rem",
                            fontWeight: isActive ? 700 : 600,
                            fontFamily: "'Nunito', sans-serif",
                            color: isActive ? "#FFFFFF" : "#6B5E50",
                            background: isActive
                              ? "linear-gradient(135deg, #C4704B 0%, #D4896B 100%)"
                              : "#FFFFFF",
                            border: isActive ? "none" : "2px solid #E8DFD3",
                            boxShadow: isActive
                              ? "0 4px 16px rgba(196,112,75,0.25)"
                              : "0 2px 8px rgba(61,46,31,0.03)",
                            cursor: "pointer",
                            transition: "all 400ms ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              (e.currentTarget as HTMLButtonElement).style.background = "#F9F1E8";
                              (e.currentTarget as HTMLButtonElement).style.borderColor = "#C4704B";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF";
                              (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8DFD3";
                            }
                          }}
                        >
                          {name}
                          {isCurrent && !isActive && (
                            <span
                              style={{
                                position: "absolute",
                                top: "-3px",
                                right: "-3px",
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "#C4704B",
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ─── Wavy Divider ──────────────────────────────────── */}
            <div
              style={{
                width: "100%",
                height: "24px",
                marginBottom: "32px",
                overflow: "hidden",
              }}
            >
              <svg
                viewBox="0 0 1200 24"
                preserveAspectRatio="none"
                style={{ width: "100%", height: "100%", display: "block" }}
              >
                <path
                  d="M0 12 C150 0, 350 24, 600 12 C850 0, 1050 24, 1200 12"
                  fill="none"
                  stroke="#E8DFD3"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {/* ─── Results ──────────────────────────────────────── */}
            {mode === "where-to-when" ? (
              selectedCityId && selectedCity ? (
                <div>
                  {/* City header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "18px",
                        background: "linear-gradient(135deg, #F9F1E8 0%, #F0E8DC 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.8rem",
                        flexShrink: 0,
                      }}
                    >
                      {getFlag(selectedCity.countryCode)}
                    </div>
                    <div>
                      <h2
                        style={{
                          fontFamily: "'Fraunces', serif",
                          fontSize: "1.5rem",
                          fontWeight: 700,
                          color: "#3D2E1F",
                          lineHeight: 1.2,
                        }}
                      >
                        {selectedCity.nameKo}
                      </h2>
                      <p style={{ fontSize: "0.8rem", color: "#B5A898", marginTop: "2px" }}>
                        {selectedCity.nameEn}, {selectedCity.country}
                      </p>
                    </div>
                    {bestMonth && (
                      <div
                        style={{
                          marginLeft: "auto",
                          padding: "6px 14px",
                          background: getScoreBg(bestMonth.scores.total),
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: getScoreColor(bestMonth.scores.total),
                        }}
                      >
                        BEST {bestMonth.month}월
                      </div>
                    )}
                  </div>

                  {/* Calendar grid */}
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
                  >
                    {calendarScores.map((ms) => {
                      const isExpanded = expandedMonth === ms.month;
                      const isBest = bestMonth?.month === ms.month;
                      const color = getScoreColor(ms.scores.total);
                      const highlights = generateHighlights(
                        selectedCityId,
                        ms.month,
                        ms.scores
                      );

                      return (
                        <div
                          key={ms.month}
                          onClick={() => setExpandedMonth(isExpanded ? null : ms.month)}
                          style={{
                            gridColumn: isExpanded ? "1 / -1" : undefined,
                            background: isExpanded ? "#FFFFFF" : getScoreGradient(ms.scores.total),
                            borderRadius: "24px",
                            padding: isExpanded ? "20px" : "16px 12px",
                            cursor: "pointer",
                            transition: "all 500ms cubic-bezier(0.4, 0, 0.2, 1)",
                            border: isBest ? `2px solid ${color}` : "2px solid transparent",
                            boxShadow: isExpanded
                              ? "0 8px 32px rgba(61,46,31,0.10)"
                              : isBest
                                ? `0 4px 20px ${color}20`
                                : "0 2px 8px rgba(61,46,31,0.04)",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {/* Best badge */}
                          {isBest && !isExpanded && (
                            <div
                              style={{
                                position: "absolute",
                                top: "8px",
                                right: "8px",
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: color,
                              }}
                            />
                          )}

                          {!isExpanded ? (
                            /* Collapsed tile */
                            <div style={{ textAlign: "center" }}>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  color: "#B5A898",
                                  marginBottom: "6px",
                                  letterSpacing: "0.03em",
                                }}
                              >
                                {MONTH_LABELS_SHORT[ms.month - 1]}
                              </div>
                              <div
                                style={{
                                  fontFamily: "'Fraunces', serif",
                                  fontSize: "0.85rem",
                                  fontWeight: 600,
                                  color: "#3D2E1F",
                                  marginBottom: "8px",
                                }}
                              >
                                {MONTH_NAMES[ms.month - 1]}
                              </div>
                              <div
                                style={{
                                  fontFamily: "'Fraunces', serif",
                                  fontSize: "1.6rem",
                                  fontWeight: 800,
                                  color: color,
                                  lineHeight: 1,
                                }}
                              >
                                {ms.scores.total.toFixed(1)}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  color: color,
                                  marginTop: "4px",
                                  padding: "2px 8px",
                                  background: getScoreBg(ms.scores.total),
                                  borderRadius: "8px",
                                  display: "inline-block",
                                }}
                              >
                                {getScoreLabel(ms.scores.total)}
                              </div>
                            </div>
                          ) : (
                            /* Expanded detail */
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <div
                                    style={{
                                      fontFamily: "'Fraunces', serif",
                                      fontSize: "1.2rem",
                                      fontWeight: 700,
                                      color: "#3D2E1F",
                                    }}
                                  >
                                    {selectedCity.nameKo} · {MONTH_NAMES[ms.month - 1]}
                                  </div>
                                  {isBest && (
                                    <span
                                      style={{
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                        color: "#C4704B",
                                        background: "rgba(196,112,75,0.08)",
                                        padding: "2px 8px",
                                        borderRadius: "8px",
                                        marginTop: "4px",
                                        display: "inline-block",
                                      }}
                                    >
                                      ✨ 최적의 시기
                                    </span>
                                  )}
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div
                                    style={{
                                      fontFamily: "'Fraunces', serif",
                                      fontSize: "2rem",
                                      fontWeight: 800,
                                      color: color,
                                      lineHeight: 1,
                                    }}
                                  >
                                    {ms.scores.total.toFixed(1)}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.7rem",
                                      fontWeight: 700,
                                      color: color,
                                    }}
                                  >
                                    {getScoreLabel(ms.scores.total)}
                                  </div>
                                </div>
                              </div>

                              {/* Score bars */}
                              <div
                                className="grid gap-2.5"
                                style={{ gridTemplateColumns: "1fr 1fr" }}
                              >
                                {(["weather", "cost", "crowd", "buzz"] as const).map(
                                  (key) => (
                                    <div
                                      key={key}
                                      style={{
                                        background: "#FDF8F0",
                                        borderRadius: "14px",
                                        padding: "10px 12px",
                                      }}
                                    >
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span
                                          style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            color: "#8B7B6B",
                                          }}
                                        >
                                          {SCORE_ICONS[key]} {SCORE_LABELS[key]}
                                        </span>
                                        <span
                                          style={{
                                            fontFamily: "'Fraunces', serif",
                                            fontSize: "0.85rem",
                                            fontWeight: 700,
                                            color: getScoreColor(ms.scores[key]),
                                          }}
                                        >
                                          {ms.scores[key].toFixed(1)}
                                        </span>
                                      </div>
                                      <div
                                        style={{
                                          height: "6px",
                                          background: "#E8DFD3",
                                          borderRadius: "3px",
                                          overflow: "hidden",
                                        }}
                                      >
                                        <div
                                          style={{
                                            height: "100%",
                                            width: `${ms.scores[key] * 10}%`,
                                            background: getScoreColor(ms.scores[key]),
                                            borderRadius: "3px",
                                            transition: "width 600ms ease",
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>

                              {/* Highlights */}
                              {highlights.length > 0 && (
                                <div
                                  className="flex flex-wrap gap-1.5"
                                  style={{ marginTop: "12px" }}
                                >
                                  {highlights.map((h, i) => (
                                    <span
                                      key={i}
                                      style={{
                                        fontSize: "0.7rem",
                                        fontWeight: 600,
                                        color: "#8B9D77",
                                        background: "rgba(139,157,119,0.10)",
                                        padding: "4px 10px",
                                        borderRadius: "10px",
                                        border: "1px dashed rgba(139,157,119,0.30)",
                                      }}
                                    >
                                      {h}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div
                                style={{
                                  textAlign: "center",
                                  marginTop: "12px",
                                  fontSize: "0.7rem",
                                  color: "#B5A898",
                                }}
                              >
                                탭하여 닫기
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "40px",
                      background: "linear-gradient(135deg, #F9F1E8 0%, #F0E8DC 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                      fontSize: "3rem",
                    }}
                  >
                    🧳
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "#3D2E1F",
                      marginBottom: "8px",
                    }}
                  >
                    어디로 떠나볼까요?
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#B5A898", lineHeight: 1.6 }}>
                    목적지를 검색하면
                    <br />
                    12개월 최적 시기를 알려드립니다
                  </p>
                  <div
                    className="flex flex-wrap justify-center gap-2"
                    style={{ marginTop: "24px" }}
                  >
                    {cities.slice(0, 6).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCityId(c.id);
                          setCitySearchQuery("");
                          setIsCityDropdownOpen(false);
                        }}
                        style={{
                          padding: "8px 16px",
                          background: "#FFFFFF",
                          border: "2px solid #E8DFD3",
                          borderRadius: "14px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "#6B5E50",
                          cursor: "pointer",
                          transition: "all 300ms ease",
                          fontFamily: "'Nunito', sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#C4704B";
                          (e.currentTarget as HTMLButtonElement).style.color = "#C4704B";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8DFD3";
                          (e.currentTarget as HTMLButtonElement).style.color = "#6B5E50";
                        }}
                      >
                        {getFlag(c.countryCode)} {c.nameKo}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ) : (
              /* ─── Rankings (When→Where) ──────────────────────── */
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <h2
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      color: "#3D2E1F",
                    }}
                  >
                    {MONTH_NAMES[selectedMonth - 1]} 추천 여행지
                  </h2>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "#B5A898",
                      background: "#F0E8DC",
                      padding: "3px 10px",
                      borderRadius: "8px",
                    }}
                  >
                    {monthRankings.length}개 도시
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {monthRankings.map((item, index) => {
                    const isExpanded = expandedRankingId === item.cityId;
                    const isTop3 = index < 3;
                    const color = getScoreColor(item.scores.total);
                    const rank = index + 1;

                    return (
                      <div
                        key={item.cityId}
                        onClick={() =>
                          setExpandedRankingId(isExpanded ? null : item.cityId)
                        }
                        style={{
                          background: "#FFFFFF",
                          borderRadius: "24px",
                          padding: isExpanded ? "20px" : "16px 18px",
                          cursor: "pointer",
                          transition: "all 500ms cubic-bezier(0.4, 0, 0.2, 1)",
                          boxShadow: isExpanded
                            ? "0 8px 32px rgba(61,46,31,0.10)"
                            : isTop3
                              ? "0 4px 20px rgba(61,46,31,0.06)"
                              : "0 2px 8px rgba(61,46,31,0.03)",
                          border: isTop3
                            ? `2px solid ${color}20`
                            : "2px solid transparent",
                        }}
                      >
                        {/* Collapsed row */}
                        <div className="flex items-center gap-3">
                          {/* Rank badge */}
                          <div
                            style={{
                              width: isTop3 ? "42px" : "36px",
                              height: isTop3 ? "42px" : "36px",
                              borderRadius: isTop3 ? "16px" : "12px",
                              background: isTop3
                                ? `linear-gradient(135deg, ${color}20 0%, ${color}08 100%)`
                                : "#F9F5EF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {rank <= 3 ? (
                              <span
                                style={{
                                  fontFamily: "'Fraunces', serif",
                                  fontSize: rank === 1 ? "1.1rem" : "0.95rem",
                                  fontWeight: 800,
                                  color: color,
                                }}
                              >
                                {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontFamily: "'Fraunces', serif",
                                  fontSize: "0.8rem",
                                  fontWeight: 700,
                                  color: "#B5A898",
                                }}
                              >
                                {rank}
                              </span>
                            )}
                          </div>

                          {/* City info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: "1rem" }}>
                                {getFlag(item.countryCode)}
                              </span>
                              <span
                                style={{
                                  fontFamily: isTop3
                                    ? "'Fraunces', serif"
                                    : "'Nunito', sans-serif",
                                  fontSize: isTop3 ? "1rem" : "0.9rem",
                                  fontWeight: 700,
                                  color: "#3D2E1F",
                                }}
                              >
                                {item.cityNameKo}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#B5A898",
                                }}
                              >
                                {item.country}
                              </span>
                            </div>
                            {/* Highlights (collapsed) */}
                            {!isExpanded && item.highlights.length > 0 && (
                              <div
                                className="flex flex-wrap gap-1"
                                style={{ marginTop: "4px" }}
                              >
                                {item.highlights.slice(0, 2).map((h, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      fontSize: "0.65rem",
                                      fontWeight: 600,
                                      color: "#8B9D77",
                                      background: "rgba(139,157,119,0.08)",
                                      padding: "2px 8px",
                                      borderRadius: "8px",
                                      border: "1px dashed rgba(139,157,119,0.25)",
                                    }}
                                  >
                                    {h}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Score */}
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div
                              style={{
                                fontFamily: "'Fraunces', serif",
                                fontSize: isTop3 ? "1.5rem" : "1.2rem",
                                fontWeight: 800,
                                color: color,
                                lineHeight: 1,
                              }}
                            >
                              {item.scores.total.toFixed(1)}
                            </div>
                            <div
                              style={{
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                color: color,
                                marginTop: "2px",
                              }}
                            >
                              {getScoreLabel(item.scores.total)}
                            </div>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div style={{ marginTop: "16px" }}>
                            {/* Score bars */}
                            <div
                              className="grid gap-2.5"
                              style={{ gridTemplateColumns: "1fr 1fr" }}
                            >
                              {(["weather", "cost", "crowd", "buzz"] as const).map(
                                (key) => (
                                  <div
                                    key={key}
                                    style={{
                                      background: "#FDF8F0",
                                      borderRadius: "14px",
                                      padding: "10px 12px",
                                    }}
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span
                                        style={{
                                          fontSize: "0.75rem",
                                          fontWeight: 600,
                                          color: "#8B7B6B",
                                        }}
                                      >
                                        {SCORE_ICONS[key]} {SCORE_LABELS[key]}
                                      </span>
                                      <span
                                        style={{
                                          fontFamily: "'Fraunces', serif",
                                          fontSize: "0.85rem",
                                          fontWeight: 700,
                                          color: getScoreColor(item.scores[key]),
                                        }}
                                      >
                                        {item.scores[key].toFixed(1)}
                                      </span>
                                    </div>
                                    <div
                                      style={{
                                        height: "6px",
                                        background: "#E8DFD3",
                                        borderRadius: "3px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <div
                                        style={{
                                          height: "100%",
                                          width: `${item.scores[key] * 10}%`,
                                          background: getScoreColor(item.scores[key]),
                                          borderRadius: "3px",
                                          transition: "width 600ms ease",
                                        }}
                                      />
                                    </div>
                                  </div>
                                )
                              )}
                            </div>

                            {/* Highlights */}
                            {item.highlights.length > 0 && (
                              <div
                                className="flex flex-wrap gap-1.5"
                                style={{ marginTop: "12px" }}
                              >
                                {item.highlights.map((h, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      fontSize: "0.7rem",
                                      fontWeight: 600,
                                      color: "#8B9D77",
                                      background: "rgba(139,157,119,0.10)",
                                      padding: "4px 10px",
                                      borderRadius: "10px",
                                      border: "1px dashed rgba(139,157,119,0.30)",
                                    }}
                                  >
                                    {h}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div
                              style={{
                                textAlign: "center",
                                marginTop: "12px",
                                fontSize: "0.7rem",
                                color: "#B5A898",
                              }}
                            >
                              탭하여 닫기
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ─── Footer ────────────────────────────────────────── */}
          <footer
            style={{
              textAlign: "center",
              padding: "32px 16px 40px",
              borderTop: "1px solid #E8DFD3",
            }}
          >
            <p style={{ fontSize: "0.75rem", color: "#B5A898", lineHeight: 1.7 }}>
              날씨 · 환율 · 혼잡도 · 버즈 — 4가지 데이터를 하나의 점수로
            </p>
            <p
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "0.7rem",
                color: "#D4B896",
                marginTop: "8px",
              }}
            >
              where<span style={{ color: "#C4704B" }}>or</span>when ©{" "}
              {new Date().getFullYear()}
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
