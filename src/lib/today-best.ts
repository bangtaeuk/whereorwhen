/**
 * "오늘의 BEST 타이밍" 알고리즘
 *
 * 20개 도시 x 향후 12주 = 240 조합을 평가하여
 * 오늘 기준으로 가장 추천할만한 여행 타이밍 TOP 10 을 반환
 *
 * 오늘의_점수 = 기본_종합점수
 *             + 환율_보너스 (최대 +1.0)
 *             + 예보_보너스 (최대 +0.5, Phase 2에서 연동)
 *             + 시즌_보너스 (최대 +0.5)
 *             + 시의성_보너스 (최대 +0.3)
 */

import { createClient } from "@supabase/supabase-js";
import { cities } from "@/data/cities";
import { getSeasonsForCity, daysUntilSeasonStart, isDateInSeason } from "@/data/seasons";
import type { TodayBestItem, City, ScoreBreakdown } from "@/types";

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---------------------------------------------------------------------------
// Week helpers
// ---------------------------------------------------------------------------
interface WeekRange {
  start: Date;
  end: Date;
  label: string;
  month: number;
  weeksFromNow: number;
}

function getNext12Weeks(today: Date): WeekRange[] {
  const weeks: WeekRange[] = [];
  const dayOfWeek = today.getDay();
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((8 - dayOfWeek) % 7 || 7));

  for (let i = 0; i < 12; i++) {
    const start = new Date(nextMonday);
    start.setDate(nextMonday.getDate() + i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const m = start.getMonth() + 1;
    const weekOfMonth = Math.ceil(start.getDate() / 7);
    const weekLabel = ["첫째주", "둘째주", "셋째주", "넷째주", "다섯째주"];

    weeks.push({
      start,
      end,
      label: `${m}월 ${weekLabel[weekOfMonth - 1] ?? `${weekOfMonth}째주`}`,
      month: m,
      weeksFromNow: i + 1,
    });
  }

  return weeks;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Base score: from scores_cache
// ---------------------------------------------------------------------------
interface ScoresCacheRow {
  city_id: string;
  month: number;
  weather: number;
  cost: number;
  crowd: number;
  buzz: number;
  total: number;
}

async function loadBaseScores(): Promise<Map<string, ScoresCacheRow>> {
  const supabase = getSupabase();
  if (!supabase) return new Map();

  const { data, error } = await supabase
    .from("scores_cache")
    .select("city_id, month, weather, cost, crowd, buzz, total");

  if (error || !data) return new Map();

  const map = new Map<string, ScoresCacheRow>();
  for (const row of data as ScoresCacheRow[]) {
    map.set(`${row.city_id}:${row.month}`, row);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Exchange rate bonus
// ---------------------------------------------------------------------------
interface ExchangeRow {
  currency: string;
  rate_date: string;
  rate: number;
}

async function loadExchangeHistory(): Promise<Map<string, ExchangeRow[]>> {
  const supabase = getSupabase();
  if (!supabase) return new Map();

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data, error } = await supabase
    .from("exchange_rates")
    .select("currency, rate_date, rate")
    .gte("rate_date", ninetyDaysAgo.toISOString().slice(0, 10))
    .order("rate_date", { ascending: false });

  if (error || !data) return new Map();

  const map = new Map<string, ExchangeRow[]>();
  for (const row of data as ExchangeRow[]) {
    let arr = map.get(row.currency);
    if (!arr) {
      arr = [];
      map.set(row.currency, arr);
    }
    arr.push(row);
  }
  return map;
}

function calculateExchangeBonus(
  currency: string,
  exchangeHistory: Map<string, ExchangeRow[]>,
): { bonus: number; reason: string | null } {
  const rows = exchangeHistory.get(currency);
  if (!rows || rows.length < 7) return { bonus: 0, reason: null };

  const currentRate = rows[0].rate;
  const allRates = rows.map((r) => r.rate);

  const thirtyDayRates = rows.slice(0, 30).map((r) => r.rate);
  const minRate90 = Math.min(...allRates);
  const minRate30 = thirtyDayRates.length > 0 ? Math.min(...thirtyDayRates) : Infinity;

  if (currentRate <= minRate90 * 1.005) {
    return { bonus: 1.0, reason: "환율 3개월 내 최저점" };
  }
  if (currentRate <= minRate30 * 1.005) {
    return { bonus: 0.5, reason: "환율 1개월 내 최저점" };
  }

  return { bonus: 0, reason: null };
}

// ---------------------------------------------------------------------------
// Season bonus
// ---------------------------------------------------------------------------
function calculateSeasonBonus(
  cityId: string,
  weekStart: Date,
  today: Date,
): { bonus: number; reason: string | null } {
  const citySeasons = getSeasonsForCity(cityId);
  if (citySeasons.length === 0) return { bonus: 0, reason: null };

  const weekMonth = weekStart.getMonth() + 1;
  const weekDay = weekStart.getDate();

  for (const season of citySeasons) {
    if (isDateInSeason(weekMonth, weekDay, season)) {
      const daysUntil = daysUntilSeasonStart(today, season);
      if (daysUntil > 0 && daysUntil <= 14) {
        return { bonus: 0.5, reason: `${season.name} 시작 직전` };
      }
      return { bonus: 0.3, reason: `${season.name}` };
    }

    const daysUntil = daysUntilSeasonStart(today, season);
    if (daysUntil > 0 && daysUntil <= 14) {
      return { bonus: 0.5, reason: `${season.name} 시작 직전` };
    }
  }

  return { bonus: 0, reason: null };
}

// ---------------------------------------------------------------------------
// Timeliness bonus: 4-8 weeks out is optimal booking window
// ---------------------------------------------------------------------------
function calculateTimelinessBonus(
  weeksFromNow: number,
): { bonus: number; reason: string | null } {
  if (weeksFromNow >= 4 && weeksFromNow <= 8) {
    return { bonus: 0.3, reason: "예약 적정 타이밍 (4-8주 전)" };
  }
  return { bonus: 0, reason: null };
}

// ---------------------------------------------------------------------------
// Forecast bonus (forecast_cache에서 예보 데이터 조회)
// ---------------------------------------------------------------------------
async function loadForecastCache(): Promise<
  Map<string, { clearRatio: number; historicalClearRatio: number }>
> {
  const supabase = getSupabase();
  if (!supabase) return new Map();

  const { data, error } = await supabase
    .from("forecast_cache")
    .select("city_id, forecast_data, fetched_at");

  if (error || !data) return new Map();

  const map = new Map<
    string,
    { clearRatio: number; historicalClearRatio: number }
  >();
  const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;

  for (const row of data) {
    if (new Date(row.fetched_at).getTime() < sixHoursAgo) continue;
    try {
      const days = JSON.parse(row.forecast_data) as Array<{ isClear: boolean }>;
      const clearDays = days.filter((d) => d.isClear).length;
      const clearRatio = days.length > 0 ? clearDays / days.length : 0;
      map.set(row.city_id, { clearRatio, historicalClearRatio: 0.6 });
    } catch {
      // skip invalid data
    }
  }

  return map;
}

let _forecastCachePromise: Promise<
  Map<string, { clearRatio: number; historicalClearRatio: number }>
> | null = null;

function getForecastCacheOnce() {
  if (!_forecastCachePromise) {
    _forecastCachePromise = loadForecastCache();
  }
  return _forecastCachePromise;
}

export async function calculateForecastBonusAsync(
  cityId: string,
): Promise<{ bonus: number; reason: string | null }> {
  const cache = await getForecastCacheOnce();
  const entry = cache.get(cityId);
  if (!entry) return { bonus: 0, reason: null };

  const diff = entry.clearRatio - entry.historicalClearRatio;
  if (diff > 0.1) {
    return {
      bonus: Math.min(0.5, Math.round(diff * 3 * 10) / 10),
      reason: `예보 맑은 날 ${Math.round(entry.clearRatio * 100)}%`,
    };
  }
  return { bonus: 0, reason: null };
}

// ---------------------------------------------------------------------------
// Main: calculateTodayBest
// ---------------------------------------------------------------------------
export async function calculateTodayBest(
  today: Date = new Date(),
): Promise<TodayBestItem[]> {
  const [baseScores, exchangeHistory] = await Promise.all([
    loadBaseScores(),
    loadExchangeHistory(),
  ]);

  const weeks = getNext12Weeks(today);
  const combinations: TodayBestItem[] = [];

  for (const city of cities) {
    for (const week of weeks) {
      const key = `${city.id}:${week.month}`;
      const row = baseScores.get(key);
      if (!row) continue;

      const baseScore = row.total;
      const exchange = calculateExchangeBonus(city.currency, exchangeHistory);
      const forecast = await calculateForecastBonusAsync(city.id);
      const season = calculateSeasonBonus(city.id, week.start, today);
      const timeliness = calculateTimelinessBonus(week.weeksFromNow);

      const totalScore =
        Math.round(
          (baseScore +
            exchange.bonus +
            forecast.bonus +
            season.bonus +
            timeliness.bonus) *
            10,
        ) / 10;

      const reasons: string[] = [];
      if (exchange.reason) reasons.push(exchange.reason);
      if (forecast.reason) reasons.push(forecast.reason);
      if (season.reason) reasons.push(season.reason);
      if (timeliness.reason) reasons.push(timeliness.reason);
      if (row.weather >= 8) reasons.push("날씨 최적");
      if (row.crowd >= 8) reasons.push("비수기 한산");

      combinations.push({
        rank: 0,
        city,
        recommendedPeriod: {
          start: formatDate(week.start),
          end: formatDate(week.end),
          label: week.label,
        },
        score: totalScore,
        baseScore,
        bonuses: {
          exchangeRate: exchange.bonus,
          forecast: forecast.bonus,
          season: season.bonus,
          timeliness: timeliness.bonus,
        },
        reasons: reasons.slice(0, 3),
      });
    }
  }

  // 같은 도시가 여러 주에 걸쳐 나올 수 있으므로 도시당 최고 점수만 선택
  const bestPerCity = new Map<string, TodayBestItem>();
  for (const item of combinations) {
    const existing = bestPerCity.get(item.city.id);
    if (!existing || item.score > existing.score) {
      bestPerCity.set(item.city.id, item);
    }
  }

  const ranked = Array.from(bestPerCity.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  return ranked;
}
