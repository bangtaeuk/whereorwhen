"use client";
import { useState, useMemo } from "react";
import { cities } from "@/data/cities";
import { getScoresForCity, getScoresForMonth } from "@/data/mock-scores";
import { generateHighlights } from "@/lib/highlights";
import type { AppMode, ScoreBreakdown } from "@/types";

// ─── Constants ──────────────────────────────────────────
const MONTH_LABELS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

const MONTH_KO = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
] as const;

const SCORE_LABELS: Record<string, string> = {
  weather: "날씨",
  cost: "비용",
  crowd: "혼잡도",
  buzz: "버즈",
};

function scoreColor(score: number): string {
  if (score >= 8) return "#22C55E";
  if (score >= 6) return "#3B82F6";
  if (score >= 4) return "#EAB308";
  return "#EF4444";
}

// ─── Component ──────────────────────────────────────────
export default function V6Page() {
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Derived data ──
  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId) ?? null,
    [selectedCityId]
  );

  const cityMonthlyScores = useMemo(
    () => (selectedCityId ? getScoresForCity(selectedCityId) : []),
    [selectedCityId]
  );

  const monthCityScores = useMemo(
    () => getScoresForMonth(selectedMonth),
    [selectedMonth]
  );

  const bestMonthIdx = useMemo(() => {
    if (cityMonthlyScores.length === 0) return -1;
    let best = 0;
    for (let i = 1; i < cityMonthlyScores.length; i++) {
      if (cityMonthlyScores[i].scores.total > cityMonthlyScores[best].scores.total) {
        best = i;
      }
    }
    return cityMonthlyScores[best].month;
  }, [cityMonthlyScores]);

  const ranking = useMemo(() => {
    return [...monthCityScores]
      .sort((a, b) => b.scores.total - a.scores.total)
      .map((ms) => ({
        ...ms,
        city: cities.find((c) => c.id === ms.cityId)!,
      }));
  }, [monthCityScores]);

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return cities;
    const q = searchQuery.trim().toLowerCase();
    return cities.filter(
      (c) =>
        c.nameKo.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.country.includes(q)
    );
  }, [searchQuery]);

  // ── Highlights for detail panel ──
  const detailData = useMemo(() => {
    if (mode === "where-to-when" && selectedCityId) {
      const best = cityMonthlyScores.find((s) => s.month === bestMonthIdx);
      if (best) {
        return {
          scores: best.scores,
          highlights: generateHighlights(selectedCityId, best.month, best.scores),
          month: best.month,
        };
      }
    }
    if (mode === "when-to-where" && selectedCityId) {
      const ms = monthCityScores.find((s) => s.cityId === selectedCityId);
      if (ms) {
        return {
          scores: ms.scores,
          highlights: generateHighlights(selectedCityId, selectedMonth, ms.scores),
          month: selectedMonth,
        };
      }
    }
    return null;
  }, [mode, selectedCityId, selectedMonth, cityMonthlyScores, monthCityScores, bestMonthIdx]);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white text-black" style={{ fontFamily: "Pretendard, sans-serif" }}>
      <div className="mx-auto max-w-2xl px-6 py-12 sm:py-20">

        {/* ── Hero ── */}
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-16">
          언제 떠나면
          <br />
          좋을까?
        </h1>

        {/* ── Mode toggle ── */}
        <div className="flex gap-6 mb-10">
          <button
            onClick={() => { setMode("where-to-when"); setSelectedCityId(null); }}
            className="text-2xl font-bold transition-colors duration-150"
            style={{ color: mode === "where-to-when" ? "#000" : "#CCC" }}
          >
            목적지
          </button>
          <button
            onClick={() => { setMode("when-to-where"); setSelectedCityId(null); }}
            className="text-2xl font-bold transition-colors duration-150"
            style={{ color: mode === "when-to-where" ? "#000" : "#CCC" }}
          >
            날짜
          </button>
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* MODE: where-to-when (목적지 → 월별 캘린더) */}
        {/* ═══════════════════════════════════════════════ */}
        {mode === "where-to-when" && (
          <>
            {/* Search input */}
            <div className="mb-12">
              <input
                type="text"
                placeholder="도시 이름을 입력하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xl bg-transparent border-b border-[#EEE] pb-3 outline-none placeholder:text-[#CCC] focus:border-[#000] transition-colors"
              />

              {/* City list */}
              {searchQuery.trim() && filteredCities.length > 0 && (
                <div className="mt-4 space-y-2">
                  {filteredCities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => {
                        setSelectedCityId(city.id);
                        setSearchQuery(city.nameKo);
                      }}
                      className="block w-full text-left py-2 group"
                    >
                      <span className="text-lg font-bold group-hover:underline">{city.nameKo}</span>
                      <span className="text-sm text-[#999] ml-2">{city.nameEn}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Quick select chips */}
              {!searchQuery.trim() && !selectedCityId && (
                <div className="flex flex-wrap gap-3 mt-6">
                  {cities.slice(0, 8).map((city) => (
                    <button
                      key={city.id}
                      onClick={() => {
                        setSelectedCityId(city.id);
                        setSearchQuery(city.nameKo);
                      }}
                      className="text-sm text-[#999] hover:text-black transition-colors"
                    >
                      {city.nameKo}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Calendar grid OR empty state */}
            {selectedCityId && cityMonthlyScores.length > 0 ? (
              <>
                {/* City header */}
                <div className="mb-10">
                  <span className="text-xs tracking-[0.2em] uppercase text-[#999]">
                    {selectedCity?.country}
                  </span>
                  <h2 className="text-3xl font-black mt-1">{selectedCity?.nameKo}</h2>
                </div>

                {/* 4×3 Calendar Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-0 mb-16">
                  {cityMonthlyScores
                    .sort((a, b) => a.month - b.month)
                    .map((ms) => {
                      const isBest = ms.month === bestMonthIdx;
                      return (
                        <button
                          key={ms.month}
                          onClick={() => {
                            /* could show detail */
                          }}
                          className="relative border-b border-[#EEE] py-6 sm:py-8 flex flex-col items-center justify-center transition-colors hover:bg-[#FAFAFA]"
                        >
                          {isBest && (
                            <span
                              className="uppercase tracking-widest text-[#999] mb-1"
                              style={{ fontSize: "8px" }}
                            >
                              BEST
                            </span>
                          )}
                          <span className="text-xs uppercase tracking-[0.2em] text-[#999] mb-2">
                            {MONTH_LABELS[ms.month - 1]}
                          </span>
                          <span
                            className={`font-black leading-none ${isBest ? "text-5xl sm:text-6xl" : "text-3xl sm:text-4xl"}`}
                            style={{ color: scoreColor(ms.scores.total) }}
                          >
                            {ms.scores.total.toFixed(1)}
                          </span>
                        </button>
                      );
                    })}
                </div>

                {/* Detail panel for best month */}
                {detailData && (
                  <div className="mb-16">
                    <div className="mb-6">
                      <span className="text-xs tracking-[0.2em] uppercase text-[#999]">
                        BEST MONTH
                      </span>
                      <h3 className="text-2xl font-black mt-1">
                        {MONTH_KO[detailData.month - 1]}
                      </h3>
                    </div>

                    {/* Score bars */}
                    <div className="space-y-5">
                      {(["weather", "cost", "crowd", "buzz"] as const).map((key) => {
                        const val = detailData.scores[key];
                        return (
                          <div key={key} className="flex items-center gap-4">
                            <span
                              className="text-2xl sm:text-3xl font-black w-16 text-right shrink-0"
                              style={{ color: scoreColor(val) }}
                            >
                              {val.toFixed(1)}
                            </span>
                            <div className="flex-1">
                              <div className="text-xs tracking-[0.15em] text-[#999] uppercase mb-1">
                                {SCORE_LABELS[key]}
                              </div>
                              <div className="h-1 bg-[#F0F0F0] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${val * 10}%`,
                                    backgroundColor: scoreColor(val),
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Highlights */}
                    {detailData.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-8">
                        {detailData.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="text-xs tracking-[0.1em] text-[#666] border-b border-[#EEE] pb-0.5"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Empty state */
              !selectedCityId && searchQuery.trim() === "" && (
                <div className="flex flex-col items-center justify-center py-20">
                  <span className="font-black text-[#F0F0F0] leading-none" style={{ fontSize: "200px" }}>
                    ?
                  </span>
                  <span className="text-sm text-[#999] mt-4">도시를 선택하세요</span>
                </div>
              )
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* MODE: when-to-where (날짜 → 도시 랭킹) */}
        {/* ═══════════════════════════════════════════════ */}
        {mode === "when-to-where" && (
          <>
            {/* Month selector */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-0 mb-14">
              {MONTH_KO.map((label, idx) => {
                const m = idx + 1;
                const isActive = m === selectedMonth;
                return (
                  <button
                    key={m}
                    onClick={() => { setSelectedMonth(m); setSelectedCityId(null); }}
                    className="py-4 text-center border-b transition-colors"
                    style={{
                      borderColor: isActive ? "#000" : "#EEE",
                      color: isActive ? "#000" : "#CCC",
                    }}
                  >
                    <span className={`text-lg ${isActive ? "font-black" : "font-medium"}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Ranking list */}
            <div className="mb-16">
              <span className="text-xs tracking-[0.2em] uppercase text-[#999] mb-6 block">
                {MONTH_KO[selectedMonth - 1]} RANKING
              </span>

              <div className="space-y-0">
                {ranking.map((item, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  const isSelected = item.cityId === selectedCityId;
                  return (
                    <button
                      key={item.cityId}
                      onClick={() => setSelectedCityId(item.cityId)}
                      className={`w-full flex items-center gap-4 sm:gap-6 py-4 border-b border-[#EEE] text-left transition-colors ${
                        isSelected ? "bg-[#FAFAFA]" : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      {/* Rank number */}
                      <span
                        className={`font-black shrink-0 w-12 sm:w-16 text-right ${
                          isTop3 ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl text-[#CCC]"
                        }`}
                      >
                        {rank}
                      </span>

                      {/* City name */}
                      <div className="flex-1 min-w-0">
                        <span className="text-base sm:text-lg font-bold block truncate">
                          {item.city.nameKo}
                        </span>
                        <span className="text-xs text-[#999]">
                          {item.city.nameEn}
                        </span>
                      </div>

                      {/* Score */}
                      <span
                        className="text-xl sm:text-2xl font-bold shrink-0"
                        style={{ color: scoreColor(item.scores.total) }}
                      >
                        {item.scores.total.toFixed(1)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail panel for selected city in ranking */}
            {selectedCityId && detailData && (
              <div className="mb-16">
                <div className="mb-6">
                  <span className="text-xs tracking-[0.2em] uppercase text-[#999]">
                    {selectedCity?.country}
                  </span>
                  <h3 className="text-2xl font-black mt-1">
                    {selectedCity?.nameKo}
                    <span className="text-sm font-normal text-[#999] ml-2">
                      {MONTH_KO[selectedMonth - 1]}
                    </span>
                  </h3>
                </div>

                {/* Score bars */}
                <div className="space-y-5">
                  {(["weather", "cost", "crowd", "buzz"] as const).map((key) => {
                    const val = detailData.scores[key];
                    return (
                      <div key={key} className="flex items-center gap-4">
                        <span
                          className="text-2xl sm:text-3xl font-black w-16 text-right shrink-0"
                          style={{ color: scoreColor(val) }}
                        >
                          {val.toFixed(1)}
                        </span>
                        <div className="flex-1">
                          <div className="text-xs tracking-[0.15em] text-[#999] uppercase mb-1">
                            {SCORE_LABELS[key]}
                          </div>
                          <div className="h-1 bg-[#F0F0F0] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${val * 10}%`,
                                backgroundColor: scoreColor(val),
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Highlights */}
                {detailData.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-8">
                    {detailData.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="text-xs tracking-[0.1em] text-[#666] border-b border-[#EEE] pb-0.5"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Footer ── */}
        <footer className="pt-20 pb-8">
          <span className="text-xs tracking-[0.3em] uppercase text-[#CCC]">
            whereorwhen
          </span>
        </footer>
      </div>
    </div>
  );
}
