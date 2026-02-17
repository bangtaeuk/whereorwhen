"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { TodayBestItem } from "@/types";

/* ── Utilities (shared with main page) ─────────────────────── */
function scoreColor(v: number): string {
  if (v >= 8) return "#00C471";
  if (v >= 6) return "#3182F6";
  if (v >= 4) return "#F5A623";
  return "#E8554F";
}

function countryFlag(cc: string): string {
  return cc
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

/* ── Region filter helpers ─────────────────────────────────── */
type RegionFilter = "all" | "asia" | "europe" | "americas";

const REGION_MAP: Record<string, RegionFilter> = {
  JP: "asia", VN: "asia", TH: "asia", PH: "asia", TW: "asia",
  SG: "asia", HK: "asia", ID: "asia", MY: "asia",
  FR: "europe", GB: "europe", ES: "europe",
  US: "americas", AU: "americas",
};

const REGION_LABELS: Record<RegionFilter, string> = {
  all: "전체",
  asia: "아시아",
  europe: "유럽",
  americas: "미주/오세아니아",
};

/* ── Score Bar ─────────────────────────────────────────────── */
function BonusBar({
  label,
  value,
  maxValue,
}: {
  label: string;
  value: number;
  maxValue: number;
}) {
  if (value === 0) return null;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[11px] w-16 shrink-0" style={{ color: "#6B7684" }}>
        {label}
      </span>
      <div
        className="flex-1 h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: "#F2F3F5" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${(value / maxValue) * 100}%`,
            backgroundColor: "#00C471",
          }}
        />
      </div>
      <span
        className="text-[11px] font-bold tabular-nums w-8 text-right shrink-0"
        style={{ color: "#00C471" }}
      >
        +{value.toFixed(1)}
      </span>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function TodayBestPage() {
  const [items, setItems] = useState<TodayBestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateStr, setDateStr] = useState("");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [expandedRank, setExpandedRank] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/today-best")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.rankings ?? []);
        setDateStr(data.date ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    if (regionFilter === "all") return items;
    return items.filter(
      (item) => REGION_MAP[item.city.countryCode] === regionFilter,
    );
  }, [items, regionFilter]);

  const todayLabel = dateStr
    ? new Date(dateStr + "T00:00:00").toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <p className="text-sm" style={{ color: "#ADB5BD" }}>
          불러오는 중...
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FFFFFF", color: "#1B1D1F" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-sm border-b"
        style={{
          backgroundColor: "rgba(255,255,255,0.90)",
          borderColor: "#E8EBED",
          height: 56,
        }}
      >
        <div className="max-w-4xl mx-auto px-4 h-full flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95"
            style={{ backgroundColor: "#F7F8FA" }}
          >
            <span className="text-sm" style={{ color: "#6B7684" }}>←</span>
          </Link>
          <h1
            className="text-base font-bold tracking-tight"
            style={{ color: "#1B1D1F" }}
          >
            오늘의 BEST 타이밍
          </h1>
        </div>
      </header>

      {/* Hero */}
      <section
        className="py-6 text-center"
        style={{ backgroundColor: "#F7F8FA" }}
      >
        <p className="text-2xl mb-1">🏆</p>
        <h2
          className="text-xl font-bold"
          style={{ color: "#1B1D1F" }}
        >
          {todayLabel} 기준
        </h2>
        <p className="text-sm mt-1" style={{ color: "#6B7684" }}>
          환율 · 시즌 · 예약 타이밍을 종합한 오늘의 추천
        </p>
      </section>

      {/* Region filter */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {(Object.keys(REGION_LABELS) as RegionFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => setRegionFilter(key)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
              style={
                regionFilter === key
                  ? { backgroundColor: "#1B1D1F", color: "#FFFFFF" }
                  : {
                      backgroundColor: "#FFFFFF",
                      color: "#6B7684",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }
              }
            >
              {REGION_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Ranking list */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "#ADB5BD" }}>
              해당 지역에 추천 항목이 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const c = scoreColor(item.score);
              const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
              const isExpanded = expandedRank === item.rank;
              const totalBonus =
                item.bonuses.exchangeRate +
                item.bonuses.forecast +
                item.bonuses.season +
                item.bonuses.timeliness;

              return (
                <div key={`${item.city.id}-${item.rank}`}>
                  <button
                    onClick={() =>
                      setExpandedRank(isExpanded ? null : item.rank)
                    }
                    className="w-full rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.99]"
                    style={{
                      backgroundColor: isExpanded ? "#F7F8FA" : "#FFFFFF",
                      borderLeft: `4px solid ${c}`,
                      boxShadow: isExpanded
                        ? "0 2px 12px rgba(0,0,0,0.08)"
                        : "0 1px 8px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg shrink-0">
                        {medals[item.rank] ?? (
                          <span
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                            style={{ backgroundColor: "#F2F3F5", color: "#ADB5BD" }}
                          >
                            {item.rank}
                          </span>
                        )}
                      </span>
                      <span className="text-lg shrink-0">
                        {countryFlag(item.city.countryCode)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className="text-sm font-bold"
                            style={{ color: "#1B1D1F" }}
                          >
                            {item.city.nameKo}
                          </span>
                          <span className="text-[11px]" style={{ color: "#ADB5BD" }}>
                            {item.city.nameEn}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "#6B7684" }}>
                          {item.recommendedPeriod.label}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className="text-lg font-bold tabular-nums"
                          style={{ color: c }}
                        >
                          {item.score.toFixed(1)}
                        </span>
                        {totalBonus > 0 && (
                          <p className="text-[10px] font-medium" style={{ color: "#00C471" }}>
                            +{totalBonus.toFixed(1)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Reasons */}
                    {item.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-10">
                        {item.reasons.map((r, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "#F7F8FA", color: "#6B7684" }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>

                  {/* Expanded bonus breakdown */}
                  {isExpanded && (
                    <div
                      className="mx-4 mt-1 mb-1 px-4 py-3 rounded-xl"
                      style={{ backgroundColor: "#F7F8FA" }}
                    >
                      <p
                        className="text-[11px] font-bold mb-2"
                        style={{ color: "#6B7684" }}
                      >
                        보너스 내역
                      </p>
                      <BonusBar label="환율" value={item.bonuses.exchangeRate} maxValue={1.0} />
                      <BonusBar label="예보" value={item.bonuses.forecast} maxValue={0.5} />
                      <BonusBar label="시즌" value={item.bonuses.season} maxValue={0.5} />
                      <BonusBar label="타이밍" value={item.bonuses.timeliness} maxValue={0.3} />
                      <div className="mt-2 pt-2" style={{ borderTop: "1px solid #E8EBED" }}>
                        <div className="flex justify-between">
                          <span className="text-[11px]" style={{ color: "#6B7684" }}>
                            기본 점수
                          </span>
                          <span className="text-[11px] font-bold" style={{ color: "#1B1D1F" }}>
                            {item.baseScore.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-[11px]" style={{ color: "#6B7684" }}>
                            보너스 합계
                          </span>
                          <span className="text-[11px] font-bold" style={{ color: "#00C471" }}>
                            +{totalBonus.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="border-t py-6 text-center"
        style={{ borderColor: "#E8EBED" }}
      >
        <p className="text-xs" style={{ color: "#ADB5BD" }}>
          매일 환율 · 시즌 · 예보 데이터를 종합하여 갱신됩니다
        </p>
      </footer>
    </div>
  );
}
