// 승인 완료된 활성 합주실 목록을 어드민 관리용으로 조회하는 API 핸들러.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studios } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

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

    // 2. active 상태인 합주실 리스트 조회
    const activeList = await db
      .select()
      .from(studios)
      .where(eq(studios.status, "active"))
      .orderBy(desc(studios.createdAt));

    return NextResponse.json(successResponse(activeList));
  } catch (error) {
    console.error("Fetch active studios error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
