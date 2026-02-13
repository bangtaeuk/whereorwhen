-- whereorwhen Supabase Schema
-- Supabase SQL Editor에서 실행하세요

-- ========================================
-- 1. 날씨 (10년 월별 평균, 연 1회 갱신)
-- ========================================
CREATE TABLE IF NOT EXISTS weather_monthly (
  city_id     TEXT NOT NULL,
  month       INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  avg_temp    REAL,              -- 평균 기온 (°C)
  max_temp    REAL,              -- 평균 최고 기온
  min_temp    REAL,              -- 평균 최저 기온
  precip_mm   REAL,              -- 월 평균 강수량 (mm)
  sunny_ratio REAL,              -- 맑은 날 비율 (0.0 ~ 1.0)
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (city_id, month)
);

-- ========================================
-- 2. 환율 (일별 스냅샷, 일 1회 갱신)
-- ========================================
CREATE TABLE IF NOT EXISTS exchange_rates (
  currency    TEXT NOT NULL,     -- JPY, THB, EUR 등
  rate_date   DATE NOT NULL,
  rate        REAL NOT NULL,     -- KRW 기준 환율
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (currency, rate_date)
);

-- ========================================
-- 3. 공휴일 (연 1회 수집)
-- ========================================
CREATE TABLE IF NOT EXISTS holidays (
  country_code TEXT NOT NULL,    -- KR, JP, TH 등
  holiday_date DATE NOT NULL,
  name         TEXT,
  is_public    BOOLEAN DEFAULT TRUE,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (country_code, holiday_date)
);

-- ========================================
-- 4. 버즈 (월별 집계, 월 1회 갱신)
-- ========================================
CREATE TABLE IF NOT EXISTS buzz_monthly (
  city_id     TEXT NOT NULL,
  month       INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        INT NOT NULL,
  total_count INT,               -- 블로그 검색 총 결과 수
  keywords    JSONB,             -- {"도쿄 여행": 12000, "도쿄 벚꽃": 5000}
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (city_id, month, year)
);

-- ========================================
-- 5. 계산된 점수 캐시 (일 1회 재계산)
-- ========================================
CREATE TABLE IF NOT EXISTS scores_cache (
  city_id     TEXT NOT NULL,
  month       INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  weather     REAL,
  cost        REAL,
  crowd       REAL,
  buzz        REAL,
  total       REAL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (city_id, month)
);

-- ========================================
-- 인덱스
-- ========================================
CREATE INDEX IF NOT EXISTS idx_exchange_currency ON exchange_rates (currency);
CREATE INDEX IF NOT EXISTS idx_exchange_date ON exchange_rates (rate_date DESC);
CREATE INDEX IF NOT EXISTS idx_scores_month ON scores_cache (month, total DESC);
CREATE INDEX IF NOT EXISTS idx_scores_city ON scores_cache (city_id);
CREATE INDEX IF NOT EXISTS idx_holidays_country ON holidays (country_code);
CREATE INDEX IF NOT EXISTS idx_buzz_city ON buzz_monthly (city_id, year DESC);

-- ========================================
-- RLS (Row Level Security) 정책
-- 모든 테이블: anon은 읽기만, service_role은 읽기+쓰기
-- ========================================
ALTER TABLE weather_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE buzz_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores_cache ENABLE ROW LEVEL SECURITY;

-- anon 읽기 허용
CREATE POLICY "Allow public read" ON weather_monthly FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON exchange_rates FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON holidays FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON buzz_monthly FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON scores_cache FOR SELECT USING (true);
