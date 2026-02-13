"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { cities } from "@/data/cities";
import { getScoresForCity, getScoresForMonth } from "@/data/mock-scores";
import { generateHighlights } from "@/lib/highlights";
import type { AppMode, ScoreBreakdown } from "@/types";

/* ─── Constants ─────────────────────────────────────────── */

const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const SCORE_LABELS: Record<keyof Omit<ScoreBreakdown, "total">, string> = {
  weather: "날씨",
  cost: "비용",
  crowd: "혼잡도",
  buzz: "버즈",
};

const SCORE_ICONS: Record<keyof Omit<ScoreBreakdown, "total">, string> = {
  weather: "☀",
  cost: "₩",
  crowd: "👥",
  buzz: "📈",
};

/* ─── Helpers ───────────────────────────────────────────── */

function scoreColor(score: number): string {
  if (score >= 8.0) return "#00E5FF";
  if (score >= 6.0) return "#ADFF2F";
  if (score >= 4.0) return "#FFB800";
  return "#FF006E";
}

function scoreGrade(score: number): string {
  if (score >= 8.0) return "최적";
  if (score >= 6.0) return "좋음";
  if (score >= 4.0) return "보통";
  return "비추";
}

function scoreGlow(score: number): string {
  const c = scoreColor(score);
  return `0 0 12px ${c}60, 0 0 4px ${c}40`;
}

/* ─── Components ────────────────────────────────────────── */

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span
        style={{ fontFamily: "'Space Mono', monospace" }}
        className="text-xl sm:text-2xl font-bold tracking-tight"
      >
        <span style={{ color: "#F0F4FF" }}>where</span>
        <span
          style={{
            color: "#00E5FF",
            textShadow: "0 0 12px #00E5FF80, 0 0 24px #00E5FF40",
          }}
        >
          or
        </span>
        <span style={{ color: "#F0F4FF" }}>when</span>
      </span>
      <span
        className="text-xs px-1.5 py-0.5 rounded"
        style={{
          background: "#00E5FF15",
          color: "#00E5FF",
          border: "1px solid #00E5FF30",
          fontFamily: "'Space Mono', monospace",
          fontSize: "10px",
        }}
      >
        v3
      </span>
    </div>
  );
}

function ModeToggle({
  mode,
  onToggle,
}: {
  mode: AppMode;
  onToggle: () => void;
}) {
  const isWhen = mode === "when-to-where";
  return (
    <button
      onClick={onToggle}
      className="relative flex items-center gap-0 rounded-sm overflow-hidden cursor-pointer"
      style={{
        border: "1px solid #1E2A4A",
        background: "#0D1220",
      }}
    >
      <div
        className="px-3 py-1.5 text-xs font-medium transition-all duration-300 relative z-10"
        style={{
          fontFamily: "'Outfit', sans-serif",
          color: !isWhen ? "#00E5FF" : "#64748B",
          background: !isWhen ? "#00E5FF12" : "transparent",
        }}
      >
        도시→시기
      </div>
      <div
        className="px-3 py-1.5 text-xs font-medium transition-all duration-300 relative z-10"
        style={{
          fontFamily: "'Outfit', sans-serif",
          color: isWhen ? "#FF006E" : "#64748B",
          background: isWhen ? "#FF006E12" : "transparent",
        }}
      >
        시기→도시
      </div>
      {/* LED indicator */}
      <div
        className="absolute top-0 h-0.5 transition-all duration-300"
        style={{
          left: isWhen ? "50%" : "0",
          width: "50%",
          background: isWhen ? "#FF006E" : "#00E5FF",
          boxShadow: `0 0 8px ${isWhen ? "#FF006E" : "#00E5FF"}80`,
        }}
      />
    </button>
  );
}

function CitySearch({
  query,
  onChange,
  selectedCity,
  onSelect,
}: {
  query: string;
  onChange: (q: string) => void;
  selectedCity: string;
  onSelect: (id: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return cities;
    const q = query.toLowerCase();
    return cities.filter(
      (c) =>
        c.nameKo.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.country.includes(q)
    );
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = cities.find((c) => c.id === selectedCity);

  return (
    <div ref={ref} className="relative w-full">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-sm transition-all"
        style={{
          background: "#0D1220",
          border: `1px solid ${focused ? "#00E5FF40" : "#1E2A4A"}`,
          boxShadow: focused ? "0 0 12px #00E5FF15" : "none",
        }}
      >
        <span
          style={{
            color: "#00E5FF",
            fontFamily: "'Space Mono', monospace",
            fontSize: "12px",
          }}
        >
          &gt;
        </span>
        <input
          type="text"
          value={focused ? query : selected ? `${selected.nameKo} (${selected.nameEn})` : query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setFocused(true);
            onChange("");
          }}
          placeholder="도시 검색..."
          className="flex-1 bg-transparent outline-none text-sm"
          style={{
            color: "#F0F4FF",
            fontFamily: "'Outfit', sans-serif",
            caretColor: "#00E5FF",
          }}
        />
        {focused && (
          <span
            className="animate-pulse text-xs"
            style={{ color: "#00E5FF" }}
          >
            █
          </span>
        )}
      </div>

      {focused && (
        <div
          className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto rounded-sm"
          style={{
            background: "#0D1220",
            border: "1px solid #1E2A4A",
            boxShadow: "0 8px 32px #00000080",
          }}
        >
          {filtered.map((city) => (
            <button
              key={city.id}
              onClick={() => {
                onSelect(city.id);
                setFocused(false);
                onChange("");
              }}
              className="w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer"
              style={{
                background:
                  city.id === selectedCity ? "#00E5FF10" : "transparent",
                borderLeft:
                  city.id === selectedCity
                    ? "2px solid #00E5FF"
                    : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#131A2E";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  city.id === selectedCity ? "#00E5FF10" : "transparent";
              }}
            >
              <div>
                <span
                  className="text-sm"
                  style={{
                    color: "#F0F4FF",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {city.nameKo}
                </span>
                <span
                  className="ml-2 text-xs"
                  style={{
                    color: "#64748B",
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  {city.nameEn}
                </span>
              </div>
              <span
                className="text-xs"
                style={{
                  color: "#64748B",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {city.country}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div
              className="px-3 py-4 text-center text-xs"
              style={{ color: "#64748B" }}
            >
              검색 결과 없음
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MonthStrip({
  selectedMonth,
  onSelect,
  scores,
}: {
  selectedMonth: number;
  onSelect: (m: number) => void;
  scores?: Record<number, number>;
}) {
  return (
    <div className="flex gap-0.5 overflow-x-auto pb-1">
      {MONTH_NAMES.map((name, i) => {
        const m = i + 1;
        const active = m === selectedMonth;
        const score = scores?.[m];
        const color = score ? scoreColor(score) : "#64748B";
        return (
          <button
            key={m}
            onClick={() => onSelect(m)}
            className="flex-shrink-0 flex flex-col items-center px-2 py-1.5 rounded-sm transition-all cursor-pointer"
            style={{
              minWidth: "52px",
              background: active ? `${color}12` : "#0D1220",
              border: `1px solid ${active ? `${color}60` : "#1E2A4A"}`,
              boxShadow: active ? `0 0 8px ${color}30` : "none",
            }}
          >
            <span
              className="text-xs"
              style={{
                color: active ? color : "#64748B",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: active ? 600 : 400,
              }}
            >
              {name}
            </span>
            {score !== undefined && (
              <span
                className="text-xs font-bold mt-0.5"
                style={{
                  color,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "10px",
                  textShadow: active ? `0 0 6px ${color}60` : "none",
                }}
              >
                {score.toFixed(1)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ScoreBar({
  label,
  icon,
  value,
  maxValue = 10,
}: {
  label: string;
  icon: string;
  value: number;
  maxValue?: number;
}) {
  const color = scoreColor(value);
  const pct = (value / maxValue) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-4 text-center">{icon}</span>
      <span
        className="text-xs w-12"
        style={{ color: "#64748B", fontFamily: "'Outfit', sans-serif" }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "#1E2A4A" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 6px ${color}40`,
          }}
        />
      </div>
      <span
        className="text-xs w-8 text-right font-bold"
        style={{
          color,
          fontFamily: "'Space Mono', monospace",
          fontSize: "11px",
        }}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div
      className="h-full rounded-sm"
      style={{
        width: `${(value / 10) * 100}%`,
        background: `${color}80`,
        minWidth: "2px",
      }}
    />
  );
}

function CalendarGrid({
  cityId,
  selectedMonth,
  onSelectMonth,
}: {
  cityId: string;
  selectedMonth: number;
  onSelectMonth: (m: number) => void;
}) {
  const scores = useMemo(() => getScoresForCity(cityId), [cityId]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {scores.map((ms, idx) => {
        const active = ms.month === selectedMonth;
        const color = scoreColor(ms.scores.total);
        const subScores = [
          { key: "weather", val: ms.scores.weather },
          { key: "cost", val: ms.scores.cost },
          { key: "crowd", val: ms.scores.crowd },
          { key: "buzz", val: ms.scores.buzz },
        ];
        return (
          <button
            key={ms.month}
            onClick={() => onSelectMonth(ms.month)}
            className="relative p-3 rounded-sm text-left transition-all cursor-pointer group"
            style={{
              background: active ? "#131A2E" : "#0D1220",
              border: `1px solid ${active ? `${color}80` : "#1E2A4A"}`,
              boxShadow: active ? `0 0 16px ${color}25, inset 0 0 12px ${color}08` : "none",
              animationDelay: `${idx * 50}ms`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-medium"
                style={{
                  color: active ? color : "#64748B",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {MONTH_NAMES[ms.month - 1]}
              </span>
              <span
                className="text-xs px-1 py-0.5 rounded-sm"
                style={{
                  fontSize: "9px",
                  color,
                  background: `${color}15`,
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                {scoreGrade(ms.scores.total)}
              </span>
            </div>

            {/* Big score */}
            <div
              className="text-2xl font-bold mb-2"
              style={{
                color,
                fontFamily: "'Space Mono', monospace",
                textShadow: active ? scoreGlow(ms.scores.total) : `0 0 6px ${color}30`,
                lineHeight: 1,
              }}
            >
              {ms.scores.total.toFixed(1)}
            </div>

            {/* Mini bars */}
            <div className="flex flex-col gap-0.5">
              {subScores.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center gap-1 h-1"
                  style={{ opacity: 0.7 }}
                >
                  <MiniBar value={s.val} color={scoreColor(s.val)} />
                </div>
              ))}
            </div>

            {/* Hover scanline */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-sm overflow-hidden"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 229, 255, 0.03) 2px, rgba(0, 229, 255, 0.03) 4px)",
              }}
            />

            {/* Active indicator */}
            {active && (
              <div
                className="absolute bottom-0 left-2 right-2 h-0.5"
                style={{
                  background: color,
                  boxShadow: `0 0 6px ${color}80`,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function RankingTable({
  month,
  selectedCity,
  onSelectCity,
}: {
  month: number;
  selectedCity: string;
  onSelectCity: (id: string) => void;
}) {
  const ranked = useMemo(() => {
    const scores = getScoresForMonth(month);
    return scores
      .map((ms) => ({
        ...ms,
        city: cities.find((c) => c.id === ms.cityId)!,
      }))
      .sort((a, b) => b.scores.total - a.scores.total);
  }, [month]);

  return (
    <div className="space-y-1">
      {ranked.map((item, idx) => {
        const active = item.cityId === selectedCity;
        const color = scoreColor(item.scores.total);
        const rank = idx + 1;
        const isTop3 = rank <= 3;
        const accentColor = rank === 1 ? "#00E5FF" : rank === 2 ? "#ADFF2F" : rank === 3 ? "#FFB800" : "#64748B";

        return (
          <button
            key={item.cityId}
            onClick={() => onSelectCity(item.cityId)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all cursor-pointer group relative"
            style={{
              background: active ? "#131A2E" : "#0D1220",
              border: `1px solid ${active ? `${color}60` : "#1E2A4A"}`,
              boxShadow: active ? `0 0 12px ${color}15` : "none",
              animationDelay: `${idx * 30}ms`,
            }}
          >
            {/* Rank */}
            <span
              className="text-sm font-bold w-6 text-right flex-shrink-0"
              style={{
                color: isTop3 ? accentColor : "#64748B",
                fontFamily: "'Space Mono', monospace",
                textShadow: isTop3 ? `0 0 8px ${accentColor}50` : "none",
              }}
            >
              {String(rank).padStart(2, "0")}
            </span>

            {/* Neon rank dot */}
            {isTop3 && (
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background: accentColor,
                  boxShadow: `0 0 6px ${accentColor}80`,
                }}
              />
            )}
            {!isTop3 && <span className="w-1.5 flex-shrink-0" />}

            {/* City info */}
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-sm font-medium truncate"
                  style={{
                    color: "#F0F4FF",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {item.city.nameKo}
                </span>
                <span
                  className="text-xs truncate"
                  style={{
                    color: "#64748B",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "10px",
                  }}
                >
                  {item.city.nameEn}
                </span>
              </div>
            </div>

            {/* Score bar visual */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0 w-32">
              <div
                className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ background: "#1E2A4A" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(item.scores.total / 10) * 100}%`,
                    background: `linear-gradient(90deg, ${color}60, ${color})`,
                    boxShadow: `0 0 4px ${color}40`,
                  }}
                />
              </div>
            </div>

            {/* Score */}
            <span
              className="text-sm font-bold flex-shrink-0"
              style={{
                color,
                fontFamily: "'Space Mono', monospace",
                textShadow: `0 0 6px ${color}40`,
              }}
            >
              {item.scores.total.toFixed(1)}
            </span>

            {/* Hover scanline */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-sm overflow-hidden"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 229, 255, 0.02) 2px, rgba(0, 229, 255, 0.02) 4px)",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

function DetailPanel({
  cityId,
  month,
  onClose,
}: {
  cityId: string;
  month: number;
  onClose: () => void;
}) {
  const city = cities.find((c) => c.id === cityId);
  const allScores = useMemo(() => getScoresForCity(cityId), [cityId]);
  const ms = allScores.find((s) => s.month === month);

  if (!city || !ms) return null;

  const highlights = generateHighlights(cityId, month, ms.scores);
  const color = scoreColor(ms.scores.total);

  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{
        background: "#0D1220",
        border: `1px solid ${color}40`,
        boxShadow: `0 0 20px ${color}15, inset 0 1px 0 ${color}20`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${color}20` }}
      >
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold"
                style={{
                  color: "#F0F4FF",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {city.nameKo}
              </span>
              <span
                className="text-xs"
                style={{
                  color: "#64748B",
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                {city.nameEn}
              </span>
            </div>
            <span
              className="text-xs"
              style={{ color: "#64748B", fontFamily: "'Outfit', sans-serif" }}
            >
              {city.country} · {MONTH_NAMES[month - 1]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div
              className="text-2xl font-bold"
              style={{
                color,
                fontFamily: "'Space Mono', monospace",
                textShadow: scoreGlow(ms.scores.total),
                lineHeight: 1,
              }}
            >
              {ms.scores.total.toFixed(1)}
            </div>
            <span
              className="text-xs"
              style={{
                color,
                fontFamily: "'Space Mono', monospace",
                fontSize: "9px",
              }}
            >
              {scoreGrade(ms.scores.total)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-sm transition-colors cursor-pointer"
            style={{
              color: "#64748B",
              border: "1px solid #1E2A4A",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#FF006E40";
              (e.currentTarget as HTMLElement).style.color = "#FF006E";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#1E2A4A";
              (e.currentTarget as HTMLElement).style.color = "#64748B";
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Sub-scores */}
        <div className="space-y-2">
          {(Object.keys(SCORE_LABELS) as (keyof typeof SCORE_LABELS)[]).map(
            (key) => (
              <ScoreBar
                key={key}
                label={SCORE_LABELS[key]}
                icon={SCORE_ICONS[key]}
                value={ms.scores[key]}
              />
            )
          )}
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {highlights.map((h, i) => {
              const tagColor =
                i === 0 ? "#00E5FF" : i === 1 ? "#ADFF2F" : "#FFB800";
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs"
                  style={{
                    background: `${tagColor}10`,
                    color: tagColor,
                    border: `1px solid ${tagColor}25`,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "11px",
                  }}
                >
                  <span
                    className="inline-block w-1 h-1 rounded-full"
                    style={{
                      background: tagColor,
                      boxShadow: `0 0 4px ${tagColor}80`,
                    }}
                  />
                  {h}
                </span>
              );
            })}
          </div>
        )}

        {/* 12-month sparkline */}
        <div
          className="pt-2"
          style={{ borderTop: "1px solid #1E2A4A" }}
        >
          <div
            className="text-xs mb-2"
            style={{ color: "#64748B", fontFamily: "'Outfit', sans-serif" }}
          >
            연간 종합 점수 추이
          </div>
          <div className="flex items-end gap-0.5 h-12">
            {allScores.map((s) => {
              const barColor = scoreColor(s.scores.total);
              const isActive = s.month === month;
              const height = `${(s.scores.total / 10) * 100}%`;
              return (
                <div
                  key={s.month}
                  className="flex-1 flex flex-col items-center gap-0.5"
                >
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-sm transition-all duration-500"
                      style={{
                        height,
                        background: isActive
                          ? barColor
                          : `${barColor}40`,
                        boxShadow: isActive
                          ? `0 0 6px ${barColor}60`
                          : "none",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "8px",
                      color: isActive ? barColor : "#64748B",
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    {s.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */

export default function V3Page() {
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [selectedCity, setSelectedCity] = useState("osaka");
  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date().getMonth() + 1
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetail, setShowDetail] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cityScoresMap = useMemo(() => {
    if (mode !== "where-to-when") return undefined;
    const scores = getScoresForCity(selectedCity);
    const map: Record<number, number> = {};
    scores.forEach((s) => {
      map[s.month] = s.scores.total;
    });
    return map;
  }, [selectedCity, mode]);

  const currentScore = useMemo(() => {
    const scores = getScoresForCity(
      mode === "where-to-when" ? selectedCity : selectedCity
    );
    return scores.find((s) => s.month === selectedMonth);
  }, [selectedCity, selectedMonth, mode]);

  const toggleMode = () => {
    setMode((m) =>
      m === "where-to-when" ? "when-to-where" : "where-to-when"
    );
    setShowDetail(false);
  };

  const handleSelectMonth = (m: number) => {
    setSelectedMonth(m);
    setShowDetail(true);
  };

  const handleSelectCity = (id: string) => {
    setSelectedCity(id);
    setShowDetail(true);
  };

  const city = cities.find((c) => c.id === selectedCity);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@400;500;600;700&display=swap');

        * {
          scrollbar-width: thin;
          scrollbar-color: #1E2A4A #0A0E1A;
        }
        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        *::-webkit-scrollbar-track {
          background: #0A0E1A;
        }
        *::-webkit-scrollbar-thumb {
          background: #1E2A4A;
          border-radius: 3px;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: #2A3A5A;
        }

        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadein {
          animation: fadeSlideIn 0.4s ease-out forwards;
        }
      `}</style>

      <div
        className="min-h-screen"
        style={{
          background: "#0A0E1A",
          color: "#F0F4FF",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        {/* Grid background */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30, 42, 74, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 42, 74, 0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.4,
          }}
        />

        {/* Content */}
        <div
          className="relative z-10 max-w-6xl mx-auto px-4 py-4 sm:py-6"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        >
          {/* Header */}
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <Logo />
            <div className="flex items-center gap-3">
              <ModeToggle mode={mode} onToggle={toggleMode} />
              <div
                className="hidden sm:flex items-center gap-1.5 text-xs px-2 py-1"
                style={{
                  color: "#64748B",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "10px",
                  border: "1px solid #1E2A4A",
                  borderRadius: "2px",
                  background: "#0D1220",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "#ADFF2F",
                    boxShadow: "0 0 4px #ADFF2F80",
                  }}
                />
                LIVE DATA
              </div>
            </div>
          </header>

          {/* Mode description line */}
          <div
            className="flex items-center gap-2 mb-4"
            style={{
              color: "#64748B",
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
            }}
          >
            <span style={{ color: "#00E5FF" }}>$</span>
            {mode === "where-to-when" ? (
              <span>
                도시를 선택하면 <span style={{ color: "#00E5FF" }}>최적의 여행 시기</span>를 분석합니다
              </span>
            ) : (
              <span>
                여행 시기를 선택하면 <span style={{ color: "#FF006E" }}>최적의 여행지</span>를 추천합니다
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
            {/* City selector (shown in both modes but prominent in where-to-when) */}
            <div
              className={
                mode === "where-to-when"
                  ? "lg:col-span-4"
                  : "lg:col-span-4 order-2 lg:order-1"
              }
            >
              <label
                className="block text-xs mb-1"
                style={{
                  color: "#64748B",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "10px",
                }}
              >
                {mode === "where-to-when" ? "[ TARGET CITY ]" : "[ FILTER CITY ]"}
              </label>
              <CitySearch
                query={searchQuery}
                onChange={setSearchQuery}
                selectedCity={selectedCity}
                onSelect={handleSelectCity}
              />
            </div>

            {/* Month strip */}
            <div
              className={
                mode === "where-to-when"
                  ? "lg:col-span-8"
                  : "lg:col-span-8 order-1 lg:order-2"
              }
            >
              <label
                className="block text-xs mb-1"
                style={{
                  color: "#64748B",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "10px",
                }}
              >
                {mode === "where-to-when" ? "[ MONTH OVERVIEW ]" : "[ TARGET MONTH ]"}
              </label>
              <MonthStrip
                selectedMonth={selectedMonth}
                onSelect={handleSelectMonth}
                scores={cityScoresMap}
              />
            </div>
          </div>

          {/* Status bar */}
          <div
            className="flex items-center justify-between mb-3 px-1"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "10px",
              color: "#64748B",
            }}
          >
            <div className="flex items-center gap-3">
              <span>
                MODE:{" "}
                <span
                  style={{
                    color:
                      mode === "where-to-when" ? "#00E5FF" : "#FF006E",
                  }}
                >
                  {mode === "where-to-when" ? "WHERE→WHEN" : "WHEN→WHERE"}
                </span>
              </span>
              {mode === "where-to-when" && city && (
                <span>
                  CITY:{" "}
                  <span style={{ color: "#F0F4FF" }}>
                    {city.nameEn.toUpperCase()}
                  </span>
                </span>
              )}
              {mode === "when-to-where" && (
                <span>
                  MONTH:{" "}
                  <span style={{ color: "#F0F4FF" }}>
                    {MONTH_NAMES[selectedMonth - 1]}
                  </span>
                </span>
              )}
            </div>
            <span>
              CITIES: <span style={{ color: "#F0F4FF" }}>{cities.length}</span>
            </span>
          </div>

          {/* Main content area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main panel */}
            <div
              className={`${showDetail && currentScore ? "lg:col-span-2" : "lg:col-span-3"} animate-fadein`}
            >
              {mode === "where-to-when" ? (
                <CalendarGrid
                  cityId={selectedCity}
                  selectedMonth={selectedMonth}
                  onSelectMonth={handleSelectMonth}
                />
              ) : (
                <RankingTable
                  month={selectedMonth}
                  selectedCity={selectedCity}
                  onSelectCity={handleSelectCity}
                />
              )}
            </div>

            {/* Detail panel */}
            {showDetail && currentScore && (
              <div className="lg:col-span-1 animate-fadein">
                <DetailPanel
                  cityId={
                    mode === "where-to-when"
                      ? selectedCity
                      : selectedCity
                  }
                  month={selectedMonth}
                  onClose={() => setShowDetail(false)}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <footer
            className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2"
            style={{ borderTop: "1px solid #1E2A4A" }}
          >
            <span
              style={{
                color: "#64748B",
                fontFamily: "'Space Mono', monospace",
                fontSize: "10px",
              }}
            >
              © 2026 whereorwhen — 여행 최적 시기 분석 시스템
            </span>
            <div
              className="flex items-center gap-3"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "10px",
                color: "#64748B",
              }}
            >
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-1 h-1 rounded-full"
                  style={{ background: "#00E5FF" }}
                />
                8.0+ 최적
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-1 h-1 rounded-full"
                  style={{ background: "#ADFF2F" }}
                />
                6.0+ 좋음
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-1 h-1 rounded-full"
                  style={{ background: "#FFB800" }}
                />
                4.0+ 보통
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-1 h-1 rounded-full"
                  style={{ background: "#FF006E" }}
                />
                4.0↓ 비추
              </span>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
