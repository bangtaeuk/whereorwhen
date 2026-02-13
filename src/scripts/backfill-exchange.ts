import "dotenv/config";

/**
 * Frankfurter API로 과거 365일 환율 백필 (1회성 스크립트)
 * Run: npx tsx src/scripts/backfill-exchange.ts
 *
 * - ECB 데이터 기반, 무료, API 키 불필요
 * - KRW 기준 13개 통화의 영업일 환율
 */

import { createClient } from "@supabase/supabase-js";

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

const TARGET_CURRENCIES = [
  "JPY", "VND", "THB", "USD", "PHP", "TWD", "SGD",
  "HKD", "IDR", "MYR", "EUR", "GBP", "AUD",
];

interface FrankfurterResponse {
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
}

async function main() {
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  console.log(`📈 Backfilling exchange rates: ${startDate} → ${endDate}`);
  console.log(`   Currencies: ${TARGET_CURRENCIES.join(", ")}\n`);

  const symbols = TARGET_CURRENCIES.join(",");
  const url = `https://api.frankfurter.dev/v1/${startDate}..${endDate}?base=KRW&symbols=${symbols}`;

  console.log("Fetching from Frankfurter API...");
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Frankfurter API error ${res.status}: ${body}`);
  }

  const data: FrankfurterResponse = await res.json();
  const dates = Object.keys(data.rates).sort();

  console.log(`Received ${dates.length} business days of data.\n`);

  // Build rows
  const rows: { currency: string; rate_date: string; rate: number }[] = [];

  for (const date of dates) {
    const dayRates = data.rates[date];
    for (const currency of TARGET_CURRENCIES) {
      const rate = dayRates[currency];
      if (rate != null) {
        rows.push({ currency, rate_date: date, rate });
      }
    }
  }

  console.log(`Total rows to upsert: ${rows.length}`);

  // Upsert in chunks of 500
  const CHUNK = 500;
  let upserted = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("exchange_rates")
      .upsert(chunk, { onConflict: "currency,rate_date" });

    if (error) {
      console.error(`✗ Upsert error (rows ${i}-${i + chunk.length}):`, error.message);
    } else {
      upserted += chunk.length;
    }
  }

  console.log(`\n✓ Backfill complete! ${upserted} rows upserted.`);

  // Show sample: latest JPY rate vs avg
  const jpyRows = rows.filter((r) => r.currency === "JPY").sort((a, b) => a.rate_date.localeCompare(b.rate_date));
  if (jpyRows.length > 0) {
    const latest = jpyRows[jpyRows.length - 1];
    const avg = jpyRows.reduce((s, r) => s + r.rate, 0) / jpyRows.length;
    const pctDiff = (((avg - latest.rate) / avg) * 100).toFixed(1);
    console.log(`\n  Sample — JPY:`);
    console.log(`    Latest (${latest.rate_date}): ${latest.rate}`);
    console.log(`    365-day avg: ${avg.toFixed(6)}`);
    console.log(`    Diff: ${pctDiff}% (양수=저렴, 음수=비쌈)`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
