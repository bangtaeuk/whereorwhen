"use client";
import { useState, useMemo } from "react";
import { cities } from "@/data/cities";
import { getScoresForCity, getScoresForMonth } from "@/data/mock-scores";
import { generateHighlights } from "@/lib/highlights";
import type { AppMode, ScoreBreakdown } from "@/types";

// ── helpers ────────────────────────────────────────────
const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const SCORE_LABELS: Record<string, string> = {
  weather: "날씨",
  cost: "비용",
  crowd: "혼잡",
  buzz: "버즈",
};

function scoreColor(score: number) {
  if (score >= 8) return "#15803D";
  if (score >= 6) return "#1D4ED8";
  if (score >= 4) return "#B45309";
  return "#B91C1C";
}

function scoreBg(score: number) {
  if (score >= 8) return "rgba(21,128,61,0.08)";
  if (score >= 6) return "rgba(29,78,216,0.06)";
  if (score >= 4) return "rgba(180,83,9,0.06)";
  return "rgba(185,28,28,0.06)";
}

function gradeLabel(score: number) {
  if (score >= 8) return "최적";
  if (score >= 6) return "좋음";
  if (score >= 4) return "보통";
  return "비추천";
}

function flagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

// ── Sub-score bar ──────────────────────────────────────
function SubScoreBar({ label, value }: { label: string; value: number }) {
  const color = scoreColor(value);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-[#6B6B6B] shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[#E5E5E5] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value * 10}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-6 text-right font-medium" style={{ color }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ── Highlight tag ──────────────────────────────────────
function Tag({ text }: { text: string }) {
  return (
    <span className="inline-block px-2 py-0.5 text-[11px] rounded-full border border-[#E5E5E5] text-[#6B6B6B] whitespace-nowrap">
      {text}
    </span>
  );
}

// ── LARGE month card (top 3) ───────────────────────────
function LargeMonthCard({
  month,
  scores,
  highlights,
  rank,
}: {
  month: number;
  scores: ScoreBreakdown;
  highlights: string[];
  rank: number;
}) {
  const color = scoreColor(scores.total);
  return (
    <div
      className="col-span-2 row-span-2 p-6 bg-white rounded-xl border border-[#E5E5E5] flex flex-col gap-3 relative overflow-hidden transition-shadow hover:shadow-lg"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      {/* rank badge */}
      <div
        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {rank}
      </div>
      <span className="text-sm uppercase tracking-wider text-[#6B6B6B] font-medium">
        {MONTH_LABELS[month - 1]}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-bold leading-none" style={{ color }}>
          {scores.total.toFixed(1)}
        </span>
        <span className="text-sm font-medium" style={{ color }}>
          {gradeLabel(scores.total)}
        </span>
      </div>
      {/* Sub-scores */}
      <div className="flex flex-col gap-1.5 mt-1">
        {(["weather", "cost", "crowd", "buzz"] as const).map((key) => (
          <SubScoreBar key={key} label={SCORE_LABELS[key]} value={scores[key]} />
        ))}
      </div>
      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {highlights.map((h) => (
            <Tag key={h} text={h} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── MEDIUM month card ──────────────────────────────────
function MediumMonthCard({
  month,
  scores,
  highlights,
  onClick,
}: {
  month: number;
  scores: ScoreBreakdown;
  highlights: string[];
  onClick: () => void;
}) {
  const color = scoreColor(scores.total);
  return (
    <button
      onClick={onClick}
      className="col-span-1 p-4 bg-white rounded-xl border border-[#E5E5E5] text-left flex flex-col gap-2 transition-shadow hover:shadow-md cursor-pointer"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wider text-[#6B6B6B] font-medium">
          {MONTH_LABELS[month - 1]}
        </span>
        <span className="text-xs font-medium" style={{ color }}>
          {gradeLabel(scores.total)}
        </span>
      </div>
      <span className="text-2xl font-bold" style={{ color }}>
        {scores.total.toFixed(1)}
      </span>
      {/* mini bars */}
      <div className="flex flex-col gap-1">
        {(["weather", "cost", "crowd", "buzz"] as const).map((key) => (
          <SubScoreBar key={key} label={SCORE_LABELS[key]} value={scores[key]} />
        ))}
      </div>
      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto pt-1">
          {highlights.slice(0, 2).map((h) => (
            <Tag key={h} text={h} />
          ))}
        </div>
      )}
    </button>
  );
}

// ── SMALL month card ───────────────────────────────────
function SmallMonthCard({
  month,
  scores,
  onClick,
}: {
  month: number;
  scores: ScoreBreakdown;
  onClick: () => void;
}) {
  const color = scoreColor(scores.total);
  return (
    <button
      onClick={onClick}
      className="col-span-1 px-4 py-3 bg-white rounded-lg border border-[#E5E5E5] flex items-center justify-between transition-shadow hover:shadow-sm cursor-pointer"
    >
      <span className="text-sm text-[#6B6B6B]">{MONTH_LABELS[month - 1]}</span>
      <span className="text-sm font-bold" style={{ color }}>
        {scores.total.toFixed(1)}
      </span>
    </button>
  );
}

// ── Detail expansion panel ─────────────────────────────
function DetailPanel({
  month,
  scores,
  highlights,
  onClose,
}: {
  month: number;
  scores: ScoreBreakdown;
  highlights: string[];
  onClose: () => void;
}) {
  const color = scoreColor(scores.total);
  return (
    <div
      className="col-span-1 sm:col-span-2 p-5 rounded-xl border-2 animate-in fade-in slide-in-from-top-2"
      style={{
        borderColor: color,
        backgroundColor: scoreBg(scores.total),
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-sm uppercase tracking-wider text-[#6B6B6B] font-medium">
            {MONTH_LABELS[month - 1]}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold" style={{ color }}>
              {scores.total.toFixed(1)}
            </span>
            <span className="text-sm font-medium" style={{ color }}>
              {gradeLabel(scores.total)}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#6B6B6B] hover:text-[#1A1A1A] text-lg leading-none p-1"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-col gap-1.5 mb-3">
        {(["weather", "cost", "crowd", "buzz"] as const).map((key) => (
          <SubScoreBar key={key} label={SCORE_LABELS[key]} value={scores[key]} />
        ))}
      </div>
      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {highlights.map((h) => (
            <Tag key={h} text={h} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Mode A: City → Month (Magazine Calendar) ───────────
function CityCalendar({
  cityId,
  expandedMonth,
  setExpandedMonth,
}: {
  cityId: string;
  expandedMonth: number | null;
  setExpandedMonth: (m: number | null) => void;
}) {
  const data = useMemo(() => {
    const raw = getScoresForCity(cityId);
    const withHighlights = raw.map((ms) => ({
      ...ms,
      highlights: generateHighlights(ms.cityId, ms.month, ms.scores),
    }));
    // sort by total descending
    return withHighlights.sort((a, b) => b.scores.total - a.scores.total);
  }, [cityId]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-auto">
      {data.map((item, idx) => {
        const isTop3 = idx < 3;
        const isMedium = !isTop3 && item.scores.total >= 6;

        if (isTop3) {
          return (
            <LargeMonthCard
              key={item.month}
              month={item.month}
              scores={item.scores}
              highlights={item.highlights}
              rank={idx + 1}
            />
          );
        }

        // show detail panel if expanded
        if (expandedMonth === item.month) {
          return (
            <DetailPanel
              key={`detail-${item.month}`}
              month={item.month}
              scores={item.scores}
              highlights={item.highlights}
              onClose={() => setExpandedMonth(null)}
            />
          );
        }

        if (isMedium) {
          return (
            <MediumMonthCard
              key={item.month}
              month={item.month}
              scores={item.scores}
              highlights={item.highlights}
              onClick={() =>
                setExpandedMonth(expandedMonth === item.month ? null : item.month)
              }
            />
          );
        }

        return (
          <SmallMonthCard
            key={item.month}
            month={item.month}
            scores={item.scores}
            onClick={() =>
              setExpandedMonth(expandedMonth === item.month ? null : item.month)
            }
          />
        );
      })}
    </div>
  );
}

// ── Mode B: Month → City ranking (Magazine Ranking) ────
function MonthRanking({ month }: { month: number }) {
  const data = useMemo(() => {
    const raw = getScoresForMonth(month);
    return raw
      .map((ms) => {
        const city = cities.find((c) => c.id === ms.cityId);
        return {
          ...ms,
          city,
          highlights: generateHighlights(ms.cityId, ms.month, ms.scores),
        };
      })
      .sort((a, b) => b.scores.total - a.scores.total);
  }, [month]);

  const top3 = data.slice(0, 3);
  const mid = data.slice(3, 10);
  const rest = data.slice(10);

  return (
    <div className="space-y-6">
      {/* HERO — top 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {top3.map((item, idx) => {
          const color = scoreColor(item.scores.total);
          return (
            <div
              key={item.cityId}
              className="relative p-6 bg-white rounded-xl border border-[#E5E5E5] flex flex-col gap-3 transition-shadow hover:shadow-lg"
              style={{ borderLeftWidth: 4, borderLeftColor: color }}
            >
              <div
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {idx + 1}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {item.city ? flagEmoji(item.city.countryCode) : "🌍"}
                </span>
                <div>
                  <p className="text-lg font-bold text-[#1A1A1A]">
                    {item.city?.nameKo ?? item.cityId}
                  </p>
                  <p className="text-xs text-[#6B6B6B]">
                    {item.city?.nameEn} · {item.city?.country}
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold leading-none" style={{ color }}>
                  {item.scores.total.toFixed(1)}
                </span>
                <span className="text-sm font-medium" style={{ color }}>
                  {gradeLabel(item.scores.total)}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {(["weather", "cost", "crowd", "buzz"] as const).map((key) => (
                  <SubScoreBar
                    key={key}
                    label={SCORE_LABELS[key]}
                    value={item.scores[key]}
                  />
                ))}
              </div>
              {item.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                  {item.highlights.map((h) => (
                    <Tag key={h} text={h} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MID — ranks 4-10 */}
      {mid.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mid.map((item, idx) => {
            const color = scoreColor(item.scores.total);
            return (
              <div
                key={item.cityId}
                className="p-4 bg-white rounded-xl border border-[#E5E5E5] flex items-center gap-4 transition-shadow hover:shadow-md"
                style={{ borderLeftWidth: 3, borderLeftColor: color }}
              >
                <span className="text-sm font-bold text-[#6B6B6B] w-5 text-center shrink-0">
                  {idx + 4}
                </span>
                <span className="text-xl shrink-0">
                  {item.city ? flagEmoji(item.city.countryCode) : "🌍"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A1A1A] truncate">
                    {item.city?.nameKo ?? item.cityId}
                  </p>
                  <p className="text-xs text-[#6B6B6B] truncate">
                    {item.city?.nameEn} · {item.city?.country}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold" style={{ color }}>
                    {item.scores.total.toFixed(1)}
                  </p>
                  <p className="text-[11px] font-medium" style={{ color }}>
                    {gradeLabel(item.scores.total)}
                  </p>
                </div>
                {item.highlights.length > 0 && (
                  <div className="hidden sm:flex flex-col gap-1 shrink-0">
                    {item.highlights.slice(0, 2).map((h) => (
                      <Tag key={h} text={h} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* BOTTOM — ranks 11-20 */}
      {rest.length > 0 && (
        <div className="border border-[#E5E5E5] rounded-xl overflow-hidden divide-y divide-[#E5E5E5]">
          {rest.map((item, idx) => {
            const color = scoreColor(item.scores.total);
            return (
              <div
                key={item.cityId}
                className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <span className="text-xs text-[#6B6B6B] w-5 text-center shrink-0">
                  {idx + 11}
                </span>
                <span className="text-base shrink-0">
                  {item.city ? flagEmoji(item.city.countryCode) : "🌍"}
                </span>
                <span className="flex-1 text-sm text-[#1A1A1A] truncate">
                  {item.city?.nameKo ?? item.cityId}
                </span>
                <span className="text-sm font-bold shrink-0" style={{ color }}>
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

// ── Empty state ────────────────────────────────────────
function EmptyState({ onSelect }: { onSelect: (id: string) => void }) {
  const suggestions = useMemo(() => {
    const shuffled = [...cities].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <p className="text-4xl sm:text-5xl font-bold text-[#1A1A1A] mb-2">
        어디로 떠날까요?
      </p>
      <p className="text-[#6B6B6B] mb-10">도시를 선택하면 월별 여행 점수를 볼 수 있어요</p>
      <div className="flex flex-wrap justify-center gap-2 max-w-md">
        {suggestions.map((city, i) => (
          <button
            key={city.id}
            onClick={() => onSelect(city.id)}
            className="px-4 py-2 rounded-full border border-[#E5E5E5] text-sm text-[#1A1A1A] hover:border-[#1A1A1A] hover:shadow-sm transition-all"
            style={{
              transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (Math.random() * 2 + 0.5)}deg)`,
            }}
          >
            {flagEmoji(city.countryCode)} {city.nameKo}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function V12Page() {
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [citySearch, setCitySearch] = useState("");

  const filteredCities = useMemo(
    () =>
      citySearch.trim()
        ? cities.filter(
            (c) =>
              c.nameKo.includes(citySearch) ||
              c.nameEn.toLowerCase().includes(citySearch.toLowerCase())
          )
        : cities,
    [citySearch]
  );

  const selectedCityObj = cities.find((c) => c.id === selectedCity);

  return (
    <div className="min-h-screen bg-[#FFF]">
      {/* Header */}
      <header className="border-b border-[#E5E5E5] bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
            where<span className="text-[#6B6B6B] font-normal">or</span>when
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Mode Toggle — underline tabs */}
        <div className="flex gap-6 border-b border-[#E5E5E5]">
          <button
            onClick={() => setMode("where-to-when")}
            className={`pb-2 text-sm font-medium transition-colors relative ${
              mode === "where-to-when"
                ? "text-[#1A1A1A]"
                : "text-[#6B6B6B] hover:text-[#1A1A1A]"
            }`}
          >
            도시 → 언제?
            {mode === "where-to-when" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setMode("when-to-where")}
            className={`pb-2 text-sm font-medium transition-colors relative ${
              mode === "when-to-where"
                ? "text-[#1A1A1A]"
                : "text-[#6B6B6B] hover:text-[#1A1A1A]"
            }`}
          >
            월 → 어디?
            {mode === "when-to-where" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A] rounded-full" />
            )}
          </button>
        </div>

        {/* Mode A: City → Month */}
        {mode === "where-to-when" && (
          <>
            {/* City selector */}
            <div className="relative">
              <input
                type="text"
                placeholder="도시 검색 (예: 오사카, Tokyo)"
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setSelectedCity("");
                  setExpandedMonth(null);
                }}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm text-[#1A1A1A] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#1A1A1A] transition-colors bg-white"
              />
              {citySearch && !selectedCity && filteredCities.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredCities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => {
                        setSelectedCity(city.id);
                        setCitySearch(`${city.nameKo} (${city.nameEn})`);
                        setExpandedMonth(null);
                      }}
                      className="w-full px-4 py-2.5 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm"
                    >
                      <span>{flagEmoji(city.countryCode)}</span>
                      <span className="text-[#1A1A1A] font-medium">{city.nameKo}</span>
                      <span className="text-[#6B6B6B]">{city.nameEn}</span>
                      <span className="text-xs text-[#6B6B6B] ml-auto">{city.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* City header */}
            {selectedCityObj && (
              <div className="flex items-center gap-3">
                <span className="text-3xl">{flagEmoji(selectedCityObj.countryCode)}</span>
                <div>
                  <h2 className="text-2xl font-bold text-[#1A1A1A]">
                    {selectedCityObj.nameKo}
                  </h2>
                  <p className="text-sm text-[#6B6B6B]">
                    {selectedCityObj.nameEn} · {selectedCityObj.country}
                  </p>
                </div>
              </div>
            )}

            {/* Calendar or Empty */}
            {selectedCity ? (
              <CityCalendar
                cityId={selectedCity}
                expandedMonth={expandedMonth}
                setExpandedMonth={setExpandedMonth}
              />
            ) : (
              !citySearch && (
                <EmptyState
                  onSelect={(id) => {
                    setSelectedCity(id);
                    const c = cities.find((x) => x.id === id);
                    if (c) setCitySearch(`${c.nameKo} (${c.nameEn})`);
                  }}
                />
              )
            )}
          </>
        )}

        {/* Mode B: Month → City */}
        {mode === "when-to-where" && (
          <>
            {/* Month pills */}
            <div className="flex flex-wrap gap-2">
              {MONTH_LABELS.map((label, idx) => {
                const m = idx + 1;
                const isActive = selectedMonth === m;
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#1A1A1A] text-white"
                        : "bg-white border border-[#E5E5E5] text-[#6B6B6B] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Month header */}
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">
                {MONTH_LABELS[selectedMonth - 1]} 여행지 랭킹
              </h2>
              <p className="text-sm text-[#6B6B6B] mt-0.5">
                전체 20개 도시의 종합 점수 순위
              </p>
            </div>

            <MonthRanking month={selectedMonth} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E5] mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-[#6B6B6B]">
          © 2026 whereorwhen — 여행의 최적 타이밍을 찾아드립니다
        </div>
      </footer>
    </div>
  );
}
