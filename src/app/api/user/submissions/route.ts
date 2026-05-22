// 사용자가 제보한 합주실 내역 목록을 조회하는 API 핸들러
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studios } from "@/db/schema";
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
    const list = await db
      .select()
      .from(studios)
      .where(eq(studios.createdBy, user.userId));

    // 3. 응답 객체 변환 (type: 'studio' 기본 포함, 반려사유 포함)
    const mapped = list.map((item) => ({
      id: item.id,
      type: "studio",
      name: item.name,
      status: item.status,
      denyReason: item.status === "deny" ? item.denyReason : null,
      createdAt: item.createdAt,
    }));

    return NextResponse.json(successResponse(mapped));
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
