import type { ScoreBreakdown } from "@/types";

/**
 * 도시별 시즌 키워드 맵
 * 각 도시의 특정 월에 해당하는 시즌 하이라이트
 */
const SEASON_KEYWORDS: Record<string, Record<number, string>> = {
  osaka: { 3: "벚꽃 시즌", 4: "벚꽃 시즌", 10: "단풍 시즌", 11: "단풍 시즌" },
  tokyo: { 3: "벚꽃 시즌", 4: "벚꽃 시즌", 10: "단풍 시즌", 11: "단풍 시즌", 12: "일루미네이션" },
  fukuoka: { 3: "벚꽃 시즌", 4: "벚꽃 시즌", 7: "하카타 기온 야마카사" },
  danang: { 2: "건기 시즌", 3: "건기 시즌", 4: "건기 시즌", 5: "건기 시즌", 6: "건기 시즌", 7: "건기 시즌", 8: "건기 시즌" },
  bangkok: { 4: "송크란 축제", 11: "건기 시즌", 12: "건기 시즌", 1: "건기 시즌", 2: "건기 시즌" },
  guam: { 1: "건기 시즌", 2: "건기 시즌", 3: "건기 시즌", 4: "건기 시즌", 12: "건기 시즌" },
  cebu: { 1: "건기 시즌", 2: "건기 시즌", 3: "건기 시즌", 4: "건기 시즌", 5: "건기 시즌", 1.5: "시눌룩 축제" },
  taipei: { 2: "등불 축제", 3: "벚꽃 시즌", 10: "단풍 시즌" },
  singapore: { 7: "그레이트 싱가포르 세일", 12: "크리스마스 라이트업" },
  hongkong: { 2: "설 불꽃축제", 10: "미드오텀 페스티벌", 12: "크리스마스 장식" },
  bali: { 4: "건기 시즌", 5: "건기 시즌", 6: "건기 시즌", 7: "건기 시즌", 8: "건기 시즌", 9: "건기 시즌", 10: "건기 시즌" },
  "kota-kinabalu": { 1: "건기 시즌", 2: "건기 시즌", 3: "건기 시즌", 4: "건기 시즌", 5: "건기 시즌" },
  sapporo: { 2: "눈축제", 7: "라벤더 시즌", 8: "라벤더 시즌", 10: "단풍 시즌" },
  okinawa: { 3: "벚꽃 시즌", 6: "해변 시즌", 7: "해변 시즌", 8: "해변 시즌", 9: "해변 시즌" },
  hawaii: { 12: "서핑 시즌", 1: "서핑 시즌", 2: "고래 관찰 시즌", 6: "해변 시즌", 7: "해변 시즌", 8: "해변 시즌" },
  paris: { 4: "봄꽃 시즌", 5: "봄꽃 시즌", 6: "뮤직 페스티벌", 12: "크리스마스 마켓" },
  "los-angeles": { 6: "해변 시즌", 7: "해변 시즌", 8: "해변 시즌", 12: "할리우드 시즌" },
  london: { 6: "여름 페스티벌", 12: "크리스마스 마켓", 11: "가이 포크스 나이트" },
  barcelona: { 6: "해변 시즌", 7: "해변 시즌", 8: "해변 시즌", 9: "라 메르세 축제" },
  sydney: { 1: "여름 시즌", 2: "여름 시즌", 12: "여름 시즌", 10: "봄꽃 시즌" },
};

/**
 * 점수 기반 하이라이트 문구 생성
 *
 * @param cityId - 도시 ID
 * @param month  - 월 (1-12)
 * @param scores - 점수 분석 결과
 * @returns 1~3개의 한국어 하이라이트 문구 배열
 */
export function generateHighlights(
  cityId: string,
  month: number,
  scores: ScoreBreakdown
): string[] {
  const highlights: string[] = [];

  // 1. 시즌 키워드 (최우선)
  const seasonMap = SEASON_KEYWORDS[cityId];
  if (seasonMap && seasonMap[month]) {
    highlights.push(seasonMap[month]);
  }

  // 2. 점수 기반 하이라이트
  if (scores.weather >= 8) {
    if (!highlights.some((h) => h.includes("시즌"))) {
      highlights.push("날씨 최적");
    }
  } else if (scores.weather <= 3) {
    highlights.push("날씨 비추천");
  }

  if (scores.cost >= 8) {
    highlights.push("환율 유리");
  } else if (scores.cost <= 3) {
    highlights.push("물가 높음");
  }

  if (scores.crowd >= 8) {
    highlights.push("비수기 한산");
  } else if (scores.crowd <= 3) {
    highlights.push("성수기 혼잡");
  }

  if (scores.buzz >= 8) {
    highlights.push("SNS 인기 급상승");
  }

  // 3. 종합 점수 기반
  if (scores.total >= 8.5 && highlights.length < 3) {
    highlights.push("강력 추천 시기");
  }

  // 최대 3개 반환
  return highlights.slice(0, 3);
}
