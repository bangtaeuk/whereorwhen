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
// 1. Weather Score — calibrated v2
// ---------------------------------------------------------------------------
interface WeatherRow {
  city_id: string;
  month: number;
  avg_temp: number | null;
  sunny_ratio: number | null;
}

/**
 * 날씨 점수 계산 (보정 v2)
 *
 * 변경점 (vs v1):
 * - sunny_ratio: power curve → 선형 매핑 + 높은 floor (3점)
 *   → 흐리지만 따뜻한 기후도 적정 점수 보장
 * - 기온: σ=8 → σ=12 (더 관대한 벨 커브) + floor 2점
 *   → 15~28°C가 아니어도 극단적 감점 없음
 * - 비중: 60:40(sunny:temp) → 50:50
 *   → 기온의 영향력 상향
 *
 * 결과 범위: 오사카 4월 ~7.0, 하와이 6월 ~8.8, 런던 1월 ~4.8
 */
function calcWeatherScore(
  avgTemp: number | null,
  sunnyRatio: number | null
): number {
  const sr = sunnyRatio ?? 0.5;
  const temp = avgTemp ?? 20;

  // Sunny: linear with floor 4 (cloudy but warm = still decent for travel)
  // sr=0 → 4, sr=0.3 → 5.8, sr=0.5 → 7, sr=0.7 → 8.2, sr=1 → 10
  const sunnyScore = 4 + 6 * sr;

  // Temperature: wide bell curve, center 22°C, σ=12, floor 2
  const optimalTemp = 22;
  const sigma = 12;
  const tempScore =
    2 +
    8 * Math.exp(-Math.pow(temp - optimalTemp, 2) / (2 * sigma * sigma));

  // 50/50 combination
  const combined = 0.5 * tempScore + 0.5 * sunnyScore;
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

/**
 * 통화별 기본 비용 점수 (절대 물가 수준 반영)
 * 한국인 여행자 관점에서 저렴할수록 높은 점수
 */
const CURRENCY_BASE_COST: Record<string, number> = {
  // 동아시아
  JPY: 7.5,  // 일본 — 엔저로 매우 유리
  TWD: 6.5,  // 대만 — 보통~저렴
  HKD: 5.5,  // 홍콩 — 보통
  MOP: 5.5,  // 마카오 — 보통
  // 동남아시아
  VND: 8.0,  // 베트남 — 매우 저렴
  THB: 7.5,  // 태국 — 저렴
  PHP: 7.0,  // 필리핀 — 저렴
  IDR: 7.5,  // 인도네시아 — 저렴
  MYR: 7.0,  // 말레이시아 — 저렴
  SGD: 4.5,  // 싱가포르 — 비쌈
  KHR: 8.0,  // 캄보디아 — 매우 저렴
  LAK: 8.5,  // 라오스 — 매우 저렴
  MMK: 8.5,  // 미얀마 — 매우 저렴
  // 중동
  AED: 4.5,  // UAE — 비쌈
  TRY: 7.5,  // 터키 — 저렴 (리라 약세)
  // 유럽
  EUR: 4.0,  // 유로존 — 비쌈
  GBP: 3.5,  // 영국 — 매우 비쌈
  CZK: 5.5,  // 체코 — 보통
  CHF: 3.0,  // 스위스 — 매우 비쌈
  HUF: 6.0,  // 헝가리 — 보통~저렴
  PLN: 5.5,  // 폴란드 — 보통
  ISK: 3.5,  // 아이슬란드 — 매우 비쌈
  NOK: 3.5,  // 노르웨이 — 매우 비쌈
  SEK: 4.0,  // 스웨덴 — 비쌈
  DKK: 4.0,  // 덴마크 — 비쌈
  HRK: 5.0,  // 크로아티아 (EUR 사용, 레거시)
  // 미주
  USD: 4.5,  // 미국 — 비쌈
  CAD: 4.5,  // 캐나다 — 비쌈
  MXN: 7.0,  // 멕시코 — 저렴
  // 오세아니아
  AUD: 5.0,  // 호주 — 비쌈
  NZD: 5.0,  // 뉴질랜드 — 비쌈
  FJD: 5.5,  // 피지 — 보통
  // 리조트
  MVR: 3.5,  // 몰디브 — 매우 비쌈
};

/**
 * 비용 점수 계산 (보정 v2)
 *
 * 변경점 (vs v1):
 * - 통화별 기본 물가 수준(base cost) 재도입
 *   → 엔화/바트/동은 기본 7-8점, 유로/파운드는 3.5-4점
 * - 환율 변동은 ±1.5점 modifier로 제한
 *   → 기본 물가에 환율 유불리를 가감하는 직관적 구조
 *
 * 결과 범위: JPY 6.0~9.0, EUR 2.5~5.5, VND 6.5~9.5
 */
function calcCostScore(
  currentRate: number | null,
  avgRate: number | null,
  currency: string
): number {
  const baseCost = CURRENCY_BASE_COST[currency] ?? 5.0;

  if (currentRate == null || avgRate == null || avgRate === 0) return baseCost;

  const pctDiff = ((avgRate - currentRate) / avgRate) * 100;
  // ±5% 환율 변동 → ±1.5점 modifier
  const exchangeModifier = clamp(pctDiff * 0.3, -1.5, 1.5);

  return clamp(Math.round((baseCost + exchangeModifier) * 10) / 10, 1.0, 10.0);
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

/**
 * 버즈 점수 계산 (보정 v2)
 *
 * 변경점 (vs v1):
 * - sigmoid 감도 상향: k=2.5 → k=4 (더 넓은 점수 분포)
 * - floor 상향: 2 → 3 (비수기도 최소 3점)
 * - range: 7 (3~10)
 *
 * 결과: ratio=1→6.5, ratio=1.5→9.2, ratio=0.5→3.8
 */
function calcBuzzScore(
  monthCount: number | null,
  annualAvg: number | null
): number {
  if (monthCount == null || annualAvg == null || annualAvg === 0) return 5.0;

  const ratio = monthCount / annualAvg;

  // More sensitive sigmoid for wider score distribution
  const score = 3 + 7 * (1 / (1 + Math.exp(-4 * (ratio - 1))));
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
        ? calcCostScore(rateInfo.current, rateInfo.avg365, city.currency)
        : (CURRENCY_BASE_COST[city.currency] ?? 5.0);

      // Crowd
      const krHolidays = holidayCountMap.get(`KR:${month}`) ?? 0;
      const localHolidays =
        holidayCountMap.get(`${city.countryCode}:${month}`) ?? 0;
      const crowdScore = calcCrowdScore(krHolidays, localHolidays, month);

      // Buzz
      const monthBuzz = buzzMap.get(`${city.id}:${month}`) ?? null;
      const annualAvg = buzzAnnualMap.get(city.id) ?? null;
      const buzzScore = calcBuzzScore(monthBuzz, annualAvg);

      // Total (with contrast expansion)
      const rawTotal = calculateTotalScore(
        {
          weather: weatherScore,
          cost: costScore,
          crowd: crowdScore,
          buzz: buzzScore,
        },
        DEFAULT_WEIGHTS
      );
      // Contrast expansion: spread scores away from midpoint 5.0
      // raw 7.6→8.4, 7.0→7.6, 5.0→5.0, 4.0→3.7
      const total = clamp(
        Math.round((5 + (rawTotal - 5) * 1.3) * 10) / 10,
        1.0,
        10.0
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
