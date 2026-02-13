import "dotenv/config";

// Run: npx tsx src/scripts/collect-holidays.ts

import { createClient } from "@supabase/supabase-js";

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

// ── Nager.Date types ─────────────────────────────────────
interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  types: string[];
}

// ── Country codes to collect (15 total) ──────────────────
const COUNTRY_CODES = [
  "KR", // 한국 (항상 포함)
  "JP",
  "VN",
  "TH",
  "US",
  "PH",
  "TW",
  "SG",
  "HK",
  "ID",
  "MY",
  "FR",
  "GB",
  "ES",
  "AU",
] as const;

// ── main ─────────────────────────────────────────────────
async function main() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];

  let totalUpserted = 0;
  let totalSkipped = 0;

  for (const countryCode of COUNTRY_CODES) {
    for (const year of years) {
      const url = `https://date.nager.at/api/v3/publicholidays/${year}/${countryCode}`;

      try {
        const res = await fetch(url);

        if (res.status === 404) {
          console.warn(
            `⚠ ${countryCode} ${year}: Not supported by Nager.Date (404), skipping`
          );
          totalSkipped++;
          await sleep(500);
          continue;
        }

        if (!res.ok) {
          console.error(
            `✗ ${countryCode} ${year}: HTTP ${res.status} ${res.statusText}`
          );
          totalSkipped++;
          await sleep(500);
          continue;
        }

        const holidays: NagerHoliday[] = await res.json();

        // Filter for public holidays only
        const publicHolidays = holidays.filter((h) =>
          h.types.includes("Public")
        );

        if (publicHolidays.length === 0) {
          console.log(`  ${countryCode} ${year}: No public holidays found`);
          await sleep(500);
          continue;
        }

        // Prepare rows for upsert
        const rows = publicHolidays.map((h) => ({
          country_code: h.countryCode,
          holiday_date: h.date,
          name: h.name,
          is_public: true,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("holidays")
          .upsert(rows, { onConflict: "country_code,holiday_date" });

        if (error) {
          console.error(
            `✗ ${countryCode} ${year}: Supabase error — ${error.message}`
          );
        } else {
          console.log(
            `✓ ${countryCode} ${year}: ${publicHolidays.length} public holidays upserted`
          );
          totalUpserted += publicHolidays.length;
        }
      } catch (err) {
        console.error(
          `✗ ${countryCode} ${year}: ${err instanceof Error ? err.message : err}`
        );
      }

      await sleep(500);
    }
  }

  console.log(
    `\n✅ Done — ${totalUpserted} holidays upserted, ${totalSkipped} country/year skipped`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
