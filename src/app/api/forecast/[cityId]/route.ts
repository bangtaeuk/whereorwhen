import { NextRequest, NextResponse } from "next/server";
import { getCityById } from "@/lib/data-service";
import { getForecast } from "@/lib/forecast";

/**
 * GET /api/forecast/:cityId
 * 특정 도시의 14일 예보 + 역사 평균 대비 비교
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cityId: string }> },
) {
  const { cityId } = await params;
  const city = getCityById(cityId);

  if (!city) {
    return NextResponse.json(
      { error: `City not found: ${cityId}` },
      { status: 404 },
    );
  }

  try {
    const summary = await getForecast(cityId, city.latitude, city.longitude);

    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=43200",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch forecast: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 502 },
    );
  }
}
