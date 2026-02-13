// Run: npx tsx src/scripts/collect-buzz.ts

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

// ── Naver Blog Search response ───────────────────────────
interface NaverBlogResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: unknown[];
}

// ── Naver Blog Search ────────────────────────────────────
async function searchNaverBlog(query: string): Promise<number> {
  const params = new URLSearchParams({
    query,
    display: "1",
    sort: "date",
  });

  const url = `https://openapi.naver.com/v1/search/blog.json?${params}`;

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Naver API ${res.status}: ${body}`);
  }

  const data: NaverBlogResponse = await res.json();
  return data.total;
}

// ── month label ──────────────────────────────────────────
const MONTH_LABELS = [
  "",
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
] as const;

// ── main ─────────────────────────────────────────────────
async function main() {
  const currentYear = new Date().getFullYear();

  console.log(
    `🔍 Collecting buzz data for ${cities.length} cities × 12 months (year=${currentYear})\n`
  );

  let totalRows = 0;

  for (const city of cities) {
    for (let month = 1; month <= 12; month++) {
      const monthLabel = MONTH_LABELS[month];
      const keywords: Record<string, number> = {};
      let totalCount = 0;

      try {
        // Search with month-specific keywords
        for (const baseKeyword of city.keywords) {
          const monthQuery = `${baseKeyword} ${monthLabel}`;

          const monthTotal = await searchNaverBlog(monthQuery);
          keywords[monthQuery] = monthTotal;
          totalCount += monthTotal;
          await sleep(100);

          // Also search base keyword (without month) for overall volume
          if (!(baseKeyword in keywords)) {
            const baseTotal = await searchNaverBlog(baseKeyword);
            keywords[baseKeyword] = baseTotal;
            totalCount += baseTotal;
            await sleep(100);
          }
        }

        // Upsert into Supabase
        const { error } = await supabase.from("buzz_monthly").upsert(
          {
            city_id: city.id,
            month,
            year: currentYear,
            total_count: totalCount,
            keywords,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "city_id,month,year" }
        );

        if (error) {
          console.error(
            `✗ ${city.nameKo} ${month}월: Supabase error — ${error.message}`
          );
        } else {
          console.log(
            `✓ Buzz for ${city.nameKo} ${month}월: ${totalCount.toLocaleString()}`
          );
          totalRows++;
        }
      } catch (err) {
        console.error(
          `✗ ${city.nameKo} ${month}월: ${err instanceof Error ? err.message : err}`
        );
        // Continue to next city/month on error
      }
    }
  }

  console.log(`\n✅ Done — ${totalRows} rows upserted`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
