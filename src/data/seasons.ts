/**
 * 도시별 시즌 메타데이터
 * "오늘의 BEST 타이밍" 시즌 보너스 계산에 사용
 *
 * 기존 highlights.ts의 SEASON_KEYWORDS를 시작/종료일 포함하여 확장
 */

export interface SeasonEntry {
  cityId: string;
  name: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export const seasons: SeasonEntry[] = [
  // ── 일본 ──────────────────────────────────────
  { cityId: "osaka", name: "벚꽃 시즌", startMonth: 3, startDay: 20, endMonth: 4, endDay: 15 },
  { cityId: "osaka", name: "단풍 시즌", startMonth: 10, startDay: 20, endMonth: 11, endDay: 30 },
  { cityId: "tokyo", name: "벚꽃 시즌", startMonth: 3, startDay: 20, endMonth: 4, endDay: 10 },
  { cityId: "tokyo", name: "단풍 시즌", startMonth: 11, startDay: 10, endMonth: 12, endDay: 5 },
  { cityId: "tokyo", name: "일루미네이션", startMonth: 11, startDay: 15, endMonth: 12, endDay: 25 },
  { cityId: "fukuoka", name: "벚꽃 시즌", startMonth: 3, startDay: 20, endMonth: 4, endDay: 10 },
  { cityId: "fukuoka", name: "하카타 기온 야마카사", startMonth: 7, startDay: 1, endMonth: 7, endDay: 15 },
  { cityId: "sapporo", name: "눈축제", startMonth: 2, startDay: 4, endMonth: 2, endDay: 11 },
  { cityId: "sapporo", name: "라벤더 시즌", startMonth: 7, startDay: 1, endMonth: 8, endDay: 15 },
  { cityId: "sapporo", name: "단풍 시즌", startMonth: 10, startDay: 1, endMonth: 10, endDay: 31 },
  { cityId: "okinawa", name: "해변 시즌", startMonth: 6, startDay: 1, endMonth: 9, endDay: 30 },
  { cityId: "okinawa", name: "벚꽃 시즌", startMonth: 1, startDay: 20, endMonth: 2, endDay: 15 },

  // ── 동남아시아 ─────────────────────────────────
  { cityId: "danang", name: "건기 시즌", startMonth: 3, startDay: 1, endMonth: 8, endDay: 31 },
  { cityId: "bangkok", name: "건기 시즌", startMonth: 11, startDay: 1, endMonth: 2, endDay: 28 },
  { cityId: "bangkok", name: "송크란 축제", startMonth: 4, startDay: 13, endMonth: 4, endDay: 15 },
  { cityId: "cebu", name: "건기 시즌", startMonth: 1, startDay: 1, endMonth: 5, endDay: 31 },
  { cityId: "cebu", name: "시눌룩 축제", startMonth: 1, startDay: 10, endMonth: 1, endDay: 20 },
  { cityId: "bali", name: "건기 시즌", startMonth: 4, startDay: 1, endMonth: 10, endDay: 31 },
  { cityId: "kota-kinabalu", name: "건기 시즌", startMonth: 1, startDay: 1, endMonth: 5, endDay: 31 },
  { cityId: "singapore", name: "그레이트 싱가포르 세일", startMonth: 6, startDay: 15, endMonth: 8, endDay: 15 },
  { cityId: "singapore", name: "크리스마스 라이트업", startMonth: 11, startDay: 15, endMonth: 1, endDay: 2 },

  // ── 대만/홍콩 ─────────────────────────────────
  { cityId: "taipei", name: "등불 축제", startMonth: 2, startDay: 1, endMonth: 2, endDay: 28 },
  { cityId: "taipei", name: "벚꽃 시즌", startMonth: 2, startDay: 15, endMonth: 3, endDay: 15 },
  { cityId: "hongkong", name: "크리스마스 장식", startMonth: 11, startDay: 20, endMonth: 1, endDay: 2 },
  { cityId: "hongkong", name: "미드오텀 페스티벌", startMonth: 9, startDay: 15, endMonth: 10, endDay: 15 },

  // ── 미주/태평양 ────────────────────────────────
  { cityId: "guam", name: "건기 시즌", startMonth: 12, startDay: 1, endMonth: 4, endDay: 30 },
  { cityId: "hawaii", name: "서핑 시즌", startMonth: 11, startDay: 1, endMonth: 2, endDay: 28 },
  { cityId: "hawaii", name: "고래 관찰 시즌", startMonth: 1, startDay: 15, endMonth: 3, endDay: 31 },
  { cityId: "hawaii", name: "해변 시즌", startMonth: 6, startDay: 1, endMonth: 8, endDay: 31 },
  { cityId: "los-angeles", name: "해변 시즌", startMonth: 6, startDay: 1, endMonth: 9, endDay: 15 },

  // ── 유럽 ──────────────────────────────────────
  { cityId: "paris", name: "봄꽃 시즌", startMonth: 4, startDay: 1, endMonth: 5, endDay: 31 },
  { cityId: "paris", name: "뮤직 페스티벌", startMonth: 6, startDay: 15, endMonth: 7, endDay: 15 },
  { cityId: "paris", name: "크리스마스 마켓", startMonth: 11, startDay: 20, endMonth: 12, endDay: 31 },
  { cityId: "london", name: "여름 페스티벌", startMonth: 6, startDay: 1, endMonth: 8, endDay: 31 },
  { cityId: "london", name: "크리스마스 마켓", startMonth: 11, startDay: 15, endMonth: 12, endDay: 31 },
  { cityId: "barcelona", name: "해변 시즌", startMonth: 6, startDay: 1, endMonth: 9, endDay: 15 },
  { cityId: "barcelona", name: "라 메르세 축제", startMonth: 9, startDay: 20, endMonth: 9, endDay: 24 },

  // ── 호주 ──────────────────────────────────────
  { cityId: "sydney", name: "여름 시즌", startMonth: 12, startDay: 1, endMonth: 2, endDay: 28 },
  { cityId: "sydney", name: "봄꽃 시즌", startMonth: 9, startDay: 15, endMonth: 11, endDay: 15 },
];

/**
 * 특정 날짜가 시즌 범위 안에 있는지 확인
 * 연도 경계를 넘는 시즌(예: 11월~2월)도 처리
 */
export function isDateInSeason(month: number, day: number, season: SeasonEntry): boolean {
  const current = month * 100 + day;
  const start = season.startMonth * 100 + season.startDay;
  const end = season.endMonth * 100 + season.endDay;

  if (start <= end) {
    return current >= start && current <= end;
  }
  // 연도 경계를 넘는 경우 (예: 11월~2월)
  return current >= start || current <= end;
}

/**
 * 특정 날짜에서 시즌 시작까지 남은 일수 계산
 * 이미 시즌 중이면 0 반환, 시즌이 지났으면 다음 해 시즌까지 계산
 */
export function daysUntilSeasonStart(
  today: Date,
  season: SeasonEntry,
): number {
  const year = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  if (isDateInSeason(currentMonth, currentDay, season)) return 0;

  let seasonStart = new Date(year, season.startMonth - 1, season.startDay);
  if (seasonStart <= today) {
    seasonStart = new Date(year + 1, season.startMonth - 1, season.startDay);
  }

  const diffMs = seasonStart.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 특정 도시의 시즌 목록 조회
 */
export function getSeasonsForCity(cityId: string): SeasonEntry[] {
  return seasons.filter((s) => s.cityId === cityId);
}
