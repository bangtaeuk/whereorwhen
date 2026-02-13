import type { ScoreBreakdown, ScoreGrade, ScoreWeights } from "@/types";

/**
 * 점수 가중치 (PRD §4.1)
 */
export const DEFAULT_WEIGHTS: ScoreWeights = {
  weather: 0.35,
  cost: 0.25,
  crowd: 0.15,
  buzz: 0.25,
};

/**
 * 종합 점수 계산
 * 종합 점수 = W1 x 날씨 + W2 x 비용 + W3 x 혼잡도 + W4 x 버즈
 */
export function calculateTotalScore(
  scores: Omit<ScoreBreakdown, "total">,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): number {
  const total =
    weights.weather * scores.weather +
    weights.cost * scores.cost +
    weights.crowd * scores.crowd +
    weights.buzz * scores.buzz;

  return Math.round(total * 10) / 10;
}

/**
 * 점수 등급 판별 (PRD §6.2)
 * - 8.0 ~ 10.0: best (초록)
 * - 6.0 ~ 7.9: good (연두/노란)
 * - 4.0 ~ 5.9: average (주황)
 * - 1.0 ~ 3.9: poor (빨간)
 */
export function getScoreGrade(score: number): ScoreGrade {
  if (score >= 8.0) return "best";
  if (score >= 6.0) return "good";
  if (score >= 4.0) return "average";
  return "poor";
}

/**
 * 점수 등급에 따른 색상 (PRD §6.2)
 */
export const SCORE_COLORS: Record<ScoreGrade, string> = {
  best: "#22c55e",
  good: "#eab308",
  average: "#f97316",
  poor: "#ef4444",
};
