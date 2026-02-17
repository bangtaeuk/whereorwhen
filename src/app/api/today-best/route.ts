import { NextResponse } from "next/server";
import { calculateTodayBest } from "@/lib/today-best";

/**
 * GET /api/today-best
 * 오늘의 BEST 타이밍 TOP 10
 */
export async function GET() {
  const today = new Date();
  const rankings = await calculateTodayBest(today);

  return NextResponse.json(
    {
      date: today.toISOString().slice(0, 10),
      rankings,
      generatedAt: today.toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    },
  );
}
