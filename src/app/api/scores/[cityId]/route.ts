import { NextRequest, NextResponse } from "next/server";
import { getCityById, getScoresForCity } from "@/lib/data-service";

/**
 * GET /api/scores/:cityId
 * Mode A ("Where→When"): 특정 도시의 12개월 점수 조회
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cityId: string }> }
) {
  const { cityId } = await params;

  const city = getCityById(cityId);

  if (!city) {
    return NextResponse.json(
      { error: `City not found: ${cityId}` },
      { status: 404 }
    );
  }

  const scores = await getScoresForCity(cityId);

  // 최고 점수 월
  const bestMonth = scores.reduce(
    (best, s) =>
      s.scores.total > best.score
        ? { month: s.month, score: s.scores.total }
        : best,
    { month: 1, score: 0 }
  );

  // 현재 월
  const now = new Date();
  const currentMonthNum = now.getMonth() + 1;
  const currentMonthScore = scores.find((s) => s.month === currentMonthNum);

  return NextResponse.json(
    {
      city,
      scores,
      bestMonth,
      currentMonth: {
        month: currentMonthNum,
        score: currentMonthScore?.scores.total ?? 0,
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
