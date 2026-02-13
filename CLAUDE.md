# CLAUDE.md — whereorwhen

이 프로젝트는 여행지별 최적 시기를 종합 점수로 알려주는 웹서비스 **whereorwhen**의 개발 저장소입니다.

---

## Git 저장소

- **GitHub**: https://github.com/bangtaeuk/whereorwhen
- **브랜치 전략**: `main` (기본 브랜치)
- **로컬 경로**: `c:\Users\MRT-USER\whereorwhen`

---

## PRD

이 프로젝트의 제품 요구사항 문서:

- `c:\Users\MRT-USER\MRT-Growth\docs\whereorwhen\PRD.md`
- 로컬 사본: `c:\Users\MRT-USER\whereorwhen\PRD.md`

---

## 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| Frontend | Next.js 15 (React 19, App Router) | SSR/SSG, SEO 최적화 |
| 스타일링 | Tailwind CSS 4 | 유틸리티 기반 CSS |
| 지도 | Google Maps JS API 또는 Mapbox GL JS | 인터랙티브 지도 |
| Backend | Next.js API Routes | API 프록시, 점수 계산 |
| Database | SQLite (better-sqlite3) | 경량, MVP 적합 |
| 배치 | Vercel Cron / GitHub Actions | 데이터 수집 스케줄링 |
| 호스팅 | Vercel | 자동 배포, ISR 지원 |
| 언어 | TypeScript | 타입 안전성 |

## 외부 API

| API | 용도 | 인증 |
|-----|------|------|
| Open-Meteo Historical Weather | 날씨 점수 | 키 불필요 |
| ExchangeRate API | 비용 점수 (환율) | 무료 API Key |
| Nager.Date | 혼잡도 점수 (공휴일) | 키 불필요 |
| Naver Blog Search | 버즈 점수 | Client ID/Secret |

---

## 프로젝트 구조

```
whereorwhen/
├── CLAUDE.md              # 프로젝트 지침 (이 파일)
├── PRD.md                 # 제품 요구사항 문서
├── package.json           # npm 패키지 설정
├── next.config.ts         # Next.js 설정
├── tsconfig.json          # TypeScript 설정
├── postcss.config.mjs     # PostCSS + Tailwind 설정
├── eslint.config.mjs      # ESLint 설정
├── public/                # 정적 파일
└── src/
    ├── app/               # Next.js App Router 페이지
    │   ├── layout.tsx     # 루트 레이아웃
    │   ├── page.tsx       # 메인 페이지
    │   └── globals.css    # 글로벌 스타일
    ├── components/        # React 컴포넌트
    ├── lib/               # 유틸리티 함수 (점수 계산 등)
    │   └── score.ts       # 점수 계산 알고리즘
    ├── data/              # 정적 데이터
    │   └── cities.ts      # MVP 대상 20개 도시 정보
    └── types/             # TypeScript 타입 정의
        └── index.ts       # 공통 타입
```

## 개발 명령어

```bash
npm run dev    # 개발 서버 (http://localhost:3000)
npm run build  # 프로덕션 빌드
npm run start  # 프로덕션 서버
npm run lint   # ESLint 실행
```

---

## MRT Growth 팀 페르소나 참조

이 프로젝트는 마이리얼트립 Growth 실에서 기획되었습니다. 제품/마케팅 방향 논의가 필요할 때 아래 페르소나 파일을 `@` 경로로 로드하세요.

### 핵심 참조 파일

| 파일 | 용도 | 경로 |
|------|------|------|
| 컨텍스트 동기화 | 핵심가치, 메타규칙, 판단기준 | `c:\Users\MRT-USER\MRT-Growth\init.md` |
| 브랜드 가이드라인 | 포지셔닝, 메시지 원칙 | `c:\Users\MRT-USER\MRT-Growth\growth-department\BRAND-GUIDELINES.md` |
| OKR | Growth Loop, 팀별 KR | `c:\Users\MRT-USER\MRT-Growth\growth-department\2026-OKR.md` |

### 리더십

| 역할 | 용도 | 경로 |
|------|------|------|
| Growth Director | 최고 의사결정자, Debating Partner | `c:\Users\MRT-USER\MRT-Growth\growth-department\growth-director.md` |
| Marketing Lead | 마케팅팀 리더 | `c:\Users\MRT-USER\MRT-Growth\growth-department\marketing-lead.md` |
| Product Lead | 제품팀 리더 | `c:\Users\MRT-USER\MRT-Growth\growth-department\product-lead.md` |

### 마케팅팀

| 역할 | 경로 |
|------|------|
| Branding Specialist | `c:\Users\MRT-USER\MRT-Growth\growth-department\marketing-team\branding-specialist.md` |
| Performance Marketer | `c:\Users\MRT-USER\MRT-Growth\growth-department\marketing-team\performance-marketer.md` |
| Content Strategist | `c:\Users\MRT-USER\MRT-Growth\growth-department\marketing-team\content-strategist.md` |
| CRM Specialist | `c:\Users\MRT-USER\MRT-Growth\growth-department\marketing-team\crm-specialist.md` |
| Partnership Manager | `c:\Users\MRT-USER\MRT-Growth\growth-department\marketing-team\partnership-manager.md` |
| Devil's Advocate (마케팅) | `c:\Users\MRT-USER\MRT-Growth\growth-department\marketing-team\devils-advocate-marketing.md` |

### 제품팀

| 역할 | 경로 |
|------|------|
| Product Manager | `c:\Users\MRT-USER\MRT-Growth\growth-department\product-team\product-manager.md` |
| Growth PM | `c:\Users\MRT-USER\MRT-Growth\growth-department\product-team\growth-pm.md` |
| Product Designer | `c:\Users\MRT-USER\MRT-Growth\growth-department\product-team\product-designer.md` |
| Data Analyst | `c:\Users\MRT-USER\MRT-Growth\growth-department\product-team\data-analyst.md` |
| Frontend Developer | `c:\Users\MRT-USER\MRT-Growth\growth-department\product-team\frontend-developer.md` |
| Backend Developer | `c:\Users\MRT-USER\MRT-Growth\growth-department\product-team\backend-developer.md` |
| Devil's Advocate (제품) | `c:\Users\MRT-USER\MRT-Growth\growth-department\product-team\devils-advocate-product.md` |

---

## 페르소나 로드 가이드

### 기본 세션 시작

대화 시작 시:

```
@c:\Users\MRT-USER\MRT-Growth\init.md 와 @c:\Users\MRT-USER\MRT-Growth\growth-department\growth-director.md 를 로드해줘
```

### 상황별 로드 조합

| 상황 | 로드할 페르소나 |
|------|---------------|
| 제품 방향 논의 | init.md + growth-director.md + product-lead.md |
| 마케팅/바이럴 전략 | init.md + growth-director.md + marketing-lead.md |
| UI/UX 리뷰 | product-lead.md + product-designer.md |
| 데이터 모델/점수 알고리즘 | product-lead.md + data-analyst.md |
| 프론트엔드 구현 리뷰 | product-lead.md + frontend-developer.md |
| 백엔드/API 구현 리뷰 | product-lead.md + backend-developer.md |
| 런칭 전 리스크 체크 | devils-advocate-marketing.md + devils-advocate-product.md |

---

## 세션 기록

이 프로젝트 관련 세션 기록은 MRT-Growth에 저장됨:

- `c:\Users\MRT-USER\MRT-Growth\growth-department\sessions\2026-02-12_whereorwhen-service-ideation\`
