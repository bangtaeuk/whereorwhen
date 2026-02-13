import type { City, MonthlyScore, ScoreBreakdown } from "@/types";
import { cities } from "@/data/cities";
import { calculateTotalScore } from "@/lib/score";

/**
 * 임시 Mock 점수 생성기
 * 실제 DB/API 연동 전까지 사용하는 결정론적 시뮬레이션 데이터
 * cityId + month 조합으로 항상 동일한 점수를 반환
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMockScores(cityId: string, month: number): ScoreBreakdown {
  const cityHash = Array.from(cityId).reduce(
    (acc, c) => acc + c.charCodeAt(0),
    0
  );
  const base = cityHash * 13 + month * 7;

  const weather =
    Math.round((3 + seededRandom(base + 1) * 7) * 10) / 10;
  const cost =
    Math.round((3 + seededRandom(base + 2) * 7) * 10) / 10;
  const crowd =
    Math.round((3 + seededRandom(base + 3) * 7) * 10) / 10;
  const buzz =
    Math.round((3 + seededRandom(base + 4) * 7) * 10) / 10;

  const total = calculateTotalScore({ weather, cost, crowd, buzz });

  return { weather, cost, crowd, buzz, total };
}

// ---------------------------------------------------------------------------
// Public API
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

/** Mode A: 특정 도시의 12개월 점수 */
export function getScoresForCity(cityId: string): MonthlyScore[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      cityId,
      month,
      scores: generateMockScores(cityId, month),
    };
  });
}

/** Mode B: 특정 월의 전체 도시 점수 (total 내림차순) */
export function getRankingForMonth(month: number): MonthlyScore[] {
  return cities
    .map((city) => ({
      cityId: city.id,
      month,
      scores: generateMockScores(city.id, month),
    }))
    .sort((a, b) => b.scores.total - a.scores.total);
}
