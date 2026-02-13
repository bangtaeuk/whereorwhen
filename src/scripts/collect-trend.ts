import "dotenv/config";

// Run: npx tsx src/scripts/collect-trend.ts

import { createClient } from "@supabase/supabase-js";
import { cities } from "../data/cities";

// ── helpers ──────────────────────────────────────────────
function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Supabase client ──────────────────────────────────────
const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY")
);

// ── Naver API credentials ────────────────────────────────
const NAVER_CLIENT_ID = requireEnv("NAVER_CLIENT_ID");
const NAVER_CLIENT_SECRET = requireEnv("NAVER_CLIENT_SECRET");

// ── Naver DataLab types ──────────────────────────────────
interface DataLabKeywordGroup {
  groupName: string;
  keywords: string[];
}

interface DataLabRequest {
  startDate: string;
  endDate: string;
  timeUnit: "month" | "week" | "date";
  keywordGroups: DataLabKeywordGroup[];
}

interface DataLabDataPoint {
  period: string;
  ratio: number;
}

interface DataLabResult {
  title: string;
  keywords: string[];
  data: DataLabDataPoint[];
}

interface DataLabResponse {
  startDate: string;
  endDate: string;
  timeUnit: string;
  results: DataLabResult[];
}

// ── Naver DataLab Search ─────────────────────────────────
async function searchDataLab(
  keywordGroups: DataLabKeywordGroup[]
): Promise<DataLabResult[]> {
  const today = new Date();
  const endDate = today.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const body: DataLabRequest = {
    startDate: "2024-01-01",
    endDate,
    timeUnit: "month",
    keywordGroups,
  };

  const res = await fetch("https://openapi.naver.com/v1/datalab/search", {
    method: "POST",
    headers: {
      "X-Naver-Client-Id": NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Naver DataLab API ${res.status}: ${text}`);
  }

  const data: DataLabResponse = await res.json();
  return data.results;
}

// ── Compute monthly averages from DataLab data ───────────
// Groups ratio values by month (1-12) and averages across years
function computeMonthlyAverages(
  dataPoints: DataLabDataPoint[]
): Map<number, number> {
  const byMonth = new Map<number, number[]>();

  for (const dp of dataPoints) {
    // period format: "2024-01-01"
    const month = parseInt(dp.period.slice(5, 7), 10);
    const existing = byMonth.get(month) ?? [];
    existing.push(dp.ratio);
    byMonth.set(month, existing);
  }

  const averages = new Map<number, number>();
  for (const [month, ratios] of byMonth) {
    const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    averages.set(month, Math.round(avg * 10) / 10);
  }

  return averages;
}

// ── main ─────────────────────────────────────────────────
async function main() {
  const currentYear = new Date().getFullYear();

  console.log(
    `📊 Collecting Naver DataLab trend data for ${cities.length} cities\n`
  );
  console.log(`   startDate: 2024-01-01`);
  console.log(`   endDate:   ${new Date().toISOString().slice(0, 10)}`);
  console.log(`   timeUnit:  month\n`);

  // Split 20 cities into batches of 5 (DataLab max 5 keywordGroups per request)
  const batchSize = 5;
  const batches: (typeof cities)[] = [];
  for (let i = 0; i < cities.length; i += batchSize) {
    batches.push(cities.slice(i, i + batchSize));
  }

  console.log(
    `   ${batches.length} batch(es) of up to ${batchSize} cities each\n`
  );

  let totalRows = 0;

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    console.log(
      `── Batch ${batchIdx + 1}/${batches.length}: ${batch.map((c) => c.nameKo).join(", ")} ──`
    );

    // Build keywordGroups for this batch
    const keywordGroups: DataLabKeywordGroup[] = batch.map((city) => ({
      groupName: city.nameKo,
      keywords: city.keywords,
    }));

    try {
      const results = await searchDataLab(keywordGroups);

      // Process each city's result
      for (const result of results) {
        // Find the matching city by nameKo (groupName)
        const city = batch.find((c) => c.nameKo === result.title);
        if (!city) {
          console.warn(`  ⚠ No city match for result title: "${result.title}"`);
          continue;
        }

        const monthlyAvg = computeMonthlyAverages(result.data);

        // Log monthly ratios for this city
        const ratioStr = Array.from({ length: 12 }, (_, i) => {
          const m = i + 1;
          const val = monthlyAvg.get(m);
          return val !== undefined ? val.toFixed(1) : "-";
        }).join(" | ");
        console.log(`  ${city.nameKo}: [${ratioStr}]`);

        // Upsert each month into Supabase
        for (let month = 1; month <= 12; month++) {
          const ratio = monthlyAvg.get(month);
          if (ratio === undefined) continue;

          const { error } = await supabase.from("buzz_monthly").upsert(
            {
              city_id: city.id,
              month,
              year: currentYear,
              total_count: Math.round(ratio),
              keywords: city.keywords,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "city_id,month,year" }
          );

          if (error) {
            console.error(
              `  ✗ ${city.nameKo} ${month}월: Supabase error — ${error.message}`
            );
          } else {
            totalRows++;
          }
        }
      }
    } catch (err) {
      console.error(
        `  ✗ Batch ${batchIdx + 1} error: ${err instanceof Error ? err.message : err}`
      );
    }

    // 500ms delay between batches
    if (batchIdx < batches.length - 1) {
      await sleep(500);
    }
  }

  console.log(`\n✅ Done — ${totalRows} rows upserted into buzz_monthly`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
