"use client";

import { useState, useMemo } from "react";
import type { AppMode } from "@/types";
import { cities } from "@/data/cities";
import { getScoresForCity, getScoresForMonth } from "@/data/mock-scores";
import { generateHighlights } from "@/lib/highlights";
import CalendarView from "@/components/CalendarView";
import RankingView from "@/components/RankingView";

// ─── Month names ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

// ─── Main Page Component ────────────────────────────────────────────────────────

export default function Home() {
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  // Mode A: scores for selected city (from realistic mock data)
  const calendarScores = useMemo(() => {
    if (!selectedCityId) return [];
    return getScoresForCity(selectedCityId).map((ms) => ({
      month: ms.month,
      scores: ms.scores,
    }));
  }, [selectedCityId]);

  // Mode B: rankings for selected month (from realistic mock data)
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

  // Filtered cities for dropdown
  const filteredCities = cities.filter(
    (c) =>
      c.nameKo.includes(citySearchQuery) ||
      c.nameEn.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
      c.country.includes(citySearchQuery)
  );

  return (
    <main className="min-h-screen bg-white">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <header className="pt-10 pb-6 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
          where<span className="text-emerald-500">or</span>when
        </h1>
        <p className="mt-2 text-base text-gray-500">
          여행지별 최적 시기를 종합 점수로 알려드립니다
        </p>
      </header>

      {/* ─── Content Container ───────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        {/* ─── Mode Slider ─────────────────────────────────────── */}
        <div className="relative bg-gray-100 rounded-2xl p-1.5 flex mb-8">
          {/* Sliding background */}
          <div
            className={`
              absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm
              transition-all duration-300 ease-in-out
              ${mode === "where-to-when" ? "left-1.5" : "left-[calc(50%+3px)]"}
            `}
          />

          <button
            onClick={() => setMode("where-to-when")}
            className={`
              relative z-10 flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
              text-sm font-semibold transition-colors duration-300 cursor-pointer
              ${mode === "where-to-when" ? "text-gray-900" : "text-gray-500 hover:text-gray-700"}
            `}
          >
            <span className="text-lg">🗺️</span>
            <span>목적지로 검색</span>
          </button>

          <button
            onClick={() => setMode("when-to-where")}
            className={`
              relative z-10 flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
              text-sm font-semibold transition-colors duration-300 cursor-pointer
              ${mode === "when-to-where" ? "text-gray-900" : "text-gray-500 hover:text-gray-700"}
            `}
          >
            <span className="text-lg">📅</span>
            <span>날짜로 검색</span>
          </button>
        </div>

        {/* ─── Input Area ──────────────────────────────────────── */}
        <div className="mb-8">
          {mode === "where-to-when" ? (
            /* City Selector */
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                어디로 가시나요?
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
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                    transition-all duration-200 placeholder:text-gray-400"
                />
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto">
                  {filteredCities.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      검색 결과가 없습니다
                    </div>
                  ) : (
                    filteredCities.map((city) => {
                      const flag = String.fromCodePoint(
                        ...city.countryCode
                          .toUpperCase()
                          .split("")
                          .map((c) => 127397 + c.charCodeAt(0))
                      );
                      return (
                        <button
                          key={city.id}
                          onClick={() => {
                            setSelectedCityId(city.id);
                            setCitySearchQuery("");
                            setIsCityDropdownOpen(false);
                          }}
                          className={`
                            w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-emerald-50 
                            transition-colors duration-150 cursor-pointer first:rounded-t-2xl last:rounded-b-2xl
                            ${selectedCityId === city.id ? "bg-emerald-50" : ""}
                          `}
                        >
                          <span className="text-lg">{flag}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-gray-900">
                              {city.nameKo}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              {city.nameEn}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {city.country}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Click outside to close */}
              {isCityDropdownOpen && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCityDropdownOpen(false)}
                />
              )}
            </div>
          ) : (
            /* Month Selector */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                언제 떠나시나요?
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {MONTH_NAMES.map((name, idx) => {
                  const month = idx + 1;
                  const isActive = selectedMonth === month;
                  const isCurrent = new Date().getMonth() + 1 === month;
                  return (
                    <button
                      key={month}
                      onClick={() => setSelectedMonth(month)}
                      className={`
                        relative py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
                        ${
                          isActive
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }
                      `}
                    >
                      {name}
                      {isCurrent && !isActive && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── Results Area ─────────────────────────────────────── */}
        <div>
          {mode === "where-to-when" ? (
            selectedCityId && selectedCity ? (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl">
                    {String.fromCodePoint(
                      ...selectedCity.countryCode
                        .toUpperCase()
                        .split("")
                        .map((c) => 127397 + c.charCodeAt(0))
                    )}
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedCity.nameKo}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {selectedCity.nameEn}, {selectedCity.country}
                    </p>
                  </div>
                </div>
                <CalendarView
                  cityId={selectedCityId}
                  cityNameKo={selectedCity.nameKo}
                  scores={calendarScores}
                />
              </div>
            ) : (
              <EmptyState
                icon="🗺️"
                title="도시를 선택해주세요"
                description="목적지를 검색하면 12개월 최적 시기를 알려드립니다"
              />
            )
          ) : (
            <RankingView month={selectedMonth} rankings={monthRankings} />
          )}
        </div>
      </div>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 text-center">
        <p className="text-xs text-gray-400">
          날씨 · 환율 · 혼잡도 · 버즈 — 4가지 데이터를 하나의 점수로
        </p>
        <p className="text-[10px] text-gray-300 mt-2">
          where<span className="text-emerald-400">or</span>when ©{" "}
          {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}

// ─── Empty State Component ──────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4 opacity-60">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
