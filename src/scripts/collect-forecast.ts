import "dotenv/config";

/**
 * 20개 도시 14일 예보 일괄 수집 스크립트
 * Run: npx tsx src/scripts/collect-forecast.ts
 *
 * Open-Meteo Forecast API에서 예보를 가져와 Supabase forecast_cache에 저장
 * 6시간 간격으로 실행 권장
 */

import { cities } from "../data/cities";
import { fetchForecastFromAPI, saveForecastCache } from "../lib/forecast";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`Collecting forecasts for ${cities.length} cities...\n`);

  let success = 0;
  let failed = 0;

  for (const city of cities) {
    try {
      const days = await fetchForecastFromAPI(city.latitude, city.longitude);
      await saveForecastCache(city.id, days);

      const clearDays = days.filter((d) => d.isClear).length;
      const avgTemp =
        days.reduce((s, d) => s + (d.tempMax + d.tempMin) / 2, 0) / days.length;

      console.log(
        `  ${city.nameKo}: ${clearDays}/${days.length} clear, avg ${avgTemp.toFixed(1)}°C`,
      );
      success++;
    } catch (err) {
      console.error(
        `  ${city.nameKo}: FAILED — ${err instanceof Error ? err.message : err}`,
      );
      failed++;
    }

    await sleep(500);
  }

  console.log(`\nDone — ${success} success, ${failed} failed`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
