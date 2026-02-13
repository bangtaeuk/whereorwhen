import { NextRequest, NextResponse } from "next/server";
import { getCityById, getRankingForMonth } from "@/lib/data-service";
import { generateHighlights } from "@/lib/highlights";

/**
 * GET /api/scores/ranking?month=3
 * Mode B ("When→Where"): 특정 월의 도시 랭킹
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const monthParam = searchParams.get("month");

  // 월 파라미터 유효성 검사
  if (!monthParam) {
    return NextResponse.json(
      { error: "month query parameter is required (1-12)" },
      { status: 400 }
    );
  }

  const month = Number(monthParam);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: `Invalid month: ${monthParam}. Must be integer 1-12.` },
      { status: 400 }
    );
  }

  const monthlyScores = await getRankingForMonth(month);

  const rankings = monthlyScores.map((ms, index) => {
    const city = getCityById(ms.cityId);
    const highlights = generateHighlights(ms.cityId, month, ms.scores);

    return {
      rank: index + 1,
      city: city!,
      scores: ms.scores,
      highlights,
    };
  });

  return NextResponse.json(
    { month, rankings },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
