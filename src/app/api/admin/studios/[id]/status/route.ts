// 어드민 전용 합주실 제보 상태 변경(수락/반려/삭제) API 핸들러.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function PATCH(request: NextRequest, context: RouteParams) {
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

    // 2. 동적 파라미터 파싱 (Next.js 16 비동기 파라미터 처리 지원)
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        errorResponse("INVALID_INPUT", "합주실 ID가 누락되었습니다."),
        { status: 400 }
      );
    }

    // 3. 요청 본문 데이터 검증
    const { status, denyReason } = await request.json();

    if (!status || (status !== "active" && status !== "deny")) {
      return NextResponse.json(
        errorResponse("INVALID_INPUT", "올바르지 않은 상태 값입니다."),
        { status: 400 }
      );
    }

    if (status === "deny" && (!denyReason || denyReason.trim() === "")) {
      return NextResponse.json(
        errorResponse("MISSING_DENY_REASON", "반려 시 사유를 반드시 입력해야 합니다."),
        { status: 400 }
      );
    }

    // 4. 대상 합주실 존재 여부 확인
    const [existingStudio] = await db
      .select()
      .from(studios)
      .where(eq(studios.id, id));

    if (!existingStudio) {
      return NextResponse.json(
        errorResponse("STUDIO_NOT_FOUND", "해당 합주실을 찾을 수 없습니다."),
        { status: 404 }
      );
    }

    // 5. 합주실 상태 업데이트
    const [updatedStudio] = await db
      .update(studios)
      .set({
        status,
        denyReason: status === "deny" ? denyReason : null,
        updatedAt: new Date(),
      })
      .where(eq(studios.id, id))
      .returning();

    return NextResponse.json(successResponse(updatedStudio));
  } catch (error) {
    console.error("Studio status update error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
