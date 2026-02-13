export { calculateWeatherScore } from "./weather";
export { calculateCostScore } from "./cost";
export { calculateCrowdScore } from "./crowd";
export { calculateBuzzScore } from "./buzz";

import type { MonthlyScore, ScoreBreakdown, ScoreWeights } from "@/types";
import { DEFAULT_WEIGHTS } from "@/lib/score";
import { calculateWeatherScore } from "./weather";
import { calculateCostScore } from "./cost";
import { calculateCrowdScore } from "./crowd";
import { calculateBuzzScore } from "./buzz";

/**
 * 도시의 특정 월 종합 점수 계산
 */
export function calculateMonthlyScore(
  cityId: string,
  month: number,
  options: {
    latitude: number;
    currency: string;
    countryCode: string;
  },
  weights: ScoreWeights = DEFAULT_WEIGHTS
): MonthlyScore {
  const weather = calculateWeatherScore(month, options.latitude);
  const cost = calculateCostScore(options.currency, month);
  const crowd = calculateCrowdScore(options.countryCode, month);
  const buzz = calculateBuzzScore(cityId, month);

  const total =
    weights.weather * weather +
    weights.cost * cost +
    weights.crowd * crowd +
    weights.buzz * buzz;

  const scores: ScoreBreakdown = {
    weather,
    cost,
    crowd,
    buzz,
    total: Math.round(total * 10) / 10,
  };

  return { cityId, month, scores };
}
