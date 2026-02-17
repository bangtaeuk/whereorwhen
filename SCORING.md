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

| 통화 | 기본 점수 (v2.1) | 환율 +3% 유리 | 환율 -3% 불리 |
|------|------------------|--------------|--------------|
| VND (베트남) | 8.0 | 8.9 | 7.1 |
| JPY (일본) | 7.5 | 8.4 | 6.6 |
| THB (태국) | 7.5 | 8.4 | 6.6 |
| TRY (터키) | 7.5 | 8.4 | 6.6 |
| HUF (헝가리) | 6.5 | 7.4 | 5.6 |
| CZK (체코) | 6.0 | 6.9 | 5.1 |
| EUR (유럽) | 5.0 | 5.9 | 4.1 |
| USD (미국) | 5.0 | 5.9 | 4.1 |
| GBP (영국) | 4.5 | 5.4 | 3.6 |
| CHF (스위스) | 4.5 | 5.4 | 3.6 |
| MVR (몰디브) | 4.5 | 5.4 | 3.6 |

**범위**: 4.5 ~ 8.0 (v2.1 보정으로 바닥 올림, 최대 격차 3.5점)

**v1 → v2 → v2.1 변경 이력:**
- v1: tanh sigmoid(`5.5 + 4.5×tanh(pctDiff/10)`) — 모든 통화 5.0~6.0 압축
- v2: 기본 물가 + 환율 modifier — EUR 4.0, GBP 3.5, CHF 3.0 (격차 5.5)
- v2.1: 바닥 올림 — EUR 5.0, GBP 4.5, CHF 4.5 (격차 3.5, 지역 균형)

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

## 4. 오늘의 BEST 타이밍 알고리즘

매일 갱신되는 "오늘 예약하면 가장 좋은 여행지+시기 조합" TOP 10을 산출합니다.
구현: `src/lib/today-best.ts` → `src/scripts/calculate-today-best.ts`

### 4.1 전체 흐름

```
1. 입력: 86개 도시 × 향후 12주 = 1,032개 (도시, 주간) 조합
2. 각 조합에 대해:
   기본 점수 = scores_cache[도시][주간의 월].total
   + 환율 보너스  (최대 +1.0)
   + 예보 보너스  (최대 +0.5)
   + 시즌 보너스  (최대 +0.5)
   + 시의성 보너스 (최대 +0.3)
   = 오늘의 점수 (최대 기본+2.3)
3. 도시별 중복 제거: 같은 도시가 여러 주에 나오면 최고 점수 주만 채택
4. 내림차순 정렬 → 상위 10개 반환
```

### 4.2 주간(Week) 생성

오늘 날짜 기준 **다음 월요일부터 12주** 생성:

```
week[0] = 다음 월요일 ~ 일요일  (weeksFromNow=1)
week[1] = 그 다음 주             (weeksFromNow=2)
...
week[11] = 12주 후              (weeksFromNow=12)
```

각 주의 `month`는 주 시작일(월요일) 기준. 이 month로 `scores_cache`의 기본 점수를 조회합니다.

### 4.3 환율 보너스 (Exchange Rate Bonus)

**데이터**: Supabase `exchange_rates` 테이블에서 해당 통화의 최근 90일 환율 이력

```
currentRate = 가장 최근 환율
minRate90   = 90일 내 최저 환율
minRate30   = 30일 내 최저 환율

if currentRate <= minRate90 × 1.005:   → +1.0 ("환율 3개월 내 최저점")
elif currentRate <= minRate30 × 1.005: → +0.5 ("환율 1개월 내 최저점")
else:                                  → +0.0
```

- `1.005` 허용 오차: 0.5% 이내면 최저점과 동등하게 취급
- 최소 7일치 데이터가 있어야 계산 (부족하면 보너스 0)
- KRW 기준 환율이 낮을수록 = 원화가 강할수록 = 여행 저렴

### 4.4 예보 보너스 (Forecast Bonus)

**데이터**: Supabase `forecast_cache` 테이블 (6시간 TTL)

```
forecastClearRatio = forecast_cache[도시]의 맑은 날 비율
baselineRatio      = 0.6 (기본 비교 기준)

diff = forecastClearRatio - baselineRatio

if diff > 0.1:  → +min(0.5, round(diff × 3, 1)) ("예보 맑은 날 N%")
else:           → +0.0
```

- 예보 데이터가 6시간 이상 경과했으면 무시 (보너스 0)
- 예보가 없는 도시도 보너스 0
- 최대 +0.5 cap

### 4.5 시즌 보너스 (Season Bonus)

**데이터**: `src/data/seasons.ts` — 도시별 시즌 메타데이터 (시작일/종료일)

```
for each season of city:
  if 추천 주간이 시즌 범위 내:
    if 오늘 → 시즌 시작까지 14일 이내: → +0.5 ("시즌명 시작 직전")
    else:                              → +0.3 ("시즌명")
  elif 오늘 → 시즌 시작까지 14일 이내:  → +0.5 ("시즌명 시작 직전")
```

- 연도 경계를 넘는 시즌(예: 11월~2월 건기) 처리 지원
- 도시에 시즌 데이터가 없으면 보너스 0
- 첫 번째 매칭되는 시즌에서 종료 (중복 보너스 없음)

**시즌 예시** (86개 도시 중 주요):

| 도시 | 시즌명 | 시작 | 종료 |
|------|--------|------|------|
| 도쿄 | 벚꽃 시즌 | 3/20 | 4/10 |
| 도쿄 | 단풍 시즌 | 11/10 | 12/5 |
| 방콕 | 건기 시즌 | 11/1 | 2/28 |
| 방콕 | 송크란 축제 | 4/13 | 4/15 |
| 다낭 | 건기 시즌 | 3/1 | 8/31 |
| 발리 | 건기 시즌 | 4/1 | 10/31 |
| 파리 | 봄꽃 시즌 | 4/1 | 5/31 |
| 바르셀로나 | 해변 시즌 | 6/1 | 9/15 |

### 4.6 시의성 보너스 (Timeliness Bonus)

```
if 4 <= weeksFromNow <= 8: → +0.3 ("예약 적정 타이밍 (4-8주 전)")
else:                      → +0.0
```

- 여행 4-8주 전이 항공/숙소 예약의 최적 타이밍이라는 경험적 판단
- 너무 가까운 여행(1-3주)이나 너무 먼 여행(9-12주)은 보너스 없음

### 4.7 추천 이유(Reasons) 생성

각 보너스의 reason 문자열 + 추가 조건에서 최대 3개 선택:

```
reasons = []
if 환율 보너스 > 0:   reasons.append(환율_reason)
if 예보 보너스 > 0:   reasons.append(예보_reason)
if 시즌 보너스 > 0:   reasons.append(시즌_reason)
if 시의성 보너스 > 0: reasons.append(시의성_reason)
if 날씨 점수 >= 8:    reasons.append("날씨 최적")
if 혼잡도 점수 >= 8:  reasons.append("비수기 한산")
return reasons[:3]
```

### 4.8 중복 제거 및 최종 랭킹

```
bestPerCity = {}
for each (도시, 주간) combination:
  if 도시 not in bestPerCity or score > bestPerCity[도시].score:
    bestPerCity[도시] = combination

ranked = bestPerCity.values()
         .sort(by score DESC)
         .slice(0, 10)
         .map((item, idx) => { ...item, rank: idx + 1 })
```

- 같은 도시가 4월 1주 / 4월 2주에 모두 높은 점수를 받아도 **최고 점수 주만 1개** 채택
- 최종 TOP 10에 도시 중복 없음

### 4.9 보너스 요약 테이블

| 보너스 | 최대 | 조건 | 데이터 소스 |
|--------|------|------|------------|
| 환율 | +1.0 | 3개월 내 최저점 (0.5% 허용) | `exchange_rates` |
| 환율 | +0.5 | 1개월 내 최저점 (0.5% 허용) | `exchange_rates` |
| 예보 | +0.5 | 맑은 날 비율이 기준(60%)보다 10%p+ 높음 | `forecast_cache` |
| 시즌 | +0.5 | 시즌 시작 14일 이내 | `seasons.ts` |
| 시즌 | +0.3 | 시즌 중 | `seasons.ts` |
| 시의성 | +0.3 | 추천 주간까지 4-8주 | 계산 |
| **합계** | **+2.3** | 모든 보너스 동시 발생 시 | |

### 4.10 실제 출력 예시 (2026-02-17 기준)

```
1위: 방콕 · 4월 둘째주 · 9.0 (base 8.4 + 0.6)
     송크란 축제 | 예약 적정 타이밍 | 비수기 한산
2위: 코타키나발루 · 4월 첫째주 · 8.9 (base 8.3 + 0.6)
     건기 시즌 | 예약 적정 타이밍 | 비수기 한산
3위: 오사카 · 4월 첫째주 · 8.8 (base 7.7 + 1.1)
     환율 1개월 내 최저점 | 벚꽃 시즌 | 예약 적정 타이밍
```

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
1. collect-weather.ts    — 10년치 날씨 (가장 오래 걸림, 86도시)
2. collect-holidays.ts   — 공휴일
3. collect-exchange.ts   — 환율
4. collect-forecast.ts   — 14일 예보
5. collect-trend.ts      — 검색 트렌드 (NAVER API 키 필요, 없으면 스킵)
6. calculate-scores.ts   — 점수 계산
7. calculate-today-best.ts — 오늘의 BEST 계산
```

---

## 7. 도시 커버리지

총 **86개 도시** (기존 20 + 신규 66)

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
