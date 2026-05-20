// 특정 합주실의 상세 정보를 조회하는 API 핸들러
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studios, bookmarks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * 특정 합주실 상세 조회 (GET /api/studios/:id)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 15+ 사양 대응을 위해 params를 await할 수 있도록 처리함.
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        errorResponse("MISSING_STUDIO_ID", "합주실 식별자가 누락되었습니다."),
        { status: 400 }
      );
    }

    // 1. DB에서 단일 합주실 레코드 조회
    const [studio] = await db
      .select()
      .from(studios)
      .where(eq(studios.id, id));

    if (!studio) {
      return NextResponse.json(
        errorResponse("STUDIO_NOT_FOUND", "해당 합주실을 찾을 수 없습니다."),
        { status: 404 }
      );
    }

    // 2. 로그인 유저 본인의 북마크 여부 판단
    let isBookmarked = false;
    const user = getAuthenticatedUser(request);
    if (user) {
      const [userBookmark] = await db
        .select()
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, user.userId),
            eq(bookmarks.studioId, id)
          )
        );
      isBookmarked = !!userBookmark;
    }

    // 3. 응답 데이터 구성 (MVP 준수를 위해 rooms: [] 배열 하드코딩)
    const responseData = {
      ...studio,
      bookmarked: isBookmarked,
      rooms: [],
    };

    return NextResponse.json(successResponse(responseData));
  } catch (error) {
    console.error("Get studio detail error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
