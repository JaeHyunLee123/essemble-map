// 수락 대기 중인 합주실 수정 요청 목록을 어드민용으로 조회하는 API 핸들러
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studios, studioUpdateRequests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * 어드민 수정 요청 대기열 조회 (GET /api/admin/studio-requests/pending)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 어드민 인증 검증
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", "로그인이 필요합니다."),
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        errorResponse("FORBIDDEN", "관리자 권한이 필요합니다."),
        { status: 403 }
      );
    }

    // 2. pending 상태인 수정 요청 리스트 조회 및 원본 합주실 데이터 조인
    const pendingList = await db
      .select({
        id: studioUpdateRequests.id,
        studioId: studioUpdateRequests.studioId,
        name: studioUpdateRequests.name,
        description: studioUpdateRequests.description,
        mapUrl: studioUpdateRequests.mapUrl,
        createdAt: studioUpdateRequests.createdAt,
        originalStudio: {
          name: studios.name,
          description: studios.description,
          mapUrl: studios.mapUrl,
        },
      })
      .from(studioUpdateRequests)
      .innerJoin(studios, eq(studioUpdateRequests.studioId, studios.id))
      .where(eq(studioUpdateRequests.status, "pending"))
      .orderBy(desc(studioUpdateRequests.createdAt));

    return NextResponse.json(successResponse(pendingList));
  } catch (error) {
    console.error("Fetch pending studio update requests error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
