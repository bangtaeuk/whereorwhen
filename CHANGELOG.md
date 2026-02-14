# CHANGELOG.md — whereorwhen 작업 기록

---

## 2026-02-14 — 지침 파일 일괄 업데이트

소스 코드 전수 조사 후 문서와 실제 코드 간 불일치 해소:

- **CLAUDE.md**: 기술 스택 (SQLite → Supabase), 프로젝트 구조 전면 갱신, 외부 API 목록 추가 (Frankfurter, Naver DataLab), Supabase 테이블 명세 추가, 아키텍처 요약 추가, 환경변수/스크립트 명령어 추가
- **RULES.md**: 섹션 0/4 모순 해소 (v{N} 시안 라우트 금지 ↔ 생성 지시), 디자인 리뷰 프로세스를 확정 상태로 업데이트, 데이터 레이어 원칙 추가, 모드 전환 UX 명세 추가, 점수 알고리즘 원칙 섹션 추가
- **PRD.md**: 각 섹션에 구현 상태 태그 추가, 기술 스택 확정 (Supabase), 외부 API 6개 연동 반영, UI/UX 설계를 실제 구현에 맞게 수정 (색상 체계, 반응형, 화면 구조), §12 구현 상태 요약 + 다음 단계 추가
- **SCORING.md**: 환경변수명 수정 (`EXCHANGERATE_API_KEY` → `EXCHANGE_RATE_API_KEY`)
- **CHANGELOG.md**: Supabase 연동/데이터 파이프라인 작업 기록 보충

---

## 2026-02-13 — Supabase 연동 + 데이터 수집 파이프라인

### 1. Supabase 전환

- SQLite 계획을 Supabase (PostgreSQL)로 변경
- `@supabase/supabase-js` v2 의존성 추가
- `src/lib/supabase.ts` 생성 — `createServiceClient()` (쓰기) + `createAnonClient()` (읽기)
- `src/lib/data-service.ts` 생성 — Supabase 조회 + mock fallback 패턴
- Supabase 5개 테이블 생성: `weather_monthly`, `exchange_rates`, `holidays`, `buzz_monthly`, `scores_cache`

### 2. 데이터 수집 스크립트 (7개)

| 스크립트 | 외부 API | 대상 테이블 |
|----------|---------|-------------|
| `collect-weather.ts` | Open-Meteo Historical | `weather_monthly` |
| `collect-exchange.ts` | ExchangeRate API | `exchange_rates` |
| `backfill-exchange.ts` | Frankfurter API | `exchange_rates` (365일 백필) |
| `collect-holidays.ts` | Nager.Date | `holidays` |
| `collect-buzz.ts` | Naver Blog Search | `buzz_monthly` |
| `collect-trend.ts` | Naver DataLab | `buzz_monthly` |
| `calculate-scores.ts` | — (내부 계산) | `scores_cache` |

- `init-all.ts` 마스터 스크립트 생성 (순차 실행: 날씨 → 공휴일 → 환율 → 트렌드 → 점수 계산)

### 3. 점수 산출 문서

- `SCORING.md` 생성 — 점수 산출 로직 상세 문서
- 날씨: 맑은 날 비율(60%) + 쾌적 기온(40%), 벨 커브 적용
- 비용: 365일 평균 환율 vs 현재, 시그모이드 매핑
- 혼잡도: 기본 9.0에서 성수기/공휴일 감점
- 버즈: 연간 평균 대비 비율, 시그모이드 매핑

---

## 2026-02-13 — 프로젝트 초기 셋업 + MVP 구현 + 디자인 확정

### 1. 프로젝트 초기화

- Git 저장소 생성, GitHub 연결 (`bangtaeuk/whereorwhen`)
- Next.js 15 + TypeScript + Tailwind CSS 4 수동 셋업
- 기본 파일 구조 생성 (`src/app`, `src/components`, `src/lib`, `src/data`, `src/types`)

### 2. MVP 기능 구현 (4개 병렬 트랙)

| 트랙 | 담당 페르소나 | 산출물 |
|------|-------------|--------|
| 점수 알고리즘 + Mock 데이터 | Data Analyst | `src/lib/scoring/*`, `src/data/mock-scores.ts` (20도시×12월 현실적 데이터) |
| API Routes | Backend Developer | `/api/cities`, `/api/scores/[cityId]`, `/api/scores/ranking`, `highlights.ts` |
| UI 컴포넌트 | Product Designer + Frontend | ScoreBadge, ScoreBar, CityCard, MonthCell, ModeSlider 등 10개 |
| 페이지 뷰 | Frontend Developer | CalendarView, RankingView, 메인 page.tsx |

### 3. 디자인 탐색 (15개 버전)

- **V1~V3**: 초기 3방향 (에디토리얼/오가닉/사이버펑크) — 톤 탐색
- **V4**: MRT 블루 기반 → 사용자 피드백: "MRT 블루는 키 컬러 아님. 화이트/블랙 필수"
- **V5~V14**: 화이트/블랙 방향 10개 변형 (울트라미니멀, 볼드타이포, 소프트카드, 데이터테이블, 모노크롬, 가로타임라인, 글래스모피즘, 매거진, 스플릿, 리스트)
- **평가**: Product Designer + Devil's Advocate 교차 검증, 7개 기준 점수화
- **V15**: 최종 믹스 (V7 카드UX + V11 랭킹 + V12 데스크톱 + V5 점수바) → 메인 페이지에 확정 적용

### 4. 버그 수정

- 다크모드 CSS 충돌 → `globals.css` 다크모드 비활성화
- 캘린더 카드 클릭 시 레이아웃 점프 → 1열 리스트 + 인라인 상세로 전환
- border shorthand 충돌, 색상 불일치, placeholder 스타일 등 수정

### 5. 지침 정리

- `RULES.md` 생성 — 브랜드/디자인/UX/코드 원칙 기록
- `LOCAL.md` 분리 — 페르소나/로컬 경로를 gitignore 처리
- `CLAUDE.md` 정리 — public repo에 적합한 프로젝트 지침만 유지
