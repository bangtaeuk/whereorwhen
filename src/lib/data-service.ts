import { createClient } from "@supabase/supabase-js";
import type { City, MonthlyScore } from "@/types";
import { cities } from "@/data/cities";
import {
  getScoresForCity as getMockScoresForCity,
  getScoresForMonth as getMockScoresForMonth,
} from "@/data/mock-scores";

// ---------------------------------------------------------------------------
// Supabase client (anon key for reads)
// ---------------------------------------------------------------------------
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---------------------------------------------------------------------------
// Static data (no DB needed)
// ---------------------------------------------------------------------------

/** 도시 목록 조회 (검색어 필터 지원) */
export function getCities(search?: string): City[] {
  if (!search) return cities;

  const q = search.toLowerCase().trim();
  return cities.filter(
    (c) =>
      c.nameKo.includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.id.includes(q) ||
      c.country.includes(q)
  );
}

/** 도시 단건 조회 */
export function getCityById(id: string): City | undefined {
  return cities.find((c) => c.id === id);
}

// ---------------------------------------------------------------------------
// Score queries (Supabase with mock fallback)
// ---------------------------------------------------------------------------

/** scores_cache row → MonthlyScore 변환 */
interface ScoresCacheRow {
  city_id: string;
  month: number;
  weather: number;
  cost: number;
  crowd: number;
  buzz: number;
  total: number;
}

function toMonthlyScore(row: ScoresCacheRow): MonthlyScore {
  return {
    cityId: row.city_id,
    month: row.month,
    scores: {
      weather: row.weather,
      cost: row.cost,
      crowd: row.crowd,
      buzz: row.buzz,
      total: row.total,
    },
  };
}

/** Mode A: 특정 도시의 12개월 점수 */
export async function getScoresForCity(
  cityId: string
): Promise<MonthlyScore[]> {
  const supabase = getSupabase();
  if (!supabase) return getMockScoresForCity(cityId);

  const { data, error } = await supabase
    .from("scores_cache")
    .select("city_id, month, weather, cost, crowd, buzz, total")
    .eq("city_id", cityId)
    .order("month", { ascending: true });

  if (error || !data || data.length === 0) {
    return getMockScoresForCity(cityId);
  }

  return (data as ScoresCacheRow[]).map(toMonthlyScore);
}

/** Mode B: 특정 월의 전체 도시 점수 (total 내림차순) */
export async function getRankingForMonth(
  month: number
): Promise<MonthlyScore[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return getMockScoresForMonth(month).sort(
      (a, b) => b.scores.total - a.scores.total
    );
  }

  const { data, error } = await supabase
    .from("scores_cache")
    .select("city_id, month, weather, cost, crowd, buzz, total")
    .eq("month", month)
    .order("total", { ascending: false });

  if (error || !data || data.length === 0) {
    return getMockScoresForMonth(month).sort(
      (a, b) => b.scores.total - a.scores.total
    );
  }

  return (data as ScoresCacheRow[]).map(toMonthlyScore);
}
