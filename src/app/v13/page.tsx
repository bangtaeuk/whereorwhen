"use client";
import { useState, useMemo } from "react";
import { cities } from "@/data/cities";
import { getScoresForCity, getScoresForMonth } from "@/data/mock-scores";
import { generateHighlights } from "@/lib/highlights";
import type { AppMode, ScoreBreakdown } from "@/types";

/* ─── 상수 ──────────────────────────────────────────── */
const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
] as const;

const POPULAR_CITY_IDS = [
  "osaka", "tokyo", "bangkok", "danang", "bali", "paris",
] as const;

const SCORE_LABELS: Record<keyof Omit<ScoreBreakdown, "total">, string> = {
  weather: "날씨",
  cost: "비용",
  crowd: "혼잡도",
  buzz: "버즈",
};

/* ─── 유틸 ──────────────────────────────────────────── */
function scoreColor(score: number): string {
  if (score >= 8) return "#059669";
  if (score >= 6) return "#2563EB";
  if (score >= 4) return "#D97706";
  return "#DC2626";
}

function scoreBg(score: number): string {
  if (score >= 8) return "rgba(5,150,105,0.08)";
  if (score >= 6) return "rgba(37,99,235,0.08)";
  if (score >= 4) return "rgba(217,119,6,0.08)";
  return "rgba(220,38,38,0.08)";
}

function gradeLabel(score: number): string {
  if (score >= 8) return "최적";
  if (score >= 6) return "좋음";
  if (score >= 4) return "보통";
  return "비추";
}

/* ─── 컴포넌트: 점수 뱃지 ───────────────────────────── */
function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 min-w-[32px]",
    md: "text-sm px-2 py-0.5 min-w-[40px]",
    lg: "text-base font-semibold px-3 py-1 min-w-[48px]",
  };
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md font-mono font-medium ${sizeClasses[size]}`}
      style={{ color: scoreColor(score), backgroundColor: scoreBg(score) }}
    >
      {score.toFixed(1)}
    </span>
  );
}

/* ─── 컴포넌트: 점수 바 ─────────────────────────────── */
function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-10 text-[#6B6B6B] shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.min(score * 10, 100)}%`,
            backgroundColor: scoreColor(score),
          }}
        />
      </div>
      <span className="text-xs font-mono w-7 text-right" style={{ color: scoreColor(score) }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

/* ─── 컴포넌트: 하이라이트 태그 ─────────────────────── */
function HighlightTag({ text }: { text: string }) {
  return (
    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[#6B6B6B] border border-[#E5E5E5]">
      {text}
    </span>
  );
}

/* ─── 메인 페이지 ───────────────────────────────────── */
export default function V13Page() {
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [selectedCityId, setSelectedCityId] = useState("osaka");
  const [selectedMonth, setSelectedMonth] = useState(3);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId)!,
    [selectedCityId]
  );

  /* 도시별: 12개월 점수 */
  const cityMonthlyScores = useMemo(
    () => getScoresForCity(selectedCityId),
    [selectedCityId]
  );

  /* 월별: 전체 도시 점수 (total 내림차순) */
  const monthCityScores = useMemo(
    () =>
      getScoresForMonth(selectedMonth).sort(
        (a, b) => b.scores.total - a.scores.total
      ),
    [selectedMonth]
  );

  /* 도시별 최고 점수 월 */
  const bestMonth = useMemo(() => {
    const best = cityMonthlyScores.reduce((a, b) =>
      b.scores.total > a.scores.total ? b : a
    );
    return best;
  }, [cityMonthlyScores]);

  /* 도시별 평균 점수 */
  const avgScore = useMemo(() => {
    const sum = cityMonthlyScores.reduce((s, m) => s + m.scores.total, 0);
    return sum / cityMonthlyScores.length;
  }, [cityMonthlyScores]);

  const isWhereMode = mode === "where-to-when";

  /* ─── 좌측 패널 ──────────────────────────────────── */
  const leftPanel = (
    <div className="flex flex-col h-full">
      {/* 로고 */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-baseline gap-1.5">
          <h1 className="text-lg font-bold tracking-tight text-[#1A1A1A]">
            where<span className="text-[#6B6B6B] font-normal">or</span>when
          </h1>
          <span className="text-[10px] text-[#6B6B6B] tracking-widest uppercase">v13</span>
        </div>
        <p className="text-[11px] text-[#6B6B6B] mt-0.5">여행지별 최적 시기 분석</p>
      </div>

      {/* 모드 토글 */}
      <div className="px-5 pb-4">
        <div className="flex rounded-lg bg-[#F0F0F0] p-0.5">
          <button
            onClick={() => setMode("where-to-when")}
            className={`flex-1 text-xs py-2 rounded-md transition-all duration-200 font-medium ${
              isWhereMode
                ? "bg-white text-[#1A1A1A] shadow-sm"
                : "text-[#6B6B6B] hover:text-[#1A1A1A]"
            }`}
          >
            도시 → 시기
          </button>
          <button
            onClick={() => setMode("when-to-where")}
            className={`flex-1 text-xs py-2 rounded-md transition-all duration-200 font-medium ${
              !isWhereMode
                ? "bg-white text-[#1A1A1A] shadow-sm"
                : "text-[#6B6B6B] hover:text-[#1A1A1A]"
            }`}
          >
            시기 → 도시
          </button>
        </div>
      </div>

      <div className="h-px bg-[#E5E5E5] mx-5" />

      {/* 셀렉터 */}
      <div className="px-5 py-4">
        {isWhereMode ? (
          <>
            <label className="text-[10px] uppercase tracking-widest text-[#6B6B6B] font-medium">
              도시 선택
            </label>
            <select
              value={selectedCityId}
              onChange={(e) => {
                setSelectedCityId(e.target.value);
                setExpandedItem(null);
              }}
              className="mt-1.5 w-full text-sm rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameKo} · {c.nameEn}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label className="text-[10px] uppercase tracking-widest text-[#6B6B6B] font-medium">
              월 선택
            </label>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {MONTH_NAMES.map((name, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedMonth(i + 1);
                    setExpandedItem(null);
                  }}
                  className={`text-xs py-2 rounded-md border transition-all duration-200 font-medium ${
                    selectedMonth === i + 1
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                      : "bg-white text-[#6B6B6B] border-[#E5E5E5] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 인기 도시 (도시→시기 모드) */}
      {isWhereMode && (
        <div className="px-5 pb-4">
          <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] font-medium mb-2">
            인기 도시
          </p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_CITY_IDS.map((id) => {
              const city = cities.find((c) => c.id === id)!;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setSelectedCityId(id);
                    setExpandedItem(null);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all duration-200 ${
                    selectedCityId === id
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                      : "bg-white text-[#6B6B6B] border-[#E5E5E5] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                  }`}
                >
                  {city.nameKo}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="h-px bg-[#E5E5E5] mx-5" />

      {/* 현재 선택 요약 */}
      <div className="px-5 py-4 flex-1">
        {isWhereMode ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">{selectedCity.nameKo}</p>
                <p className="text-[11px] text-[#6B6B6B]">
                  {selectedCity.country} · {selectedCity.nameEn}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#6B6B6B]">최적 시기</p>
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  {MONTH_NAMES[bestMonth.month - 1]}
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#6B6B6B]">최고 점수</span>
                <ScoreBadge score={bestMonth.scores.total} size="sm" />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#6B6B6B]">연평균</span>
                <ScoreBadge score={avgScore} size="sm" />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">
              {MONTH_NAMES[selectedMonth - 1]} 여행
            </p>
            <p className="text-[11px] text-[#6B6B6B] mt-0.5">
              {monthCityScores.length}개 도시 비교
            </p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#6B6B6B]">1위</span>
                <span className="text-[#1A1A1A] font-medium">
                  {cities.find((c) => c.id === monthCityScores[0]?.cityId)?.nameKo ?? "-"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#6B6B6B]">최고 점수</span>
                <ScoreBadge score={monthCityScores[0]?.scores.total ?? 0} size="sm" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="px-5 py-3 border-t border-[#E5E5E5]">
        <p className="text-[10px] text-[#6B6B6B] text-center">
          © 2025 whereorwhen · 데이터 기준 2024
        </p>
      </div>
    </div>
  );

  /* ─── 우측 패널: 캘린더 (도시→시기) ────────────────── */
  const calendarGrid = (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#1A1A1A]">{selectedCity.nameKo}</h2>
          <span className="text-sm text-[#6B6B6B]">{selectedCity.nameEn}</span>
        </div>
        <p className="text-sm text-[#6B6B6B] mt-1">
          {selectedCity.country} · 월별 종합 점수 분석
        </p>
      </div>

      {/* 3×4 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {cityMonthlyScores.map((ms) => {
          const highlights = generateHighlights(ms.cityId, ms.month, ms.scores);
          const isExpanded = expandedItem === `month-${ms.month}`;
          const isBest = ms.month === bestMonth.month;

          return (
            <div
              key={ms.month}
              onClick={() =>
                setExpandedItem(isExpanded ? null : `month-${ms.month}`)
              }
              className={`group relative rounded-xl border bg-white p-4 cursor-pointer transition-all duration-200 ${
                isBest
                  ? "border-[#1A1A1A] ring-1 ring-[#1A1A1A]/5"
                  : "border-[#E5E5E5] hover:border-[#C0C0C0]"
              } ${isExpanded ? "col-span-2 sm:col-span-3 lg:col-span-3 xl:col-span-4" : ""}`}
            >
              {isBest && (
                <div className="absolute -top-2.5 left-3 text-[10px] bg-[#1A1A1A] text-white px-2 py-0.5 rounded-full font-medium">
                  BEST
                </div>
              )}

              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">
                    {MONTH_NAMES[ms.month - 1]}
                  </p>
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                    {gradeLabel(ms.scores.total)}
                  </p>
                </div>
                <ScoreBadge score={ms.scores.total} size="lg" />
              </div>

              {/* 하이라이트 */}
              {highlights.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {highlights.map((h, i) => (
                    <HighlightTag key={i} text={h} />
                  ))}
                </div>
              )}

              {/* 미니 바 (축소 상태) */}
              {!isExpanded && (
                <div className="space-y-1 mt-2">
                  {(
                    Object.entries(SCORE_LABELS) as [
                      keyof typeof SCORE_LABELS,
                      string,
                    ][]
                  ).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className="text-[9px] w-6 text-[#6B6B6B]">{label}</span>
                      <div className="flex-1 h-1 rounded-full bg-[#F0F0F0] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(ms.scores[key] * 10, 100)}%`,
                            backgroundColor: scoreColor(ms.scores[key]),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 확장 상세 */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                    {(
                      Object.entries(SCORE_LABELS) as [
                        keyof typeof SCORE_LABELS,
                        string,
                      ][]
                    ).map(([key, label]) => (
                      <ScoreBar key={key} label={label} score={ms.scores[key]} />
                    ))}
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-4">
                    종합 {ms.scores.total.toFixed(1)}점 ·{" "}
                    {gradeLabel(ms.scores.total)} ·{" "}
                    {selectedCity.nameKo} {MONTH_NAMES[ms.month - 1]} 여행
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ─── 우측 패널: 랭킹 리스트 (시기→도시) ────────────── */
  const rankingList = (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#1A1A1A]">
          {MONTH_NAMES[selectedMonth - 1]} 추천 여행지
        </h2>
        <p className="text-sm text-[#6B6B6B] mt-1">
          종합 점수 기준 · {monthCityScores.length}개 도시
        </p>
      </div>

      {/* 리스트 */}
      <div className="space-y-2">
        {monthCityScores.map((ms, index) => {
          const city = cities.find((c) => c.id === ms.cityId)!;
          const highlights = generateHighlights(ms.cityId, selectedMonth, ms.scores);
          const isExpanded = expandedItem === `city-${ms.cityId}`;

          return (
            <div
              key={ms.cityId}
              onClick={() =>
                setExpandedItem(isExpanded ? null : `city-${ms.cityId}`)
              }
              className={`rounded-xl border bg-white p-4 cursor-pointer transition-all duration-200 ${
                index === 0
                  ? "border-[#1A1A1A] ring-1 ring-[#1A1A1A]/5"
                  : "border-[#E5E5E5] hover:border-[#C0C0C0]"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* 순위 */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                    index === 0
                      ? "bg-[#1A1A1A] text-white"
                      : index < 3
                        ? "bg-[#F0F0F0] text-[#1A1A1A]"
                        : "bg-[#F8F8F8] text-[#6B6B6B]"
                  }`}
                >
                  {index + 1}
                </div>

                {/* 도시 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                      {city.nameKo}
                    </p>
                    <span className="text-[11px] text-[#6B6B6B] shrink-0">
                      {city.country}
                    </span>
                  </div>
                  {highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {highlights.map((h, i) => (
                        <HighlightTag key={i} text={h} />
                      ))}
                    </div>
                  )}
                </div>

                {/* 점수 */}
                <ScoreBadge score={ms.scores.total} size="lg" />
              </div>

              {/* 확장 상세 */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                    {(
                      Object.entries(SCORE_LABELS) as [
                        keyof typeof SCORE_LABELS,
                        string,
                      ][]
                    ).map(([key, label]) => (
                      <ScoreBar key={key} label={label} score={ms.scores[key]} />
                    ))}
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-4">
                    {city.nameEn} · {city.country} · 종합 {ms.scores.total.toFixed(1)}점
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ─── 레이아웃 ─────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Desktop: split layout */}
      <div className="flex flex-col lg:flex-row">
        {/* 좌측 패널 (사이드바) */}
        <aside className="w-full lg:w-[360px] lg:shrink-0 bg-[#FAFAFA] lg:h-screen lg:overflow-y-auto lg:sticky lg:top-0 border-b lg:border-b-0 lg:border-r border-[#E5E5E5]">
          {leftPanel}
        </aside>

        {/* 우측 패널 (데이터 뷰) */}
        <main className="flex-1 min-w-0 p-5 sm:p-8 lg:p-10">
          {isWhereMode ? calendarGrid : rankingList}
        </main>
      </div>
    </div>
  );
}
