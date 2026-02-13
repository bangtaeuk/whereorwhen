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

const RANK_LABELS: Record<string, string> = {
  weather: "날씨",
  cost: "비용",
  crowd: "혼잡도",
  buzz: "버즈",
  total: "종합",
};

const POPULAR_IDS = ["osaka", "tokyo", "bangkok", "danang", "guam", "cebu", "taipei", "bali"];

const NOW_MONTH = new Date().getMonth() + 1;

/* ─── Helpers ───────────────────────────────────────────── */

function scoreColor(v: number): string {
  if (v >= 8) return "#16A34A";
  if (v >= 6) return "#2563EB";
  if (v >= 4) return "#D97706";
  return "#DC2626";
}

function scoreBg(v: number, opacity: number): string {
  if (v >= 8) return `rgba(22,163,74,${opacity})`;
  if (v >= 6) return `rgba(37,99,235,${opacity})`;
  if (v >= 4) return `rgba(217,119,6,${opacity})`;
  return `rgba(220,38,38,${opacity})`;
}

function gradeLabel(v: number): string {
  if (v >= 8) return "최적";
  if (v >= 6) return "좋음";
  if (v >= 4) return "보통";
  return "비추천";
}

function flag(cc: string): string {
  return cc
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

/* ─── Tooltip Component ─────────────────────────────────── */

function Tooltip({
  scores,
  month,
  cityName,
}: {
  scores: ScoreBreakdown;
  month: number;
  cityName: string;
}) {
  return (
    <div
      className="absolute z-50 border shadow-lg rounded px-3 py-2 text-xs pointer-events-none whitespace-nowrap"
      style={{
        background: "#FFF",
        borderColor: "#E2E2E2",
        bottom: "calc(100% + 4px)",
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      <div className="font-semibold text-[11px] mb-1" style={{ color: "#111" }}>
        {cityName} · {month}월
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5" style={{ color: "#666" }}>
        <span>종합</span>
        <span className="text-right font-medium tabular-nums" style={{ color: scoreColor(scores.total) }}>
          {scores.total.toFixed(1)}
        </span>
        {SUB_KEYS.map((k) => (
          <span key={k} className="contents">
            <span>{SUB_LABELS[k]}</span>
            <span className="text-right tabular-nums" style={{ color: scoreColor(scores[k]) }}>
              {scores[k].toFixed(1)}
            </span>
          </span>
        ))}
      </div>
      <div className="mt-1 pt-1 border-t" style={{ borderColor: "#E2E2E2", color: scoreColor(scores.total) }}>
        {gradeLabel(scores.total)}
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */

export default function V8Page() {
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(NOW_MONTH);
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  // ─── Mode 1: city → months
  const cityMatch = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.trim().toLowerCase();
    return cities.find(
      (c) =>
        c.nameKo.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.country.includes(q)
    ) ?? null;
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

  // ─── Mode 2: month → cities
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

  // ─── Filtered suggestions
  const suggestions = useMemo(() => {
    if (!query.trim() || activeCityId) return [];
    const q = query.trim().toLowerCase();
    return cities.filter(
      (c) =>
        c.nameKo.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.country.includes(q)
    ).slice(0, 6);
  }, [query, activeCityId]);

  const handleSelectCity = (id: string) => {
    setSelectedCity(id);
    const c = cities.find((ci) => ci.id === id);
    if (c) setQuery(c.nameKo);
    setSelectedCell(null);
    setHoveredCell(null);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedCity(null);
    setSelectedCell(null);
    setHoveredCell(null);
  };

  /* ================================================================ */

  return (
    <div className="min-h-screen" style={{ background: "#FFF", color: "#111" }}>
      {/* ─── Header ─────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 h-10 border-b"
        style={{ borderColor: "#E2E2E2" }}
      >
        <span className="text-sm font-bold tracking-tight" style={{ color: "#111" }}>
          whereorwhen
        </span>
        <nav className="flex items-center gap-1 text-xs" style={{ color: "#666" }}>
          <button
            onClick={() => { setMode("where-to-when"); handleClear(); }}
            className={`px-1.5 py-0.5 transition-colors ${
              mode === "where-to-when"
                ? "font-bold underline underline-offset-4"
                : "hover:text-[#111]"
            }`}
            style={mode === "where-to-when" ? { color: "#111" } : undefined}
          >
            도시→시기
          </button>
          <span style={{ color: "#E2E2E2" }}>|</span>
          <button
            onClick={() => { setMode("when-to-where"); handleClear(); }}
            className={`px-1.5 py-0.5 transition-colors ${
              mode === "when-to-where"
                ? "font-bold underline underline-offset-4"
                : "hover:text-[#111]"
            }`}
            style={mode === "when-to-where" ? { color: "#111" } : undefined}
          >
            시기→도시
          </button>
        </nav>
      </header>

      {/* ─── Content ────────────────────────────────────── */}
      <main className="max-w-[1280px] mx-auto px-4 py-3">
        {mode === "where-to-when" ? (
          <CityToMonthView
            query={query}
            setQuery={setQuery}
            suggestions={suggestions}
            activeCityId={activeCityId}
            activeCity={activeCity}
            cityScores={cityScores}
            bestMonth={bestMonth}
            hoveredCell={hoveredCell}
            setHoveredCell={setHoveredCell}
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
   MODE 1: 도시 → 시기 (Calendar Data Matrix)
   ================================================================ */

function CityToMonthView({
  query,
  setQuery,
  suggestions,
  activeCityId,
  activeCity,
  cityScores,
  bestMonth,
  hoveredCell,
  setHoveredCell,
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
  hoveredCell: number | null;
  setHoveredCell: (v: number | null) => void;
  selectedCell: number | null;
  setSelectedCell: (v: number | null) => void;
  onSelectCity: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      {/* Search */}
      <div className="relative mb-3">
        <div
          className="flex items-center border rounded h-9 px-3 gap-2"
          style={{ borderColor: "#E2E2E2", background: "#FAFAFA" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
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
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#999]"
            style={{ color: "#111" }}
          />
          {query && (
            <button onClick={onClear} className="text-xs" style={{ color: "#999" }}>
              ✕
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full mt-0.5 border rounded shadow-sm z-40 max-h-48 overflow-y-auto"
            style={{ background: "#FFF", borderColor: "#E2E2E2" }}
          >
            {suggestions.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCity(c.id)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#F0F7FF] flex items-center gap-2 transition-colors"
              >
                <span>{flag(c.countryCode)}</span>
                <span className="font-medium" style={{ color: "#111" }}>{c.nameKo}</span>
                <span style={{ color: "#999" }}>{c.nameEn}</span>
                <span className="ml-auto" style={{ color: "#999" }}>{c.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular cities */}
      {!activeCityId && !query && (
        <div className="mb-3">
          <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: "#666" }}>
            <span style={{ color: "#999" }}>인기:</span>
            {POPULAR_IDS.map((id) => {
              const c = cities.find((ci) => ci.id === id)!;
              return (
                <button
                  key={id}
                  onClick={() => onSelectCity(id)}
                  className="hover:underline transition-colors hover:text-[#111]"
                >
                  {c.nameKo}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!activeCityId && (
        <div
          className="flex items-center justify-center py-20 text-sm"
          style={{ color: "#999" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          도시를 검색하세요 →
        </div>
      )}

      {/* Data Matrix Table */}
      {activeCityId && activeCity && cityScores.length > 0 && (
        <div>
          {/* City header */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-sm font-semibold" style={{ color: "#111" }}>
              {flag(activeCity.countryCode)} {activeCity.nameKo}
            </span>
            <span className="text-xs" style={{ color: "#999" }}>
              {activeCity.nameEn} · {activeCity.country}
            </span>
          </div>

          {/* Table container - horizontal scroll on mobile */}
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <table
              className="w-full text-xs border-collapse min-w-[800px]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {/* Month headers */}
              <thead>
                <tr>
                  <th
                    className="text-left px-2 py-1.5 font-medium border-b sticky left-0 z-10"
                    style={{
                      borderColor: "#E2E2E2",
                      color: "#999",
                      background: "#FFF",
                      width: "60px",
                      minWidth: "60px",
                    }}
                  >
                    항목
                  </th>
                  {MONTH_NAMES.map((name, i) => {
                    const m = i + 1;
                    const isBest = m === bestMonth;
                    const isCurrent = m === NOW_MONTH;
                    return (
                      <th
                        key={m}
                        className={`text-center px-1 py-1.5 font-medium border-b cursor-pointer transition-colors ${
                          isCurrent ? "bg-[#FAFAFA]" : ""
                        }`}
                        style={{
                          borderColor: "#E2E2E2",
                          color: isBest ? "#16A34A" : "#666",
                          minWidth: "62px",
                        }}
                        onClick={() => setSelectedCell(m)}
                      >
                        {isBest && <span className="mr-0.5">★</span>}
                        {name}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Total score row */}
                <tr>
                  <td
                    className="px-2 py-2 font-semibold border-b sticky left-0 z-10"
                    style={{ borderColor: "#E2E2E2", color: "#111", background: "#FFF" }}
                  >
                    종합
                  </td>
                  {cityScores.map((ms) => {
                    const v = ms.scores.total;
                    const m = ms.month;
                    const isHovered = hoveredCell === m;
                    const isSelected = selectedCell === m;
                    const isCurrent = m === NOW_MONTH;
                    return (
                      <td
                        key={m}
                        className="text-center px-1 py-2 border-b relative cursor-pointer transition-colors"
                        style={{
                          borderColor: "#E2E2E2",
                          background: isHovered
                            ? scoreBg(v, 0.12)
                            : isCurrent
                            ? "#FAFAFA"
                            : scoreBg(v, 0.04),
                          borderBottom: isSelected
                            ? `3px solid ${scoreColor(v)}`
                            : undefined,
                        }}
                        onMouseEnter={() => setHoveredCell(m)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => setSelectedCell(isSelected ? null : m)}
                      >
                        <div
                          className="text-sm font-bold tabular-nums"
                          style={{ color: scoreColor(v) }}
                        >
                          {v.toFixed(1)}
                        </div>
                        {/* Mini bar */}
                        <div
                          className="mx-auto mt-0.5 rounded-full h-[3px]"
                          style={{
                            width: `${Math.max(v * 10, 10)}%`,
                            background: scoreColor(v),
                            opacity: 0.5,
                          }}
                        />
                        {/* Tooltip */}
                        {isHovered && (
                          <Tooltip
                            scores={ms.scores}
                            month={m}
                            cityName={activeCity.nameKo}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Sub-score rows */}
                {SUB_KEYS.map((key) => (
                  <tr key={key}>
                    <td
                      className="px-2 py-1.5 border-b sticky left-0 z-10"
                      style={{
                        borderColor: "#E2E2E2",
                        color: "#999",
                        background: "#FFF",
                        fontSize: "11px",
                      }}
                    >
                      {SUB_LABELS[key]}
                    </td>
                    {cityScores.map((ms) => {
                      const v = ms.scores[key];
                      const m = ms.month;
                      const isCurrent = m === NOW_MONTH;
                      const isHovered = hoveredCell === m;
                      return (
                        <td
                          key={m}
                          className="text-center px-1 py-1.5 border-b transition-colors"
                          style={{
                            borderColor: "#F0F0F0",
                            fontSize: "11px",
                            color: scoreColor(v),
                            background: isHovered
                              ? "rgba(0,0,0,0.02)"
                              : isCurrent
                              ? "#FAFAFA"
                              : "transparent",
                          }}
                          onMouseEnter={() => setHoveredCell(m)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {v.toFixed(1)}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Highlights row */}
                <tr>
                  <td
                    className="px-2 py-1.5 sticky left-0 z-10"
                    style={{ color: "#999", background: "#FFF", fontSize: "11px" }}
                  >
                    하이라이트
                  </td>
                  {cityScores.map((ms) => {
                    const hl = generateHighlights(ms.cityId, ms.month, ms.scores);
                    const m = ms.month;
                    const isCurrent = m === NOW_MONTH;
                    const isHovered = hoveredCell === m;
                    return (
                      <td
                        key={m}
                        className="text-center px-1 py-1.5 transition-colors"
                        style={{
                          fontSize: "10px",
                          color: "#999",
                          lineHeight: "1.3",
                          background: isHovered
                            ? "rgba(0,0,0,0.02)"
                            : isCurrent
                            ? "#FAFAFA"
                            : "transparent",
                        }}
                        onMouseEnter={() => setHoveredCell(m)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {hl.length > 0 ? hl.join(", ") : "—"}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Selected cell detail (inline) */}
          {selectedCell && (() => {
            const ms = cityScores.find((s) => s.month === selectedCell);
            if (!ms) return null;
            const hl = generateHighlights(ms.cityId, ms.month, ms.scores);
            return (
              <div
                className="mt-2 border rounded px-3 py-2 text-xs flex items-start gap-4 flex-wrap"
                style={{ borderColor: "#E2E2E2", background: "#FAFAFA" }}
              >
                <div>
                  <span className="font-semibold" style={{ color: "#111" }}>
                    {activeCity.nameKo} · {selectedCell}월
                  </span>
                  <span className="ml-2" style={{ color: scoreColor(ms.scores.total) }}>
                    종합 {ms.scores.total.toFixed(1)} ({gradeLabel(ms.scores.total)})
                  </span>
                </div>
                <div className="flex gap-3" style={{ color: "#666" }}>
                  {SUB_KEYS.map((k) => (
                    <span key={k}>
                      {SUB_LABELS[k]}{" "}
                      <span className="font-medium tabular-nums" style={{ color: scoreColor(ms.scores[k]) }}>
                        {ms.scores[k].toFixed(1)}
                      </span>
                    </span>
                  ))}
                </div>
                {hl.length > 0 && (
                  <div style={{ color: "#999" }}>
                    {hl.join(" · ")}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   MODE 2: 시기 → 도시 (Ranking Table)
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
  return (
    <div>
      {/* Month selector as compact row */}
      <div className="flex items-center gap-0.5 mb-3 overflow-x-auto pb-1">
        {MONTH_NAMES.map((name, i) => {
          const m = i + 1;
          const active = m === selectedMonth;
          const isCurrent = m === NOW_MONTH;
          return (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`text-xs px-2 py-1 rounded transition-colors shrink-0 ${
                active
                  ? "font-bold"
                  : "hover:bg-[#FAFAFA]"
              }`}
              style={{
                color: active ? "#FFF" : isCurrent ? "#2563EB" : "#666",
                background: active ? "#111" : "transparent",
              }}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Ranking Table */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table
          className="w-full text-xs border-collapse min-w-[700px]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          <thead>
            <tr>
              {["순위", "도시", "종합", "날씨", "비용", "혼잡도", "버즈", "하이라이트"].map(
                (h) => (
                  <th
                    key={h}
                    className={`px-2 py-2 border-b font-medium text-left ${
                      h === "순위" ? "w-10 text-center" : ""
                    } ${["종합", "날씨", "비용", "혼잡도", "버즈"].includes(h) ? "text-right" : ""}`}
                    style={{ borderColor: "#E2E2E2", color: "#999" }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {ranking.map((item, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;
              return (
                <tr
                  key={item.cityId}
                  className="transition-colors hover:bg-[#F0F7FF] cursor-pointer group"
                  style={{
                    background: idx % 2 === 0 ? "#FFF" : "#FAFAFA",
                    borderLeft: isTop3 ? "2px solid #111" : "2px solid transparent",
                  }}
                  onClick={() => onSelectCity(item.cityId)}
                >
                  <td
                    className="px-2 py-2 border-b text-center"
                    style={{
                      borderColor: "#F0F0F0",
                      color: isTop3 ? "#111" : "#999",
                      fontWeight: isTop3 ? 600 : 400,
                    }}
                  >
                    {rank}
                  </td>
                  <td
                    className="px-2 py-2 border-b"
                    style={{
                      borderColor: "#F0F0F0",
                      fontWeight: isTop3 ? 600 : 400,
                    }}
                  >
                    <span className="mr-1.5">{flag(item.city.countryCode)}</span>
                    <span style={{ color: "#111" }}>{item.city.nameKo}</span>
                    <span className="ml-1.5" style={{ color: "#999" }}>
                      {item.city.nameEn}
                    </span>
                  </td>
                  {(["total", "weather", "cost", "crowd", "buzz"] as const).map((k) => (
                    <td
                      key={k}
                      className="px-2 py-2 border-b text-right tabular-nums"
                      style={{
                        borderColor: "#F0F0F0",
                        color: scoreColor(item.scores[k]),
                        fontWeight: k === "total" ? 700 : isTop3 ? 600 : 400,
                        fontSize: k === "total" ? "13px" : "12px",
                      }}
                    >
                      {item.scores[k].toFixed(1)}
                    </td>
                  ))}
                  <td
                    className="px-2 py-2 border-b"
                    style={{
                      borderColor: "#F0F0F0",
                      color: "#999",
                      fontSize: "11px",
                      maxWidth: "200px",
                    }}
                  >
                    {item.highlights.length > 0
                      ? item.highlights.join(", ")
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
