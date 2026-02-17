import "dotenv/config";

/**
 * ExchangeRate API 환율 데이터 수집 스크립트
 * Run: npx tsx src/scripts/collect-exchange.ts
 *
 * KRW 기준 환율을 수집하여 Supabase exchange_rates 테이블에 UPSERT
 * 오늘 날짜 데이터가 이미 있으면 스킵
 */

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------
function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
/** 프로젝트에서 사용하는 통화 (35개) */
const TARGET_CURRENCIES = [
  // 기존 아시아/영미권 (13)
  "JPY",
  "VND",
  "THB",
  "USD",
  "PHP",
  "TWD",
  "SGD",
  "HKD",
  "IDR",
  "MYR",
  "EUR",
  "GBP",
  "AUD",
  // 미주/오세아니아
  "CAD",
  "MXN",
  "NZD",
  // 유럽
  "CHF",
  "CZK",
  "HUF",
  "PLN",
  "NOK",
  "SEK",
  "DKK",
  "ISK",
  "HRK",
  // 중동
  "TRY",
  "AED",
  // 동남아/마카오
  "KHR",
  "LAK",
  "MMK",
  "MOP",
  // 리조트
  "MVR",
  "FJD",
] as const;

type TargetCurrency = (typeof TARGET_CURRENCIES)[number];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ExchangeRateResponse {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  conversion_rates: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function todayISO(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Check if today's data already exists
// ---------------------------------------------------------------------------
async function alreadyCollectedToday(date: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("exchange_rates")
    .select("*", { count: "exact", head: true })
    .eq("rate_date", date);

  if (error) {
    console.error("Error checking existing data:", error.message);
    return false;
  }

  return (count ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Fetch exchange rates
// ---------------------------------------------------------------------------
async function fetchRates(): Promise<ExchangeRateResponse> {
  const apiKey = requireEnv("EXCHANGE_RATE_API_KEY");
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/KRW`;

  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ExchangeRate API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as ExchangeRateResponse;

  if (data.result !== "success") {
    throw new Error(`ExchangeRate API returned result: ${data.result}`);
  }

  return data;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const today = todayISO();
  console.log(`Exchange rate collection for ${today}\n`);

  // Check if already collected
  if (await alreadyCollectedToday(today)) {
    console.log(`Data for ${today} already exists. Skipping.`);
    return;
  }

  // Fetch rates
  console.log("Fetching exchange rates from ExchangeRate API...");
  const data = await fetchRates();

  // Extract target currencies
  const rows: { currency: string; rate_date: string; rate: number }[] = [];
  const logParts: string[] = [];

  for (const currency of TARGET_CURRENCIES) {
    const rate = data.conversion_rates[currency];

    if (rate == null) {
      console.warn(`  Warning: ${currency} not found in response, skipping`);
      continue;
    }

    rows.push({
      currency,
      rate_date: today,
      rate,
    });

    logParts.push(`${currency}=${rate}`);
  }

  if (rows.length === 0) {
    throw new Error("No valid exchange rates found in API response");
  }

  // Upsert into Supabase
  const { error } = await supabase
    .from("exchange_rates")
    .upsert(rows, { onConflict: "currency,rate_date" });

  if (error) {
    throw new Error(`Supabase upsert error: ${error.message}`);
  }

  console.log(`\nExchange rates collected for ${today}:`);
  console.log(`  ${logParts.join(", ")}`);
  console.log(`\nComplete! Upserted ${rows.length} rows.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
