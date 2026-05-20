// 특정 합주실의 북마크 상태를 설정하거나 해제하는 API 핸들러
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studios, bookmarks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * 합주실 북마크 토글 (POST /api/studios/:id/bookmark)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // 1. 사용자 인증 확인
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", "로그인이 필요합니다."),
        { status: 401 }
      );
    }

    // 2. 파라미터 획득
    const resolvedParams = await params;
    const { id: studioId } = resolvedParams;

    if (!studioId) {
      return NextResponse.json(
        errorResponse("MISSING_STUDIO_ID", "합주실 식별자가 누락되었습니다."),
        { status: 400 }
      );
    }

    // 3. active 상태의 합주실 존재 여부 검증
    const [studio] = await db
      .select()
      .from(studios)
      .where(eq(studios.id, studioId));

    if (!studio || studio.status !== "active") {
      return NextResponse.json(
        errorResponse("STUDIO_NOT_FOUND", "존재하지 않거나 활성화되지 않은 합주실입니다."),
        { status: 404 }
      );
    }

    // 4. 기존 북마크 여부 확인
    const [existingBookmark] = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, user.userId),
          eq(bookmarks.studioId, studioId)
        )
      );

    if (existingBookmark) {
      // 5. 북마크가 이미 존재하면 해제(삭제)
      await db
        .delete(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, user.userId),
            eq(bookmarks.studioId, studioId)
          )
        );

      return NextResponse.json(
        successResponse({
          bookmarked: false,
          message: "북마크가 해제되었습니다.",
        })
      );
    } else {
      // 6. 북마크가 존재하지 않으면 새로 등록(추가)
      await db.insert(bookmarks).values({
        userId: user.userId,
        studioId: studioId,
      });

      return NextResponse.json(
        successResponse({
          bookmarked: true,
          message: "북마크에 등록되었습니다.",
        })
      );
    }
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
