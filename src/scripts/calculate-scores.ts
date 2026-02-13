import "dotenv/config";

/**
 * 점수 계산 스크립트
 * Run: npx tsx src/scripts/calculate-scores.ts
 *
 * Supabase의 원시 데이터(weather_monthly, exchange_rates, holidays, buzz_monthly)를 읽어
 * 최종 점수를 계산한 뒤 scores_cache 테이블에 UPSERT
 */

import { createClient } from "@supabase/supabase-js";
import { cities } from "../data/cities";
import { calculateTotalScore, DEFAULT_WEIGHTS } from "../lib/score";

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------
function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

// ---------------------------------------------------------------------------
// 1. Weather Score — smooth continuous function
// ---------------------------------------------------------------------------
interface WeatherRow {
  city_id: string;
  month: number;
  avg_temp: number | null;
  sunny_ratio: number | null;
}

/**
 * 날씨 점수 계산 (연속 함수)
 * - sunny_ratio: 맑은 날 비율 기여 (weight 60%)
 * - avg_temp: 21.5°C 최적, 벗어날수록 감점 (weight 40%)
 * 최종 1.0~10.0 범위 클램프
 */
function calcWeatherScore(
  avgTemp: number | null,
  sunnyRatio: number | null
): number {
  const sr = sunnyRatio ?? 0.5;
  const temp = avgTemp ?? 20;

  // Sunny component: 0→1 maps to ~1→10 via power curve
  const sunnyScore = 1 + 9 * Math.pow(sr, 1.2);

  // Temperature component: bell curve centered at 21.5°C, σ=8
  const optimalTemp = 21.5;
  const sigma = 8;
  const tempScore =
    1 +
    9 * Math.exp(-Math.pow(temp - optimalTemp, 2) / (2 * sigma * sigma));

  // Weighted combination
  const combined = 0.6 * sunnyScore + 0.4 * tempScore;
  return clamp(Math.round(combined * 10) / 10, 1.0, 10.0);
}

// ---------------------------------------------------------------------------
// 2. Cost Score — exchange rate vs 365-day average
// ---------------------------------------------------------------------------
interface ExchangeRow {
  currency: string;
  rate_date: string;
  rate: number;
}

function calcCostScore(
  currentRate: number | null,
  avgRate: number | null
): number {
  if (currentRate == null || avgRate == null || avgRate === 0) return 5.0;

  // Positive pctDiff means KRW is stronger (cheaper to travel)
  // rate = KRW per 1 unit of foreign currency
  // If rate drops, KRW buys more foreign currency → cheaper → higher score
  const pctDiff = ((avgRate - currentRate) / avgRate) * 100;

  // Smooth mapping: sigmoid centered at 0, ±10% → full range
  const score = 5.5 + 4.5 * Math.tanh(pctDiff / 10);
  return clamp(Math.round(score * 10) / 10, 1.0, 10.0);
}

// ---------------------------------------------------------------------------
// 3. Crowd Score — holidays + seasonality
// ---------------------------------------------------------------------------
interface HolidayRow {
  country_code: string;
  holiday_date: string;
}

/** 성수기 월 (Jul, Aug, late Dec, early Jan) */
const PEAK_MONTHS = new Set([1, 7, 8, 12]);

function calcCrowdScore(
  krHolidays: number,
  localHolidays: number,
  month: number
): number {
  let score = 9.0;

  // Peak season penalty
  if (PEAK_MONTHS.has(month)) {
    score -= 2.0;
  }

  // Korean holidays penalty (-1 per holiday, max -4)
  score -= Math.min(krHolidays, 4) * 1.0;

  // Local holidays penalty (-0.5 per holiday, max -3)
  score -= Math.min(localHolidays, 6) * 0.5;

  return clamp(Math.round(score * 10) / 10, 1.0, 10.0);
}

// ---------------------------------------------------------------------------
// 4. Buzz Score — monthly count vs annual average
// ---------------------------------------------------------------------------
interface BuzzRow {
  city_id: string;
  month: number;
  year: number;
  total_count: number | null;
}

function calcBuzzScore(
  monthCount: number | null,
  annualAvg: number | null
): number {
  if (monthCount == null || annualAvg == null || annualAvg === 0) return 5.0;

  const ratio = monthCount / annualAvg;

  // Sigmoid: ratio=1 → ~5.5, ratio≥2 → ~9-10, ratio≤0.5 → ~3-4
  const score = 2 + 8 * (1 / (1 + Math.exp(-2.5 * (ratio - 1))));
  return clamp(Math.round(score * 10) / 10, 1.0, 10.0);
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export async function main(): Promise<void> {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );

  console.log(
    "📊 Starting score calculation for",
    cities.length,
    "cities...\n"
  );

  // ── Fetch all raw data in parallel ──
  const [weatherRes, exchangeRes, holidaysRes, buzzRes] = await Promise.all([
    supabase
      .from("weather_monthly")
      .select("city_id, month, avg_temp, sunny_ratio"),
    supabase
      .from("exchange_rates")
      .select("currency, rate_date, rate")
      .order("rate_date", { ascending: false }),
    supabase.from("holidays").select("country_code, holiday_date"),
    supabase
      .from("buzz_monthly")
      .select("city_id, month, year, total_count"),
  ]);

  if (weatherRes.error)
    console.warn("⚠ Weather fetch error:", weatherRes.error.message);
  if (exchangeRes.error)
    console.warn("⚠ Exchange fetch error:", exchangeRes.error.message);
  if (holidaysRes.error)
    console.warn("⚠ Holidays fetch error:", holidaysRes.error.message);
  if (buzzRes.error)
    console.warn("⚠ Buzz fetch error:", buzzRes.error.message);

  const weatherData = (weatherRes.data ?? []) as WeatherRow[];
  const exchangeData = (exchangeRes.data ?? []) as ExchangeRow[];
  const holidaysData = (holidaysRes.data ?? []) as HolidayRow[];
  const buzzData = (buzzRes.data ?? []) as BuzzRow[];

  // ── Index weather by city_id:month ──
  const weatherMap = new Map<string, WeatherRow>();
  for (const w of weatherData) {
    weatherMap.set(`${w.city_id}:${w.month}`, w);
  }

  // ── Index exchange rates: current & 365-day avg per currency ──
  const currencyRates = new Map<
    string,
    { current: number | null; avg365: number | null }
  >();
  {
    const grouped = new Map<string, ExchangeRow[]>();
    for (const e of exchangeData) {
      let arr = grouped.get(e.currency);
      if (!arr) {
        arr = [];
        grouped.set(e.currency, arr);
      }
      arr.push(e);
    }

    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    for (const [currency, rows] of grouped) {
      // rows are ordered by rate_date DESC → first is most recent
      const current = rows.length > 0 ? rows[0].rate : null;

      // 365-day average (require at least 30 data points)
      const recentRows = rows.filter(
        (r) => new Date(r.rate_date) >= oneYearAgo
      );
      const avg365 =
        recentRows.length >= 30
          ? recentRows.reduce((sum, r) => sum + r.rate, 0) / recentRows.length
          : null;

      currencyRates.set(currency, { current, avg365 });
    }
  }

  // ── Index holidays by country_code:month ──
  const holidayCountMap = new Map<string, number>();
  for (const h of holidaysData) {
    const d = new Date(h.holiday_date);
    const month = d.getMonth() + 1;
    const key = `${h.country_code}:${month}`;
    holidayCountMap.set(key, (holidayCountMap.get(key) ?? 0) + 1);
  }

  // ── Index buzz: per-city monthly count & annual average ──
  const buzzMap = new Map<string, number>(); // city_id:month → latest total_count
  const buzzAnnualMap = new Map<string, number>(); // city_id → annual avg
  {
    const cityBuzz = new Map<string, BuzzRow[]>();
    for (const b of buzzData) {
      let arr = cityBuzz.get(b.city_id);
      if (!arr) {
        arr = [];
        cityBuzz.set(b.city_id, arr);
      }
      arr.push(b);
    }

    for (const [cityId, rows] of cityBuzz) {
      // Latest year's data per month
      const latestByMonth = new Map<number, BuzzRow>();
      for (const r of rows) {
        const existing = latestByMonth.get(r.month);
        if (!existing || r.year > existing.year) {
          latestByMonth.set(r.month, r);
        }
      }

      let totalCount = 0;
      let monthsWithData = 0;
      for (const [month, row] of latestByMonth) {
        if (row.total_count != null) {
          buzzMap.set(`${cityId}:${month}`, row.total_count);
          totalCount += row.total_count;
          monthsWithData++;
        }
      }

      if (monthsWithData > 0) {
        buzzAnnualMap.set(cityId, totalCount / monthsWithData);
      }
    }
  }

  // ── Calculate scores for each city × month ──
  const upsertRows: Array<{
    city_id: string;
    month: number;
    weather: number;
    cost: number;
    crowd: number;
    buzz: number;
    total: number;
  }> = [];

  for (const city of cities) {
    let bestMonth = 1;
    let bestTotal = 0;

    for (let month = 1; month <= 12; month++) {
      // Weather
      const wRow = weatherMap.get(`${city.id}:${month}`);
      const weatherScore = wRow
        ? calcWeatherScore(wRow.avg_temp, wRow.sunny_ratio)
        : 5.0;

      // Cost
      const rateInfo = currencyRates.get(city.currency);
      const costScore = rateInfo
        ? calcCostScore(rateInfo.current, rateInfo.avg365)
        : 5.0;

      // Crowd
      const krHolidays = holidayCountMap.get(`KR:${month}`) ?? 0;
      const localHolidays =
        holidayCountMap.get(`${city.countryCode}:${month}`) ?? 0;
      const crowdScore = calcCrowdScore(krHolidays, localHolidays, month);

      // Buzz
      const monthBuzz = buzzMap.get(`${city.id}:${month}`) ?? null;
      const annualAvg = buzzAnnualMap.get(city.id) ?? null;
      const buzzScore = calcBuzzScore(monthBuzz, annualAvg);

      // Total
      const total = calculateTotalScore(
        {
          weather: weatherScore,
          cost: costScore,
          crowd: crowdScore,
          buzz: buzzScore,
        },
        DEFAULT_WEIGHTS
      );

      upsertRows.push({
        city_id: city.id,
        month,
        weather: weatherScore,
        cost: costScore,
        crowd: crowdScore,
        buzz: buzzScore,
        total,
      });

      if (total > bestTotal) {
        bestTotal = total;
        bestMonth = month;
      }
    }

    console.log(
      `Calculated scores for ${city.nameKo}: best month = ${bestMonth}월 (${bestTotal})`
    );
  }

  // ── UPSERT into scores_cache (batch of 50) ──
  console.log(`\nUpserting ${upsertRows.length} rows into scores_cache...`);

  const CHUNK_SIZE = 50;
  for (let i = 0; i < upsertRows.length; i += CHUNK_SIZE) {
    const chunk = upsertRows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from("scores_cache")
      .upsert(chunk, { onConflict: "city_id,month" });

    if (error) {
      console.error(
        `✗ Upsert error (rows ${i}-${i + chunk.length}):`,
        error.message
      );
    }
  }

  console.log("✓ Score calculation complete.");
}

// ---------------------------------------------------------------------------
// Self-execution
// ---------------------------------------------------------------------------
const isDirectRun =
  process.argv[1]?.includes("calculate-scores") ?? false;

if (isDirectRun) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
