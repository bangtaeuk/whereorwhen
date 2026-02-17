import "dotenv/config";

/**
 * 오늘의 BEST 타이밍 계산 + Supabase 캐시 저장
 * Run: npx tsx src/scripts/calculate-today-best.ts
 *
 * 매일 환율 수집 후 실행하여 today_best_cache 테이블에 결과 저장
 */

import { createClient } from "@supabase/supabase-js";
import { calculateTodayBest } from "../lib/today-best";

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

async function main() {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  console.log(`Calculating today's BEST for ${dateStr}...`);

  const rankings = await calculateTodayBest(today);

  console.log(`\nTop 10 results:`);
  for (const item of rankings) {
    console.log(
      `  ${item.rank}. ${item.city.nameKo} · ${item.recommendedPeriod.label} · ${item.score} (base ${item.baseScore} + bonuses ${(item.score - item.baseScore).toFixed(1)})`,
    );
    if (item.reasons.length > 0) {
      console.log(`     ${item.reasons.join(" | ")}`);
    }
  }

  const { error } = await supabase.from("today_best_cache").upsert(
    {
      date: dateStr,
      rankings: JSON.stringify(rankings),
      generated_at: today.toISOString(),
    },
    { onConflict: "date" },
  );

  if (error) {
    console.error(`\nSupabase upsert error: ${error.message}`);
    process.exit(1);
  }

  console.log(`\nSaved to today_best_cache for ${dateStr}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
