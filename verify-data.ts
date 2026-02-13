import { mockScores } from "./src/data/mock-scores";
import { generateHighlights } from "./src/lib/highlights";

console.log("=== DATA COMPLETENESS ===");
console.log("Total records:", mockScores.length, "(expected: 240)");
const cityIds = [...new Set(mockScores.map((s) => s.cityId))];
console.log("Unique cities:", cityIds.length, "(expected: 20)");

console.log("\n=== SCORE RANGE CHECK ===");
let minTotal = 10, maxTotal = 0, nanCount = 0;
const outOfRange: string[] = [];
mockScores.forEach((s) => {
  const t = s.scores.total;
  if (isNaN(t)) nanCount++;
  if (t < minTotal) minTotal = t;
  if (t > maxTotal) maxTotal = t;
  (["weather", "cost", "crowd", "buzz"] as const).forEach((k) => {
    const v = s.scores[k];
    if (v < 1 || v > 10) outOfRange.push(s.cityId + "/" + s.month + "/" + k + "=" + v);
    if (isNaN(v)) outOfRange.push("NaN: " + s.cityId + "/" + s.month + "/" + k);
  });
});
console.log("Total score range:", minTotal, "-", maxTotal);
console.log("NaN count:", nanCount);
console.log("Out of range:", outOfRange.length === 0 ? "NONE" : outOfRange.join(", "));

console.log("\n=== VARIATION CHECK ===");
cityIds.forEach((c) => {
  const totals = mockScores.filter((s) => s.cityId === c).map((s) => s.scores.total);
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  if (totals.every((t) => t === totals[0])) console.log("  ALL SAME:", c);
  if (max - min < 1) console.log("  LOW VAR:", c, min, "-", max);
});
console.log("Done");

console.log("\n=== OSAKA SAMPLE ===");
const osaka = mockScores.filter((s) => s.cityId === "osaka");
osaka.forEach((s) => {
  const hl = generateHighlights("osaka", s.month, s.scores);
  console.log("  " + s.month + "m: t=" + s.scores.total + " hl=[" + hl.join(",") + "]");
});

console.log("\n=== DONE ===");
