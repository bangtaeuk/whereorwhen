"use client";
import { useState, useMemo } from "react";
import { cities } from "@/data/cities";
import { getScoresForCity, getScoresForMonth } from "@/data/mock-scores";
import { generateHighlights } from "@/lib/highlights";
import type { AppMode, ScoreBreakdown } from "@/types";

const MONTHS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const SCORE_LABELS: { key: keyof Omit<ScoreBreakdown, "total">; label: string }[] = [
  { key: "weather", label: "날씨" },
  { key: "cost", label: "비용" },
  { key: "crowd", label: "혼잡" },
  { key: "buzz", label: "버즈" },
];

function scoreColor(score: number): string {
  if (score >= 8) return "#16A34A";
  if (score >= 6) return "#2563EB";
  if (score >= 4) return "#CA8A04";
  return "#DC2626";
}

function CountryFlag({ code }: { code: string }) {
  const flag = code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
  return <span className="text-sm">{flag}</span>;
}

/* ────────────────────────────────────────────── */
/*  Sub-score row (indented)                      */
/* ────────────────────────────────────────────── */
function SubScoreRow({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3 py-1 pl-16">
      <span className="w-10 shrink-0 text-xs" style={{ color: "#8B8B8B" }}>
        {label}
      </span>
      <div className="flex-1 h-[6px] rounded-[1px] overflow-hidden" style={{ background: "#EBEBEB" }}>
        <div
          className="h-full rounded-[1px]"
          style={{ width: `${(score / 10) * 100}%`, background: scoreColor(score) }}
        />
      </div>
      <span
        className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums"
        style={{ color: scoreColor(score) }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────── */
/*  Highlights inline                             */
/* ────────────────────────────────────────────── */
function Highlights({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="pl-16 pb-1 text-xs" style={{ color: "#8B8B8B" }}>
      {items.join(" · ")}
    </div>
  );
}

/* ────────────────────────────────────────────── */
/*  Mode A — Calendar (city → 12 months)          */
/* ────────────────────────────────────────────── */
function CalendarView({ cityId }: { cityId: string }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const currentMonth = new Date().getMonth() + 1;

  const monthlyScores = useMemo(() => getScoresForCity(cityId), [cityId]);
  const bestMonth = useMemo(
    () =>
      monthlyScores.reduce((best, cur) =>
        cur.scores.total > best.scores.total ? cur : best
      ),
    [monthlyScores]
  );

  return (
    <div>
      {monthlyScores.map((ms) => {
        const isBest = ms.month === bestMonth.month;
        const isCurrent = ms.month === currentMonth;
        const isOpen = expanded === ms.month;
        const highlights = generateHighlights(cityId, ms.month, ms.scores);

        return (
          <div key={ms.month}>
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : ms.month)}
              className="flex items-center gap-3 w-full text-left py-2.5 px-0 cursor-pointer"
              style={{ background: isBest ? "#FAFAFA" : "transparent" }}
            >
              {/* Month name */}
              <span className="w-12 shrink-0 flex items-center gap-1">
                {isCurrent && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "#1A1A1A" }}
                  />
                )}
                <span
                  className="text-sm tabular-nums"
                  style={{
                    color: isBest ? "#1A1A1A" : "#8B8B8B",
                    fontWeight: isBest ? 700 : 400,
                  }}
                >
                  {MONTHS[ms.month - 1]}
                </span>
              </span>

              {/* Bar */}
              <div className="flex-1 h-2 overflow-hidden" style={{ background: "#EBEBEB" }}>
                <div
                  className="h-full"
                  style={{
                    width: `${(ms.scores.total / 10) * 100}%`,
                    background: scoreColor(ms.scores.total),
                  }}
                />
              </div>

              {/* Score */}
              <span
                className="w-12 shrink-0 text-right text-base tabular-nums"
                style={{
                  color: scoreColor(ms.scores.total),
                  fontWeight: isBest ? 700 : 600,
                }}
              >
                {ms.scores.total.toFixed(1)}
              </span>

              {/* Best label */}
              {isBest && (
                <span
                  className="text-[10px] font-bold tracking-wider shrink-0"
                  style={{ color: "#16A34A" }}
                >
                  BEST
                </span>
              )}
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div className="pb-2">
                {SCORE_LABELS.map(({ key, label }) => (
                  <SubScoreRow key={key} label={label} score={ms.scores[key]} />
                ))}
                <Highlights items={highlights} />
              </div>
            )}

            {/* Divider */}
            <div className="h-px" style={{ background: "#EBEBEB" }} />
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────── */
/*  Mode B — Ranking (month → all cities)         */
/* ────────────────────────────────────────────── */
function RankingView({ month }: { month: number }) {
  const [expanded, setExpanded] = useState<string | null>(null);

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
    <div>
      {ranked.map((item, idx) => {
        const rank = idx + 1;
        const isTop3 = rank <= 3;
        const isOpen = expanded === item.cityId;
        const highlights = generateHighlights(item.cityId, month, item.scores);

        return (
          <div key={item.cityId}>
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : item.cityId)}
              className="flex items-center gap-3 w-full text-left py-2.5 px-0 cursor-pointer"
            >
              {/* Rank */}
              <span
                className="w-6 shrink-0 text-right tabular-nums"
                style={{
                  color: "#8B8B8B",
                  fontSize: isTop3 ? "15px" : "13px",
                  fontWeight: isTop3 ? 700 : 400,
                }}
              >
                {rank}
              </span>

              {/* City + flag */}
              <span className="flex items-center gap-1.5 w-28 shrink-0 truncate">
                <span
                  style={{
                    color: "#1A1A1A",
                    fontSize: isTop3 ? "15px" : "14px",
                    fontWeight: isTop3 ? 700 : 500,
                  }}
                >
                  {item.city.nameKo}
                </span>
                <CountryFlag code={item.city.countryCode} />
              </span>

              {/* Bar */}
              <div className="flex-1 h-2 overflow-hidden" style={{ background: "#EBEBEB" }}>
                <div
                  className="h-full"
                  style={{
                    width: `${(item.scores.total / 10) * 100}%`,
                    background: scoreColor(item.scores.total),
                  }}
                />
              </div>

              {/* Score */}
              <span
                className="w-12 shrink-0 text-right text-base font-semibold tabular-nums"
                style={{ color: scoreColor(item.scores.total) }}
              >
                {item.scores.total.toFixed(1)}
              </span>
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div className="pb-2">
                {SCORE_LABELS.map(({ key, label }) => (
                  <SubScoreRow key={key} label={label} score={item.scores[key]} />
                ))}
                <Highlights items={highlights} />
              </div>
            )}

            {/* Divider */}
            <div className="h-px" style={{ background: "#EBEBEB" }} />
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────── */
/*  Main Page                                     */
/* ────────────────────────────────────────────── */
export default function V14Page() {
  const [mode, setMode] = useState<AppMode>("where-to-when");
  const [query, setQuery] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  /* Search filtering */
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return cities.filter(
      (c) =>
        c.nameKo.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.country.includes(q)
    );
  }, [query]);

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId) ?? null,
    [selectedCityId]
  );

  /* Pick a city from search */
  function handleSelectCity(id: string) {
    setSelectedCityId(id);
    setQuery("");
  }

  const placeholder =
    mode === "where-to-when" ? "도시 이름을 입력하세요" : "몇 월에 떠날까요?";

  return (
    <div className="min-h-screen" style={{ background: "#FFF", color: "#1A1A1A" }}>
      <div className="mx-auto" style={{ maxWidth: 640, padding: "0 20px" }}>
        {/* ── Header ── */}
        <header className="flex items-center justify-between py-5">
          <span className="text-base font-bold tracking-tight" style={{ color: "#1A1A1A" }}>
            whereorwhen
          </span>
          <nav className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setMode("where-to-when");
                setSelectedCityId(null);
                setQuery("");
              }}
              className="text-sm cursor-pointer bg-transparent border-none p-0"
              style={{
                color: mode === "where-to-when" ? "#1A1A1A" : "#8B8B8B",
                fontWeight: mode === "where-to-when" ? 600 : 400,
              }}
            >
              도시 → 시기
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("when-to-where");
                setSelectedCityId(null);
                setQuery("");
              }}
              className="text-sm cursor-pointer bg-transparent border-none p-0"
              style={{
                color: mode === "when-to-where" ? "#1A1A1A" : "#8B8B8B",
                fontWeight: mode === "when-to-where" ? 600 : 400,
              }}
            >
              시기 → 도시
            </button>
          </nav>
        </header>
        <div className="h-px" style={{ background: "#EBEBEB" }} />

        {/* ── Input area ── */}
        <div className="py-4">
          {mode === "where-to-when" ? (
            /* City search */
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (selectedCityId) setSelectedCityId(null);
                }}
                placeholder={placeholder}
                className="w-full bg-transparent outline-none"
                style={{
                  border: "none",
                  borderBottom: "1px solid #EBEBEB",
                  fontSize: 16,
                  lineHeight: 2,
                  color: "#1A1A1A",
                  padding: "0 0 4px 0",
                }}
              />
              {/* Dropdown */}
              {filtered.length > 0 && !selectedCityId && (
                <div
                  className="absolute left-0 right-0 z-10"
                  style={{ top: "100%", background: "#FFF", borderBottom: "1px solid #EBEBEB" }}
                >
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCity(c.id)}
                      className="flex items-center gap-2 w-full text-left py-2 px-0 cursor-pointer bg-transparent border-none"
                      style={{ borderBottom: "1px solid #EBEBEB" }}
                    >
                      <span className="text-sm" style={{ color: "#1A1A1A" }}>
                        {c.nameKo}
                      </span>
                      <span className="text-xs" style={{ color: "#8B8B8B" }}>
                        {c.nameEn}
                      </span>
                      <CountryFlag code={c.countryCode} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Month selector — simple inline list */
            <div className="flex flex-wrap gap-2">
              {MONTHS.map((m, i) => {
                const mon = i + 1;
                const active = mon === selectedMonth;
                return (
                  <button
                    key={mon}
                    type="button"
                    onClick={() => setSelectedMonth(mon)}
                    className="cursor-pointer bg-transparent border-none p-0 tabular-nums"
                    style={{
                      fontSize: 14,
                      color: active ? "#1A1A1A" : "#8B8B8B",
                      fontWeight: active ? 700 : 400,
                      textDecoration: active ? "underline" : "none",
                      textUnderlineOffset: 4,
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Subheader ── */}
        {mode === "where-to-when" && selectedCity && (
          <div className="pb-2">
            <span className="text-xs" style={{ color: "#8B8B8B" }}>
              {selectedCity.nameKo} ({selectedCity.nameEn}) · 월별 종합 점수
            </span>
          </div>
        )}
        {mode === "when-to-where" && (
          <div className="pb-2">
            <span className="text-xs" style={{ color: "#8B8B8B" }}>
              {MONTHS[selectedMonth - 1]} · 도시별 종합 점수 랭킹
            </span>
          </div>
        )}

        {/* ── Content ── */}
        {mode === "where-to-when" ? (
          selectedCityId ? (
            <CalendarView cityId={selectedCityId} />
          ) : (
            <div className="py-24 text-center" style={{ color: "#CCC" }}>
              <span className="text-lg">↑ 도시를 검색하세요</span>
            </div>
          )
        ) : (
          <RankingView month={selectedMonth} />
        )}

        {/* ── Footer ── */}
        <footer className="py-8 text-center">
          <span className="text-xs" style={{ color: "#8B8B8B" }}>
            whereorwhen · 여행의 최적 타이밍을 찾아주는 서비스
          </span>
        </footer>
      </div>
    </div>
  );
}
