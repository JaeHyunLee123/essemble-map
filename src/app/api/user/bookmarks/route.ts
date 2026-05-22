// 사용자가 북마크한 합주실 목록을 조회하는 API 핸들러
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookmarks, studios } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * 북마크 목록 조회 API (GET /api/user/bookmarks)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 사용자 인증 확인
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", "로그인이 필요합니다."),
        { status: 401 }
      );
    }

    // 2. 북마크 목록 Inner Join 조회 (active 상태인 합주실만)
    const list = await db
      .select({
        id: studios.id,
        name: studios.name,
        mapUrl: studios.mapUrl,
        description: studios.description,
        images: studios.images,
        lat: studios.lat,
        lng: studios.lng,
        status: studios.status,
        createdAt: studios.createdAt,
      })
      .from(bookmarks)
      .innerJoin(studios, eq(bookmarks.studioId, studios.id))
      .where(
        and(
          eq(bookmarks.userId, user.userId),
          eq(studios.status, "active")
        )
      );

    return NextResponse.json(successResponse(list));
  } catch (error) {
    console.error("Fetch bookmarks error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
