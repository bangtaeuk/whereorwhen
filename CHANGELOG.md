# CHANGELOG.md — whereorwhen 작업 기록

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
- **V15**: 최종 믹스 (V7 카드UX + V11 랭킹 + V12 데스크톱 + V5 점수바)

### 4. 버그 수정

- 다크모드 CSS 충돌 → `globals.css` 다크모드 비활성화
- 캘린더 카드 클릭 시 레이아웃 점프 → 상세패널을 그리드 바깥으로 이동
- border shorthand 충돌, 색상 불일치, placeholder 스타일 등 수정

### 5. 지침 정리

- `RULES.md` 생성 — 브랜드/디자인/UX/코드 원칙 기록
- `LOCAL.md` 분리 — 페르소나/로컬 경로를 gitignore 처리
- `CLAUDE.md` 정리 — public repo에 적합한 프로젝트 지침만 유지

### 현재 상태

- 메인 페이지 (`/`) → V15 최종 디자인 적용됨
- 디자인 시안 (`/v1`~`/v15`) → 레퍼런스용 보존
- Vercel 배포 연결됨 (push → 자동 배포)
- 다음 단계: 실제 API 연동 (Open-Meteo, ExchangeRate, Nager.Date, Naver Blog)
