import type { Score } from "@/types";

/**
 * 월별 평균 맑은 날 비율 (위도 기반 추정)
 * PRD §4.2: 맑은 날 비율 + 쾌적 기온 범위 (15-28°C)
 */

/** 위도 기반 월별 평균 기온 추정 (°C) */
function estimateMonthlyTemp(month: number, latitude: number): number {
  // 기본 연평균 기온: 적도 ~27°C, 극지방 ~-10°C
  const baseTemp = 27 - Math.abs(latitude) * 0.6;

  // 계절 변동: 위도가 높을수록 진폭 크게
  const amplitude = Math.abs(latitude) * 0.35;

  // 남반구는 계절이 반대
  const hemisphereOffset = latitude < 0 ? 6 : 0;
  const adjustedMonth = ((month - 1 + hemisphereOffset) % 12) + 1;

  // 7월이 가장 더움 (북반구 기준), 1월이 가장 추움
  const seasonalFactor = Math.cos(((adjustedMonth - 7) * Math.PI) / 6);

  return baseTemp + amplitude * seasonalFactor;
}

/** 위도 기반 월별 맑은 날 비율 추정 (0-1) */
function estimateSunnyRatio(month: number, latitude: number): number {
  const absLat = Math.abs(latitude);

  // 열대 (위도 0-15): 건기/우기 구분, 대체로 맑은 편
  if (absLat <= 15) {
    // 우기: 5-10월(북반구), 11-4월(남반구)
    const hemisphereOffset = latitude < 0 ? 6 : 0;
    const adjustedMonth = ((month - 1 + hemisphereOffset) % 12) + 1;
    const isWetSeason = adjustedMonth >= 5 && adjustedMonth <= 10;
    return isWetSeason ? 0.45 : 0.7;
  }

  // 아열대 (15-30): 여름 습하고 겨울 건조
  if (absLat <= 30) {
    const hemisphereOffset = latitude < 0 ? 6 : 0;
    const adjustedMonth = ((month - 1 + hemisphereOffset) % 12) + 1;
    // 여름(6-8) 우기, 겨울 건기
    const summerFactor = Math.cos(((adjustedMonth - 7) * Math.PI) / 6);
    return 0.55 + summerFactor * -0.1;
  }

  // 온대 (30-50): 봄가을 좋고 겨울 흐림
  if (absLat <= 50) {
    const hemisphereOffset = latitude < 0 ? 6 : 0;
    const adjustedMonth = ((month - 1 + hemisphereOffset) % 12) + 1;
    // 여름에 맑은 날 많음
    const seasonalFactor = Math.cos(((adjustedMonth - 7) * Math.PI) / 6);
    return 0.5 + seasonalFactor * 0.2;
  }

  // 고위도 (50+): 겨울 매우 흐림, 여름 비교적 맑음
  const hemisphereOffset = latitude < 0 ? 6 : 0;
  const adjustedMonth = ((month - 1 + hemisphereOffset) % 12) + 1;
  const seasonalFactor = Math.cos(((adjustedMonth - 7) * Math.PI) / 6);
  return 0.4 + seasonalFactor * 0.25;
}

/**
 * 날씨 점수 계산 (PRD §4.2)
 *
 * - 맑은 날 비율 (50% 반영)
 * - 쾌적 기온 (15-28°C) 근접도 (50% 반영)
 *
 * @param month - 월 (1-12)
 * @param latitude - 위도 (-90 ~ 90)
 * @returns Score (1.0 ~ 10.0)
 */
export function calculateWeatherScore(month: number, latitude: number): Score {
  const temp = estimateMonthlyTemp(month, latitude);
  const sunnyRatio = estimateSunnyRatio(month, latitude);

  // 기온 점수: 15-28°C가 이상적, 벗어날수록 감점
  let tempScore: number;
  if (temp >= 15 && temp <= 28) {
    // 쾌적 범위 내: 21.5°C(중앙값)에 가까울수록 높은 점수
    const distFromIdeal = Math.abs(temp - 21.5);
    tempScore = 10 - distFromIdeal * 0.3;
  } else if (temp < 15) {
    tempScore = Math.max(1, 10 - (15 - temp) * 0.6);
  } else {
    tempScore = Math.max(1, 10 - (temp - 28) * 0.5);
  }

  // 맑은 날 점수: 비율을 1-10으로 매핑
  const sunnyScore = 1 + sunnyRatio * 9;

  // 종합: 기온 50%, 맑은 날 50%
  const raw = tempScore * 0.5 + sunnyScore * 0.5;
  return Math.round(Math.min(10, Math.max(1, raw)) * 10) / 10;
}
