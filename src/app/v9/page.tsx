"use client";
import { useState, useMemo } from "react";
import { cities } from "@/data/cities";
import { getScoresForCity, getScoresForMonth } from "@/data/mock-scores";
import { generateHighlights } from "@/lib/highlights";
import type { AppMode, ScoreBreakdown } from "@/types";

/* ─── constants ─── */
const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const SCORE_LABELS: Record<keyof Omit<ScoreBreakdown, "total">, string> = {
  weather: "날씨",
  cost: "비용",
  crowd: "혼잡도",
  buzz: "버즈",
};

/* ─── green shade helpers ─── */
function greenForScore(score: number): string {
  if (score >= 8) return "#059669";
  if (score >= 6) return "#10B981";
  if (score >= 4) return "#6EE7B7";
  return "#D1FAE5";
}

function greenBg(score: number): string {
  if (score >= 8) return "rgba(5,150,105,0.12)";
  if (score >= 6) return "rgba(16,185,129,0.08)";
  if (score >= 4) return "rgba(110,231,183,0.06)";
  return "rgba(209,250,229,0.04)";
}

/* ─── Logo ─── */
function Logo() {
  return (
    <span className="text-xl font-bold tracking-tight select-none">
      <span className="text-black">where</span>
      <span style={{ color: "#059669" }}>or</span>
      <span className="text-black">when</span>
    </span>
  );
}

/* ─── Empty state ─── */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "#059669" }}
      >
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
          />
        </svg>
      </div>
      <p className="text-sm text-[#777]">{message}</p>
    </div>
  );
}

/* ─── Score number ─── */
function ScoreNum({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const cls =
    size === "lg"
      ? "text-2xl font-bold"
      : size === "md"
        ? "text-lg font-semibold"
        : "text-sm font-medium";
  return (
    <span className={cls} style={{ color: greenForScore(score) }}>
      {score.toFixed(1)}
    </span>
  );
}

/* ─── Progress bar ─── */
function GreenBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-[#F0F0F0]">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${pct}%`,
          backgroundColor: greenForScore(value),
        }}
      />
    </div>
  );
}

/* ─── Highlight tag ─── */
function Tag({ text }: { text: string }) {
  return (
    <span
      className="inline-block text-xs px-2 py-0.5 rounded-full border"
      style={{ color: "#059669", borderColor: "#059669" }}
    >
      {text}
    </span>
  );
}

/* ─── Detail panel ─── */
function DetailPanel({
  cityName,
  month,
  scores,
  highlights,
  onClose,
}: {
  cityName: string;
  month: string;
  scores: ScoreBreakdown;
  highlights: string[];
  onClose: () => void;
}) {
  return (
    <div className="border border-[#E0E0E0] rounded-xl bg-white p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">
            {cityName} · {month}
          </h3>
          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {highlights.map((h) => (
                <Tag key={h} text={h} />
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#BBB] hover:text-black hover:bg-[#F5F5F5] transition-colors"
          aria-label="닫기"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* total */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#777]">종합 점수</span>
        <ScoreNum score={scores.total} size="lg" />
      </div>

      {/* breakdown */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {(Object.keys(SCORE_LABELS) as (keyof typeof SCORE_LABELS)[]).map(
          (key) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#777]">
                  {SCORE_LABELS[key]}
                </span>
                <ScoreNum score={scores[key]} size="sm" />
              </div>
              <GreenBar value={scores[key]} />
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MODE 1 — "도시 → 월" (where-to-when)
   ═══════════════════════════════════════════════════════════ */
function WhereToWhen() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const cityScores = useMemo(
    () => (selectedCity ? getScoresForCity(selectedCity) : []),
    [selectedCity]
  );

  const bestMonth = useMemo(() => {
    if (cityScores.length === 0) return -1;
    return cityScores.reduce((best, cur) =>
      cur.scores.total > best.scores.total ? cur : best
    ).month;
  }, [cityScores]);

  const city = cities.find((c) => c.id === selectedCity);
  const detail = cityScores.find((s) => s.month === selectedMonth);

  return (
    <div className="space-y-8">
      {/* city selector */}
      <div>
        <label className="block text-xs text-[#777] mb-2 uppercase tracking-widest">
          도시 선택
        </label>
        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCity(c.id);
                setSelectedMonth(null);
              }}
              className={`px-3 py-1.5 text-sm rounded-full border transition-all duration-150 ${
                selectedCity === c.id
                  ? "bg-black text-white border-black"
                  : "border-[#E0E0E0] text-[#777] hover:border-black hover:text-black"
              }`}
            >
              {c.nameKo}
            </button>
          ))}
        </div>
      </div>

      {!selectedCity && (
        <EmptyState message="도시를 선택하면 월별 점수를 확인할 수 있습니다" />
      )}

      {selectedCity && cityScores.length > 0 && (
        <>
          {/* calendar grid */}
          <div>
            <label className="block text-xs text-[#777] mb-3 uppercase tracking-widest">
              월별 점수
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {cityScores.map((ms) => {
                const isBest = ms.month === bestMonth;
                const isSelected = ms.month === selectedMonth;
                const green = greenForScore(ms.scores.total);

                return (
                  <button
                    key={ms.month}
                    onClick={() =>
                      setSelectedMonth(
                        selectedMonth === ms.month ? null : ms.month
                      )
                    }
                    className={`relative rounded-lg text-left transition-all duration-150 ${
                      isSelected
                        ? "ring-2 ring-black"
                        : "hover:shadow-md"
                    } ${
                      isBest
                        ? "text-white"
                        : "bg-white"
                    }`}
                    style={
                      isBest
                        ? { backgroundColor: "#059669" }
                        : {
                            borderLeft: `3px solid ${green}`,
                            border: `1px solid #E0E0E0`,
                            borderLeftWidth: "3px",
                            borderLeftColor: green,
                          }
                    }
                  >
                    <div className="p-3">
                      <div
                        className={`text-xs mb-1 ${
                          isBest ? "text-white/80" : "text-[#777]"
                        }`}
                      >
                        {MONTH_LABELS[ms.month - 1]}
                      </div>
                      <div
                        className={`text-lg font-semibold ${
                          isBest ? "text-white" : ""
                        }`}
                        style={isBest ? {} : { color: green }}
                      >
                        {ms.scores.total.toFixed(1)}
                      </div>
                      {isBest && (
                        <div className="text-[10px] mt-1 text-white/90 font-medium">
                          BEST
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* detail */}
          {detail && city && (
            <DetailPanel
              cityName={city.nameKo}
              month={MONTH_LABELS[detail.month - 1]}
              scores={detail.scores}
              highlights={generateHighlights(
                city.id,
                detail.month,
                detail.scores
              )}
              onClose={() => setSelectedMonth(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MODE 2 — "월 → 도시" (when-to-where)
   ═══════════════════════════════════════════════════════════ */
function WhenToWhere() {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  const monthScores = useMemo(() => {
    if (!selectedMonth) return [];
    return getScoresForMonth(selectedMonth)
      .sort((a, b) => b.scores.total - a.scores.total);
  }, [selectedMonth]);

  const selectedDetail = monthScores.find(
    (ms) => ms.cityId === selectedCityId
  );
  const selectedCity = cities.find((c) => c.id === selectedCityId);

  return (
    <div className="space-y-8">
      {/* month selector */}
      <div>
        <label className="block text-xs text-[#777] mb-2 uppercase tracking-widest">
          월 선택
        </label>
        <div className="flex flex-wrap gap-2">
          {MONTH_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedMonth(i + 1);
                setSelectedCityId(null);
              }}
              className={`px-3 py-1.5 text-sm rounded-full border transition-all duration-150 ${
                selectedMonth === i + 1
                  ? "bg-black text-white border-black"
                  : "border-[#E0E0E0] text-[#777] hover:border-black hover:text-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!selectedMonth && (
        <EmptyState message="월을 선택하면 추천 여행지를 확인할 수 있습니다" />
      )}

      {selectedMonth && monthScores.length > 0 && (
        <>
          {/* ranking list */}
          <div>
            <label className="block text-xs text-[#777] mb-3 uppercase tracking-widest">
              {MONTH_LABELS[selectedMonth - 1]} 추천 여행지
            </label>
            <div className="space-y-2">
              {monthScores.map((ms, idx) => {
                const city = cities.find((c) => c.id === ms.cityId)!;
                const isTop3 = idx < 3;
                const isSelected = ms.cityId === selectedCityId;
                const barHeight = Math.round(
                  (ms.scores.total / 10) * 100
                );

                return (
                  <button
                    key={ms.cityId}
                    onClick={() =>
                      setSelectedCityId(
                        selectedCityId === ms.cityId ? null : ms.cityId
                      )
                    }
                    className={`w-full flex items-center gap-4 p-3 rounded-lg border transition-all duration-150 text-left ${
                      isSelected
                        ? "ring-2 ring-black border-[#E0E0E0]"
                        : "border-[#E0E0E0] hover:shadow-md"
                    }`}
                    style={{ backgroundColor: isSelected ? greenBg(ms.scores.total) : "white" }}
                  >
                    {/* vertical green bar */}
                    <div className="w-1 h-10 rounded-full bg-[#F0F0F0] flex-shrink-0 relative overflow-hidden">
                      <div
                        className="absolute bottom-0 w-full rounded-full transition-all duration-300"
                        style={{
                          height: `${barHeight}%`,
                          backgroundColor: greenForScore(ms.scores.total),
                        }}
                      />
                    </div>

                    {/* rank */}
                    {isTop3 ? (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: "#059669" }}
                      >
                        {idx + 1}
                      </div>
                    ) : (
                      <div className="w-7 h-7 flex items-center justify-center text-xs text-[#BBB] flex-shrink-0">
                        {idx + 1}
                      </div>
                    )}

                    {/* city name */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-black truncate">
                        {city.nameKo}
                      </div>
                      <div className="text-xs text-[#BBB]">
                        {city.nameEn} · {city.country}
                      </div>
                    </div>

                    {/* score */}
                    <ScoreNum score={ms.scores.total} size="md" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* detail */}
          {selectedDetail && selectedCity && (
            <DetailPanel
              cityName={selectedCity.nameKo}
              month={MONTH_LABELS[selectedMonth - 1]}
              scores={selectedDetail.scores}
              highlights={generateHighlights(
                selectedCity.id,
                selectedMonth,
                selectedDetail.scores
              )}
              onClose={() => setSelectedCityId(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE ROOT
   ═══════════════════════════════════════════════════════════ */
export default function V9Page() {
  const [mode, setMode] = useState<AppMode>("where-to-when");

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
        {/* header */}
        <header className="text-center mb-12">
          <Logo />
          <h1 className="text-3xl font-semibold text-black mt-6 mb-2">
            최적의 여행 시기를 찾아보세요
          </h1>
          <p className="text-sm text-[#777]">
            20개 인기 여행지의 날씨 · 비용 · 혼잡도 · 버즈를 종합한 점수
          </p>
        </header>

        {/* mode toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-full border border-[#E0E0E0] p-0.5">
            <button
              onClick={() => setMode("where-to-when")}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                mode === "where-to-when"
                  ? "bg-black text-white"
                  : "text-[#777] hover:text-black"
              }`}
            >
              도시 → 최적 시기
            </button>
            <button
              onClick={() => setMode("when-to-where")}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                mode === "when-to-where"
                  ? "bg-black text-white"
                  : "text-[#777] hover:text-black"
              }`}
            >
              월 → 추천 여행지
            </button>
          </div>
        </div>

        {/* content */}
        {mode === "where-to-when" ? <WhereToWhen /> : <WhenToWhere />}

        {/* footer */}
        <footer className="mt-20 pt-6 border-t border-[#E0E0E0] text-center">
          <p className="text-xs text-[#BBB]">
            © 2025 whereorwhen — 데이터는 참고용이며, 실제 여행 계획 시 최신
            정보를 확인하세요.
          </p>
        </footer>
      </div>
    </div>
  );
}
