/**
 * Open-Meteo Forecast API 클라이언트
 *
 * 14일 예보를 조회하고, 맑은 날 비율/평균 기온을 계산
 * Supabase forecast_cache 테이블에 6시간 TTL로 캐시
 */

import { createClient } from "@supabase/supabase-js";
import type { ForecastDay, ForecastSummary } from "@/types";

// ---------------------------------------------------------------------------
// Weather code mapping (WMO)
// ---------------------------------------------------------------------------
const WEATHER_ICONS: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌧️", 53: "🌧️", 55: "🌧️", 56: "🌧️", 57: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️", 66: "🌧️", 67: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "🌨️", 77: "🌨️",
  80: "🌧️", 81: "🌧️", 82: "🌧️",
  85: "🌨️", 86: "🌨️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

function isClearWeather(code: number): boolean {
  return code <= 2;
}

function getWeatherIcon(code: number): string {
  return WEATHER_ICONS[code] ?? "🌤️";
}

// ---------------------------------------------------------------------------
// Open-Meteo Forecast API
// ---------------------------------------------------------------------------
interface OpenMeteoForecastResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weather_code: number[];
  };
}

export async function fetchForecastFromAPI(
  latitude: number,
  longitude: number,
  forecastDays: number = 14,
): Promise<ForecastDay[]> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
    forecast_days: String(forecastDays),
    timezone: "auto",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Open-Meteo Forecast API error ${res.status}: ${body}`);
  }

  const data: OpenMeteoForecastResponse = await res.json();
  const days: ForecastDay[] = [];

  for (let i = 0; i < data.daily.time.length; i++) {
    const code = data.daily.weather_code[i];
    days.push({
      date: data.daily.time[i],
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      precipitation: data.daily.precipitation_sum[i],
      weatherCode: code,
      weatherIcon: getWeatherIcon(code),
      isClear: isClearWeather(code),
    });
  }

  return days;
}

// ---------------------------------------------------------------------------
// Supabase cache
// ---------------------------------------------------------------------------
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface ForecastCacheRow {
  city_id: string;
  forecast_data: string;
  fetched_at: string;
}

export async function getCachedForecast(
  cityId: string,
): Promise<ForecastDay[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("forecast_cache")
    .select("forecast_data, fetched_at")
    .eq("city_id", cityId)
    .single();

  if (error || !data) return null;

  const row = data as ForecastCacheRow;
  const fetchedAt = new Date(row.fetched_at).getTime();
  if (Date.now() - fetchedAt > CACHE_TTL_MS) return null;

  try {
    return JSON.parse(row.forecast_data) as ForecastDay[];
  } catch {
    return null;
  }
}

export async function saveForecastCache(
  cityId: string,
  days: ForecastDay[],
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("forecast_cache").upsert(
    {
      city_id: cityId,
      forecast_data: JSON.stringify(days),
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "city_id" },
  );
}

// ---------------------------------------------------------------------------
// Build forecast summary with historical comparison
// ---------------------------------------------------------------------------
export async function buildForecastSummary(
  cityId: string,
  days: ForecastDay[],
): Promise<ForecastSummary> {
  const clearDays = days.filter((d) => d.isClear).length;
  const clearRatio = days.length > 0 ? clearDays / days.length : 0;
  const avgTemp =
    days.length > 0
      ? days.reduce((sum, d) => sum + (d.tempMax + d.tempMin) / 2, 0) / days.length
      : 0;

  // Historical average from weather_monthly
  let historicalClearRatio = 0.6; // default fallback
  const supabase = getSupabase();
  if (supabase && days.length > 0) {
    const month = new Date(days[0].date).getMonth() + 1;
    const { data } = await supabase
      .from("weather_monthly")
      .select("sunny_ratio")
      .eq("city_id", cityId)
      .eq("month", month)
      .single();
    if (data && typeof data.sunny_ratio === "number") {
      historicalClearRatio = data.sunny_ratio;
    }
  }

  const diff = clearRatio - historicalClearRatio;
  let comparison: "better" | "similar" | "worse";
  let scoreAdjustment: number;

  if (diff > 0.10) {
    comparison = "better";
    scoreAdjustment = Math.min(0.5, Math.round(diff * 3 * 10) / 10);
  } else if (diff < -0.10) {
    comparison = "worse";
    scoreAdjustment = Math.max(-0.5, Math.round(diff * 3 * 10) / 10);
  } else {
    comparison = "similar";
    scoreAdjustment = 0;
  }

  return {
    cityId,
    days,
    clearDays,
    clearRatio: Math.round(clearRatio * 100) / 100,
    avgTemp: Math.round(avgTemp * 10) / 10,
    historicalClearRatio: Math.round(historicalClearRatio * 100) / 100,
    comparison,
    scoreAdjustment,
    fetchedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// High-level: get forecast (cache-first, then API)
// ---------------------------------------------------------------------------
export async function getForecast(
  cityId: string,
  latitude: number,
  longitude: number,
): Promise<ForecastSummary> {
  let days = await getCachedForecast(cityId);

  if (!days) {
    days = await fetchForecastFromAPI(latitude, longitude);
    await saveForecastCache(cityId, days);
  }

  return buildForecastSummary(cityId, days);
}
