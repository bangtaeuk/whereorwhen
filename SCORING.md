# SCORING.md - whereorwhen 점수 산출 로직

이 문서는 whereorwhen의 **종합 점수** 산출 방식을 상세히 설명합니다.

---

## 1. 종합 점수 공식

```
원시 합계 = (0.35×날씨) + (0.25×비용) + (0.15×혼잡도) + (0.25×버즈)
종합 점수 = 5 + (원시 합계 - 5) × 1.3   ← 대비 확장(contrast expansion)
```

| 항목 | 가중치 | 설명 |
|------|--------|------|
| 날씨 | 35% | 기상 조건 쾌적도 |
| 비용 | 25% | 환율 + 절대 물가 기반 여행 비용 유리도 |
| 혼잡도 | 15% | 공휴일·성수기 한산도 |
| 버즈 | 25% | 검색 트렌드 기반 인기도 |

**대비 확장**: 가중 평균은 본질적으로 중앙(5점)으로 수렴하므로, 5점 기준으로 1.3배 확장하여 점수 분포를 넓힘. 예: 7.6 → 8.4, 5.0 → 5.0, 4.0 → 3.7

모든 개별 점수와 종합 점수는 **1.0 ~ 10.0** 범위입니다.

---

## 2. 점수 등급 테이블

| 점수 범위 | 등급 | 색상 | 의미 |
|-----------|------|------|------|
| 8.0 이상 | 최적 | Green (`#00C471`) | 여행하기 가장 좋은 시기 |
| 6.0 ~ 7.9 | 좋음 | Blue (`#3182F6`) | 여행하기 좋은 시기 |
| 4.0 ~ 5.9 | 보통 | Amber (`#F5A623`) | 무난하지만 최적은 아님 |
| 4.0 미만 | 비추천 | Red (`#E8554F`) | 여행하기 비추천 시기 |

---

## 3. 개별 점수 상세

### 3.1 날씨 점수 (Weather) — v2 보정

- **사용자 설명**: "10년 평균 기상 데이터 기반 맑은 날 비율과 쾌적 기온"
- **데이터 소스**: Open-Meteo Historical Weather API (2015-2024 10년 평균)

**공식 (v2):**
```
sunnyScore = 4 + 6 × sunny_ratio          (floor 4, 선형 매핑)
tempScore  = 2 + 8 × exp(-(temp - 22)² / (2 × 12²))  (σ=12, floor 2)
날씨 점수  = 0.5 × sunnyScore + 0.5 × tempScore
```

| sunny_ratio | sunny 점수 | 설명 |
|-------------|-----------|------|
| 0.2 | 5.2 | 흐린 날 많음 (장마/우기) |
| 0.3 | 5.8 | 보통 이하 |
| 0.5 | 7.0 | 보통 |
| 0.7 | 8.2 | 맑은 날 많음 |
| 0.9 | 9.4 | 매우 맑음 |

| avg_temp | temp 점수 | 설명 |
|----------|----------|------|
| 5°C | 5.3 | 추움 |
| 15°C | 8.7 | 선선 |
| 22°C | 10.0 | 최적 |
| 28°C | 9.3 | 따뜻 |
| 35°C | 6.5 | 더움 |

**v1 대비 변경점:**
- power curve(`sr^1.2`) → 선형(`4 + 6×sr`): 저sunny 기후 과도 감점 해소
- σ=8 → σ=12: 기온 벨 커브 관대화
- 비중 60:40 → 50:50: 기온 영향력 상향
- floor 1 → floor 4(sunny)/2(temp): 극단적 저점수 방지

### 3.2 비용 점수 (Cost) — v2 보정

- **사용자 설명**: "통화별 물가 수준 + 환율 변동 반영 — 저렴할수록 높은 점수"
- **데이터 소스**: ExchangeRate API + Frankfurter API (365일 백필)

**공식 (v2):**
```
baseCost = CURRENCY_BASE_COST[통화]       (JPY→7.5, EUR→4.0, GBP→3.5 등)
pctDiff  = (365일 평균 - 현재 환율) / 365일 평균 × 100
modifier = clamp(pctDiff × 0.3, -1.5, +1.5)
비용 점수 = clamp(baseCost + modifier, 1.0, 10.0)
```

| 통화 | 기본 점수 | 환율 +3% 유리 | 환율 -3% 불리 |
|------|----------|--------------|--------------|
| VND (베트남) | 8.0 | 8.9 | 7.1 |
| JPY (일본) | 7.5 | 8.4 | 6.6 |
| THB (태국) | 7.5 | 8.4 | 6.6 |
| EUR (유럽) | 4.0 | 4.9 | 3.1 |
| GBP (영국) | 3.5 | 4.4 | 2.6 |
| CHF (스위스) | 3.0 | 3.9 | 2.1 |

**v1 대비 변경점:**
- tanh sigmoid(`5.5 + 4.5×tanh(pctDiff/10)`) → 기본 물가 + 환율 modifier
- 통화별 절대 물가 차이를 반영 (엔화 7.5 vs 파운드 3.5)
- 환율 변동 ±5%를 ±1.5점으로 제한 (과도한 변동 방지)

### 3.3 혼잡도 점수 (Crowd)

- **사용자 설명**: "한국 공휴일·현지 공휴일·성수기 여부 종합 — 한산할수록 높은 점수"
- **데이터 소스**: Nager.Date API (한국/현지 공휴일)
- **공식**: 기본 9.0에서 감점
  - 성수기(7, 8, 12, 1월): -2.0
  - 한국 공휴일: 1개당 -1.0 (최대 -4.0)
  - 현지 공휴일: 1개당 -0.5 (최대 -3.0)

### 3.4 버즈 점수 (Buzz) — v2 보정

- **사용자 설명**: "네이버 검색 트렌드 기반 월별 여행 관심도 — 인기 시즌일수록 높은 점수"
- **데이터 소스**: 네이버 DataLab 검색 트렌드 API

**공식 (v2):**
```
ratio = 월별 검색량 / 연간 평균
버즈 점수 = 3 + 7 × sigmoid(-4 × (ratio - 1))
```

| ratio | 점수 | 설명 |
|-------|------|------|
| 0.5 | 3.8 | 비수기 |
| 0.8 | 5.4 | 평균 이하 |
| 1.0 | 6.5 | 평균 |
| 1.3 | 8.4 | 인기 시즌 |
| 1.5 | 9.2 | 최고 시즌 |

**v1 대비 변경점:**
- sigmoid 감도: k=2.5 → k=4 (더 넓은 점수 분포)
- floor: 2 → 3, range: 8 → 7

---

## 4. v2 보너스 점수 (오늘의 BEST 타이밍)

기본 종합 점수에 보너스를 더하여 "오늘의 BEST" 순위를 산출합니다.

```
오늘의_점수 = 종합 점수 + 환율 보너스 + 예보 보너스 + 시즌 보너스 + 시의성 보너스
```

| 보너스 | 조건 | 점수 |
|--------|------|------|
| 환율 | 3개월 내 최저점 | +1.0 |
| 환율 | 1개월 내 최저점 | +0.5 |
| 예보 | 14일 예보가 역사 평균보다 좋음 | +0.5 |
| 시즌 | 시즌 시작 직전 (2주 이내) | +0.5 |
| 시즌 | 시즌 중 | +0.3 |
| 시의성 | 추천 시기까지 4-8주 (예약 적정) | +0.3 |

---

## 5. 데이터 갱신 주기

| 데이터 | 갱신 주기 | 방법 |
|--------|-----------|------|
| 날씨 (10년 평균) | 연 1회 또는 수동 | `collect-weather.ts` |
| 환율 | 매일 03:00 UTC | `collect-exchange.ts` (GitHub Actions) |
| 14일 예보 | 6시간마다 | `collect-forecast.ts` (GitHub Actions) |
| 공휴일 | 연 1회 또는 수동 | `collect-holidays.ts` |
| 검색 트렌드 | 매월 1일 | `collect-trend.ts` (GitHub Actions) |
| 점수 재계산 | 매일 (환율 수집 후) | `calculate-scores.ts` |
| 오늘의 BEST | 매일 (점수 계산 후) | `calculate-today-best.ts` |
| 환율 백필 | 수동 (workflow_dispatch) | `backfill-exchange.ts` |

---

## 6. 수집 스크립트 목록

| 스크립트 | 설명 | 필수 환경변수 |
|----------|------|---------------|
| `src/scripts/collect-weather.ts` | Open-Meteo에서 10년치 날씨 데이터 수집 | 없음 |
| `src/scripts/collect-exchange.ts` | ExchangeRate API에서 일일 환율 수집 | `EXCHANGE_RATE_API_KEY` |
| `src/scripts/backfill-exchange.ts` | Frankfurter API로 과거 365일 환율 백필 | 없음 (무료 API) |
| `src/scripts/collect-holidays.ts` | Nager.Date에서 공휴일 수집 | 없음 |
| `src/scripts/collect-buzz.ts` | 네이버 Blog Search에서 블로그 버즈 수집 | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` |
| `src/scripts/collect-trend.ts` | 네이버 DataLab에서 검색 트렌드 수집 | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` |
| `src/scripts/collect-forecast.ts` | Open-Meteo에서 14일 예보 수집 | 없음 |
| `src/scripts/calculate-scores.ts` | 수집된 데이터 기반 점수 계산 | 없음 |
| `src/scripts/calculate-today-best.ts` | 오늘의 BEST 타이밍 계산 | 없음 |
| `src/scripts/init-all.ts` | 마스터 초기화 (전체 수집 + 점수 계산) | 전체 |

### 실행 순서 (init-all.ts)

```
1. collect-weather.ts    — 10년치 날씨 (가장 오래 걸림, 83도시)
2. collect-holidays.ts   — 공휴일
3. collect-exchange.ts   — 환율
4. collect-forecast.ts   — 14일 예보
5. collect-trend.ts      — 검색 트렌드 (NAVER API 키 필요, 없으면 스킵)
6. calculate-scores.ts   — 점수 계산
7. calculate-today-best.ts — 오늘의 BEST 계산
```

---

## 7. 도시 커버리지

총 **83개 도시** (기존 20 + 신규 63)

| 지역 | 도시 수 | 통화 |
|------|---------|------|
| 일본 | 13 | JPY |
| 동남아시아 | 16 | VND, THB, PHP, IDR, MYR, SGD, KHR, LAK, MMK |
| 동아시아 (대만/홍콩/마카오) | 5 | TWD, HKD, MOP |
| 중동 | 2 | AED, TRY |
| 유럽 | 22 | EUR, GBP, CZK, CHF, HUF, PLN, ISK, NOK, SEK, DKK |
| 미주 | 8 | USD, CAD, MXN |
| 오세아니아 | 4 | AUD, NZD |
| 리조트/섬 | 6 | USD, MVR, FJD |
