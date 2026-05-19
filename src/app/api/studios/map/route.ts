// 지도 범위 기반으로 active 상태의 합주실 목록을 조회하는 API 핸들러
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studios } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * 쿼리 파라미터 검증 스키마
 */
const mapQuerySchema = z.object({
  neLat: z.string().transform(val => parseFloat(val)).refine(val => !isNaN(val)),
  neLng: z.string().transform(val => parseFloat(val)).refine(val => !isNaN(val)),
  swLat: z.string().transform(val => parseFloat(val)).refine(val => !isNaN(val)),
  swLng: z.string().transform(val => parseFloat(val)).refine(val => !isNaN(val)),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const rawParams = {
    neLat: searchParams.get("neLat"),
    neLng: searchParams.get("neLng"),
    swLat: searchParams.get("swLat"),
    swLng: searchParams.get("swLng"),
  };

  // 모든 파라미터가 존재해야 함
  if (!rawParams.neLat || !rawParams.neLng || !rawParams.swLat || !rawParams.swLng) {
    return NextResponse.json(
      errorResponse("INVALID_QUERY_PARAMS", "모든 좌표 파라미터(neLat, neLng, swLat, swLng)가 필요합니다."),
      { status: 400 }
    );
  }

  const queryResult = mapQuerySchema.safeParse(rawParams);

  if (!queryResult.success) {
    return NextResponse.json(
      errorResponse("INVALID_QUERY_PARAMS", "올바르지 않은 쿼리 파라미터입니다."),
      { status: 400 }
    );
  }

  const { neLat, neLng, swLat, swLng } = queryResult.data;

  try {
    const results = await db
      .select({
        id: studios.id,
        name: studios.name,
        lat: studios.lat,
        lng: studios.lng,
      })
      .from(studios)
      .where(
        and(
          eq(studios.status, "active"),
          gte(studios.lat, swLat),
          lte(studios.lat, neLat),
          gte(studios.lng, swLng),
          lte(studios.lng, neLng)
        )
      );

    return NextResponse.json(successResponse(results));
  } catch (error) {
    console.error("Map studios API error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 에러가 발생했습니다."),
      { status: 500 }
    );
  }
}
