# CLAUDE.md — whereorwhen

이 프로젝트는 여행지별 최적 시기를 종합 점수로 알려주는 웹서비스 **whereorwhen**의 개발 저장소입니다.

---

## Git 저장소

- **GitHub**: https://github.com/bangtaeuk/whereorwhen
- **브랜치 전략**: `main` (기본 브랜치)

---

## PRD

이 프로젝트의 제품 요구사항 문서: `PRD.md` (루트 디렉토리)

---

## 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| Frontend | Next.js 15 (React 19, App Router) | SSR/SSG, SEO 최적화 |
| 스타일링 | Tailwind CSS 4 | 유틸리티 기반 CSS |
| Backend | Next.js API Routes | API 프록시, 점수 계산 |
| Database | **Supabase** (PostgreSQL) | 클라우드 호스팅, `@supabase/supabase-js` 사용 |
| 배치 | GitHub Actions + `npx tsx` 스크립트 | 데이터 수집 & 점수 계산 |
| 호스팅 | Vercel | 자동 배포, ISR 지원 |
| 언어 | TypeScript | 타입 안전성 |

## 외부 API

| API | 용도 | 인증 | 스크립트 |
|-----|------|------|----------|
| Open-Meteo Historical Weather | 날씨 점수 (10년 평균) | 키 불필요 | `collect-weather.ts` |
| Open-Meteo Forecast | 14일 예보 (v2) | 키 불필요 | `collect-forecast.ts` |
| ExchangeRate API | 비용 점수 (일일 환율, 35개 통화) | 무료 API Key | `collect-exchange.ts` |
| Frankfurter API | 환율 백필 (365일) | 키 불필요 | `backfill-exchange.ts` |
| Nager.Date | 혼잡도 점수 (공휴일, 43개국) | 키 불필요 | `collect-holidays.ts` |
| Naver Blog Search | 버즈 점수 (블로그 언급량) | Client ID/Secret | `collect-buzz.ts` |
| Naver DataLab Search Trend | 버즈 점수 (검색 트렌드) | Client ID/Secret | `collect-trend.ts` |

## Supabase 테이블

| 테이블 | 용도 | PK / Unique |
|--------|------|-------------|
| `weather_monthly` | 도시별 월별 기상 평균 | `city_id, month` |
| `exchange_rates` | 통화별 일별 환율 | `currency, rate_date` |
| `holidays` | 국가별 공휴일 | `country_code, holiday_date` |
| `buzz_monthly` | 도시별 월별 검색량 | `city_id, month, year` |
| `scores_cache` | 최종 계산된 점수 | `city_id, month` |
| `today_best_cache` | 오늘의 BEST 타이밍 결과 (v2) | `date` |
| `forecast_cache` | 14일 예보 캐시 (v2) | `city_id` |

---

## 프로젝트 구조

```
whereorwhen/
├── CLAUDE.md                  # 프로젝트 지침 (이 파일)
├── PRD.md                     # 제품 요구사항 문서
├── RULES.md                   # 디자인/UX/코드 원칙 룰북
├── SCORING.md                 # 점수 산출 로직 상세 문서
├── CHANGELOG.md               # 작업 기록
├── LOCAL.md                   # 로컬 전용 (gitignore 대상)
├── package.json               # npm 패키지 설정
├── next.config.ts             # Next.js 설정
├── tsconfig.json              # TypeScript 설정
├── postcss.config.mjs         # PostCSS + Tailwind 설정
├── eslint.config.mjs          # ESLint 설정
├── verify-data.ts             # 목업 데이터 검증 스크립트
├── public/                    # 정적 파일
└── src/
    ├── app/                   # Next.js App Router
    │   ├── layout.tsx         # 루트 레이아웃 (메타데이터, Pretendard 폰트)
    │   ├── page.tsx           # 메인 페이지 (Mode A/B + 오늘의 BEST, 클라이언트 컴포넌트)
    │   ├── globals.css        # 글로벌 스타일 (Tailwind import, 점수 색상 변수)
    │   ├── today/page.tsx     # 오늘의 BEST 타이밍 상세 페이지 (v2)
    │   └── api/               # API Routes
    │       ├── cities/route.ts           # GET /api/cities — 도시 목록
    │       ├── today-best/route.ts       # GET /api/today-best — 오늘의 BEST TOP 10 (v2)
    │       ├── forecast/[cityId]/route.ts # GET /api/forecast/:cityId — 14일 예보 (v2)
    │       └── scores/
    │           ├── [cityId]/route.ts     # GET /api/scores/:cityId — 도시별 12개월 점수
    │           └── ranking/route.ts      # GET /api/scores/ranking?month=N — 월별 랭킹
    ├── components/            # React 컴포넌트 (현재 page.tsx에서 직접 구현)
    │   ├── CalendarView.tsx   # 캘린더 뷰 (독립 컴포넌트 버전)
    │   ├── RankingView.tsx    # 랭킹 뷰 (독립 컴포넌트 버전)
    │   ├── CitySelector.tsx   # 도시 검색/선택
    │   ├── MonthSelector.tsx  # 월 선택
    │   ├── ModeSlider.tsx     # 모드 전환 슬라이더
    │   ├── ScoreDetailPanel.tsx # 점수 상세 패널
    │   └── ui/                # 재사용 UI 컴포넌트
    │       ├── ScoreBar.tsx   # 점수 바
    │       ├── ScoreBadge.tsx # 점수 뱃지
    │       ├── CityCard.tsx   # 도시 카드
    │       ├── MonthCell.tsx  # 월 셀
    │       └── HighlightTag.tsx # 하이라이트 태그
    ├── lib/                   # 유틸리티 & 비즈니스 로직
    │   ├── supabase.ts        # Supabase 클라이언트 (service + anon)
    │   ├── data-service.ts    # 데이터 조회 서비스 (Supabase + mock fallback)
    │   ├── score.ts           # 가중치, 종합 점수 계산, 등급 판별
    │   ├── highlights.ts      # 도시별 시즌 키워드 & 하이라이트 생성
    │   ├── today-best.ts      # 오늘의 BEST 타이밍 알고리즘 (v2)
    │   ├── forecast.ts        # Open-Meteo Forecast API + 캐시 (v2)
    │   ├── utils.ts           # 유틸리티 (국기 이모지, 월 이름)
    │   └── scoring/           # 개별 점수 계산 모듈
    │       ├── index.ts       # 통합 export + calculateMonthlyScore
    │       ├── weather.ts     # 날씨 점수 (위도 기반 추정)
    │       ├── cost.ts        # 비용 점수 (통화별 기본 물가 + 월별 변동)
    │       ├── crowd.ts       # 혼잡도 점수 (한국/현지 연휴 밀집도)
    │       ├── buzz.ts        # 버즈 점수 (도시별 월간 패턴)
    │       └── forecast-adjustment.ts # 예보 기반 점수 보정 (v2)
    ├── data/                  # 정적 데이터
    │   ├── cities.ts          # 전체 도시 목록 (86개, base 20 + new 63 병합)
    │   ├── cities-new.ts      # 추가 63개 도시 데이터 (v2 확장)
    │   ├── seasons.ts         # 도시별 시즌 메타데이터 (v2)
    │   └── mock-scores.ts     # 20도시×12월 목업 점수 (Supabase 미연결 시 fallback)
    ├── scripts/               # 데이터 수집 & 점수 계산 스크립트
    │   ├── init-all.ts        # 마스터 초기화 (전체 수집 + 점수 계산)
    │   ├── collect-weather.ts # Open-Meteo → weather_monthly
    │   ├── collect-exchange.ts # ExchangeRate API → exchange_rates
    │   ├── backfill-exchange.ts # Frankfurter API → exchange_rates (365일 백필)
    │   ├── collect-holidays.ts # Nager.Date → holidays
    │   ├── collect-buzz.ts    # Naver Blog Search → buzz_monthly
    │   ├── collect-trend.ts   # Naver DataLab → buzz_monthly
    │   ├── collect-forecast.ts # Open-Meteo Forecast → forecast_cache (v2)
    │   ├── calculate-scores.ts # 원시 데이터 → scores_cache 최종 점수 계산
    │   └── calculate-today-best.ts # 오늘의 BEST 타이밍 계산 → today_best_cache (v2)
    └── types/                 # TypeScript 타입 정의
        └── index.ts           # Score, ScoreBreakdown, City, MonthlyScore, AppMode 등
```

## 아키텍처 요약

```
[클라이언트] page.tsx (CSR) + today/page.tsx
     ↓ fetch (API Routes)
[API Routes]
     /api/cities           ← 86개 도시 목록 (정적)
     /api/scores/*         ← Supabase scores_cache 조회
     /api/today-best       ← 오늘의 BEST TOP 10 (v2)
     /api/forecast/:cityId ← 14일 예보 (v2)
     ↓ data-service.ts → Supabase (anon key 읽기) 또는 mock fallback
[배치 (GitHub Actions)]
     매일 03:00 UTC: 환율 → 점수 계산 → 오늘의 BEST
     6시간마다: 86개 도시 예보 수집
     매월 1일: 검색 트렌드 수집
     수동(full_refresh): 날씨(10년) + 공휴일
[Supabase] 7개 테이블 (weather_monthly, exchange_rates, holidays,
           buzz_monthly, scores_cache, today_best_cache, forecast_cache)
```

**Production URL**: `https://whereorwhen-alpha.vercel.app`
**도시 수**: 86개 (30+ 국가, 35개 통화)
**점수 알고리즘**: v2.1 (대비 확장 + 통화별 base cost + 보너스 시스템)

---

## 개발 명령어

```bash
npm run dev              # 개발 서버 (http://localhost:3000)
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버
npm run lint             # ESLint 실행
```

### 데이터 수집 스크립트

```bash
npx tsx src/scripts/init-all.ts          # 전체 초기화 (순차 실행)
npx tsx src/scripts/collect-weather.ts   # 날씨 수집 (10년치, 느림)
npx tsx src/scripts/collect-exchange.ts  # 오늘 환율 수집
npx tsx src/scripts/backfill-exchange.ts # 365일 환율 백필
npx tsx src/scripts/collect-holidays.ts  # 공휴일 수집
npx tsx src/scripts/collect-buzz.ts      # 블로그 버즈 수집
npx tsx src/scripts/collect-trend.ts     # 검색 트렌드 수집
npx tsx src/scripts/calculate-scores.ts  # 점수 계산 (수집 후 실행)
```

---

## 환경 변수 (.env)

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase 읽기 전용 키
SUPABASE_SERVICE_ROLE_KEY=       # Supabase 서비스 키 (수집 스크립트용)
EXCHANGE_RATE_API_KEY=           # ExchangeRate API 키
NAVER_CLIENT_ID=                 # 네이버 개발자 Client ID
NAVER_CLIENT_SECRET=             # 네이버 개발자 Client Secret
```

---

## 프로젝트 문서

| 문서 | 용도 |
|------|------|
| `RULES.md` | 디자인/UX/코드 원칙 룰북 — 새 세션에서 반드시 참조 |
| `SCORING.md` | 점수 산출 로직 상세 — 알고리즘 수정 시 참조 |
| `CHANGELOG.md` | 작업 기록 — 진행 상황 파악용 |
| `LOCAL.md` | 로컬 전용 (페르소나 경로 등, gitignore 대상) |

새 세션 시작 시: `@RULES.md` 를 로드하세요.
페르소나 사용 시: `@LOCAL.md` 를 로드하세요.
