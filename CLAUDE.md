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

## 로컬 설정

팀 페르소나, 세션 기록 등 개인 환경 설정은 `LOCAL.md`에 분리되어 있습니다 (git에 포함되지 않음).

페르소나를 사용하려면: `@LOCAL.md` 를 로드하세요.
