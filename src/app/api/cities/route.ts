import { NextRequest, NextResponse } from "next/server";
import { getCities } from "@/lib/data-service";

/**
 * GET /api/cities
 * 도시 목록 조회 (검색어 필터 지원)
 *
 * Query params:
 *   - search (optional): 도시 이름/영문명/국가로 필터링
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") ?? undefined;

  const cities = getCities(search);

  return NextResponse.json(
    { cities },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
