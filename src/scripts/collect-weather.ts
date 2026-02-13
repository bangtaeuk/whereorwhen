import "dotenv/config";

/**
 * Open-Meteo Historical Weather API 데이터 수집 스크립트
 * Run: npx tsx src/scripts/collect-weather.ts
 *
 * 10년치(2015-2024) 일별 데이터를 월별 평균으로 집계하여
 * Supabase weather_monthly 테이블에 UPSERT
 */

import { createClient } from "@supabase/supabase-js";
import { cities } from "../data/cities";

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------
function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weather_code: number[];
  };
}

interface MonthlyAgg {
  city_id: string;
  month: number;
  avg_temp: number;
  max_temp: number;
  min_temp: number;
  precip_mm: number;
  sunny_ratio: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ---------------------------------------------------------------------------
// Fetch weather data from Open-Meteo Archive API
// ---------------------------------------------------------------------------
async function fetchWeather(
  lat: number,
  lng: number
): Promise<OpenMeteoResponse> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    start_date: "2015-01-01",
    end_date: "2024-12-31",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
    timezone: "auto",
  });

  const url = `https://archive-api.open-meteo.com/v1/archive?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Open-Meteo API error ${res.status}: ${body}`);
  }

  return (await res.json()) as OpenMeteoResponse;
}

// ---------------------------------------------------------------------------
// Aggregate daily → monthly
// ---------------------------------------------------------------------------
function aggregateMonthly(
  cityId: string,
  data: OpenMeteoResponse["daily"]
): MonthlyAgg[] {
  // Group indices by month (1-12)
  const buckets: Map<
    number,
    { maxTemps: number[]; minTemps: number[]; precip: number[]; codes: number[] }
  > = new Map();

  for (let m = 1; m <= 12; m++) {
    buckets.set(m, { maxTemps: [], minTemps: [], precip: [], codes: [] });
  }

  for (let i = 0; i < data.time.length; i++) {
    const month = new Date(data.time[i]).getMonth() + 1; // 1-based
    const bucket = buckets.get(month)!;

    if (data.temperature_2m_max[i] != null) {
      bucket.maxTemps.push(data.temperature_2m_max[i]);
    }
    if (data.temperature_2m_min[i] != null) {
      bucket.minTemps.push(data.temperature_2m_min[i]);
    }
    if (data.precipitation_sum[i] != null) {
      bucket.precip.push(data.precipitation_sum[i]);
    }
    if (data.weather_code[i] != null) {
      bucket.codes.push(data.weather_code[i]);
    }
  }

  const results: MonthlyAgg[] = [];

  for (let m = 1; m <= 12; m++) {
    const b = buckets.get(m)!;
    const avgMax = mean(b.maxTemps);
    const avgMin = mean(b.minTemps);

    // precip_mm = mean of monthly totals across years
    // Group daily precip by year-month, sum each, then average
    const precipByYearMonth = new Map<string, number>();
    for (let i = 0; i < data.time.length; i++) {
      const d = new Date(data.time[i]);
      if (d.getMonth() + 1 !== m) continue;
      if (data.precipitation_sum[i] == null) continue;
      const key = `${d.getFullYear()}-${m}`;
      precipByYearMonth.set(
        key,
        (precipByYearMonth.get(key) ?? 0) + data.precipitation_sum[i]
      );
    }
    const monthlyPrecipTotals = Array.from(precipByYearMonth.values());

    // sunny_ratio: WMO codes 0, 1, 2 are clear / mostly clear
    const sunnyDays = b.codes.filter((c) => c < 3).length;
    const totalDays = b.codes.length;

    results.push({
      city_id: cityId,
      month: m,
      avg_temp: round2((avgMax + avgMin) / 2),
      max_temp: round2(avgMax),
      min_temp: round2(avgMin),
      precip_mm: round2(mean(monthlyPrecipTotals)),
      sunny_ratio: round2(totalDays > 0 ? sunnyDays / totalDays : 0),
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`Starting weather collection for ${cities.length} cities...\n`);

  let totalRows = 0;

  for (const city of cities) {
    process.stdout.write(`Collecting weather for ${city.nameKo}...`);

    try {
      const response = await fetchWeather(city.latitude, city.longitude);
      const rows = aggregateMonthly(city.id, response.daily);

      const { error } = await supabase
        .from("weather_monthly")
        .upsert(rows, { onConflict: "city_id,month" });

      if (error) {
        throw new Error(`Supabase upsert error: ${error.message}`);
      }

      totalRows += rows.length;
      console.log(` done (${rows.length} months)`);
    } catch (err) {
      console.error(
        ` FAILED: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // 5-second delay between cities (Open-Meteo rate limit: ~10 req/min)
    await sleep(5000);
  }

  console.log(`\nComplete! Upserted ${totalRows} rows total.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
