/**
 * 마스터 초기화 스크립트 — 모든 수집기 + 점수 계산 실행
 * Run: npx tsx src/scripts/init-all.ts
 *
 * 순서:
 *  1. collect-weather  (10년치 날씨 — 가장 오래 걸림)
 *  2. collect-holidays (공휴일)
 *  3. collect-exchange  (환율)
 *  4. collect-buzz      (블로그 버즈 — NAVER API 키 필요, 없으면 스킵)
 *  5. calculate-scores  (점수 계산)
 */

import "dotenv/config";
import { execSync } from "child_process";
import path from "path";

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
function run(name: string, scriptFile: string, opts?: { optional?: boolean }): void {
  const scriptPath = path.resolve(__dirname, scriptFile);
  const label = `▶ ${name}`;

  console.log(`\n${label}...`);
  const start = Date.now();

  try {
    execSync(`npx tsx "${scriptPath}"`, {
      stdio: "inherit",
      env: process.env,
      cwd: path.resolve(__dirname, "../.."), // project root
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✓ ${name} (${elapsed}s)`);
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    if (opts?.optional) {
      console.warn(`⚠ ${name} skipped or failed (${elapsed}s):`, (err as Error).message);
    } else {
      console.error(`✗ ${name} failed (${elapsed}s):`, (err as Error).message);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main(): void {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  whereorwhen — Initial Data Collection   ║");
  console.log("╚══════════════════════════════════════════╝");

  const start = Date.now();

  // 1. Weather (longest — 10 years of daily data for 20 cities)
  run("Collect Weather", "collect-weather.ts");

  // 2. Holidays
  run("Collect Holidays", "collect-holidays.ts");

  // 3. Exchange Rates
  run("Collect Exchange Rates", "collect-exchange.ts");

  // 4. Buzz (optional — requires NAVER_CLIENT_ID / NAVER_CLIENT_SECRET)
  const hasBuzzKeys =
    process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET;
  if (hasBuzzKeys) {
    run("Collect Buzz", "collect-buzz.ts");
  } else {
    console.log("\n⚠ Collect Buzz — skipped (NAVER_CLIENT_ID not set)");
  }

  // 5. Calculate Scores
  run("Calculate Scores", "calculate-scores.ts");

  const totalElapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n════════════════════════════════════════════`);
  console.log(`  All done in ${totalElapsed}s`);
  console.log(`════════════════════════════════════════════\n`);
}

main();
