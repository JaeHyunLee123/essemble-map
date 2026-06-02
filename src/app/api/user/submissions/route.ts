// 사용자가 제보한 합주실 내역 목록을 조회하는 API 핸들러
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studios, studioUpdateRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * 제보 내역 조회 API (GET /api/user/submissions)
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

    // 2. 유저가 제보한 합주실 조회 (pending, active, deny 전체)
    const studioList = await db
      .select()
      .from(studios)
      .where(eq(studios.createdBy, user.userId));

    // 3. 유저가 제안한 합주실 정보 수정 요청 조회 (pending, approved, rejected 전체)
    const updateRequestList = await db
      .select()
      .from(studioUpdateRequests)
      .where(eq(studioUpdateRequests.createdBy, user.userId));

    // 4. 응답 객체 변환 (type: 'studio' / 'studio_update_request')
    const mappedStudios = studioList.map((item) => ({
      id: item.id,
      type: "studio",
      name: item.name,
      status: item.status,
      denyReason: item.status === "deny" ? item.denyReason : null,
      createdAt: item.createdAt,
    }));

    const mappedUpdateRequests = updateRequestList.map((item) => ({
      id: item.id,
      type: "studio_update_request",
      name: item.name,
      status: item.status,
      denyReason: item.status === "rejected" ? item.denyReason : null,
      createdAt: item.createdAt,
    }));

    // 병합 및 최신순 정렬
    const mapped = [...mappedStudios, ...mappedUpdateRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(successResponse(mapped));
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
