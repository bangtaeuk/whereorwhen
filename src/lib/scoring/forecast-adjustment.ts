/**
 * 예보 기반 날씨 점수 보정
 *
 * 실시간 14일 예보의 맑은 날 비율을 역사 평균과 비교하여
 * -0.5 ~ +0.5 범위로 날씨 점수를 보정
 */

import type { ForecastSummary } from "@/types";

/**
 * 예보 요약에서 점수 보정값 계산
 * (이미 ForecastSummary.scoreAdjustment에 포함되어 있지만,
 *  외부에서 독립적으로 호출할 수 있도록 export)
 */
export function calculateForecastAdjustment(
  forecastClearRatio: number,
  historicalClearRatio: number,
): number {
  const diff = forecastClearRatio - historicalClearRatio;

  if (diff > 0.1) {
    return Math.min(0.5, Math.round(diff * 3 * 10) / 10);
  }
  if (diff < -0.1) {
    return Math.max(-0.5, Math.round(diff * 3 * 10) / 10);
  }
  return 0;
}

/**
 * 예보 요약에서 비교 텍스트 생성
 */
export function getForecastComparisonText(summary: ForecastSummary): string {
  const pct = Math.round(summary.clearRatio * 100);
  const histPct = Math.round(summary.historicalClearRatio * 100);

  if (summary.comparison === "better") {
    return `맑은 날 ${pct}% · 역사 평균(${histPct}%)보다 좋음`;
  }
  if (summary.comparison === "worse") {
    return `맑은 날 ${pct}% · 역사 평균(${histPct}%)보다 나쁨`;
  }
  return `맑은 날 ${pct}% · 역사 평균(${histPct}%)과 유사`;
}
