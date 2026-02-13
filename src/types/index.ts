/** 점수 범위: 1.0 ~ 10.0 */
export type Score = number;

/** 개별 점수 항목 */
export interface ScoreBreakdown {
  weather: Score;
  cost: Score;
  crowd: Score;
  buzz: Score;
  total: Score;
}

/** 점수 가중치 */
export interface ScoreWeights {
  weather: number; // 0.35
  cost: number; // 0.25
  crowd: number; // 0.15
  buzz: number; // 0.25
}

/** 도시 정보 */
export interface City {
  id: string;
  nameKo: string;
  nameEn: string;
  country: string;
  countryCode: string;
  currency: string;
  latitude: number;
  longitude: number;
  keywords: string[];
}

/** 월별 점수 */
export interface MonthlyScore {
  cityId: string;
  month: number; // 1-12
  scores: ScoreBreakdown;
}

/** 점수 등급 */
export type ScoreGrade = "best" | "good" | "average" | "poor";

/** 모드 */
export type AppMode = "where-to-when" | "when-to-where";
