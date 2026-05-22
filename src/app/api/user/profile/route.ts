// 사용자 프로필(닉네임) 정보를 수정하는 API 핸들러
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, ne, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

/**
 * 닉네임 변경 API (PATCH /api/user/profile)
 */
export async function PATCH(request: NextRequest) {
  try {
    // 1. 사용자 인증 확인
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", "로그인이 필요합니다."),
        { status: 401 }
      );
    }

    // 2. 요청 바디 데이터 획득
    const { nickname } = await request.json();

    if (!nickname || nickname.trim() === "") {
      return NextResponse.json(
        errorResponse("MISSING_FIELDS", "새로운 닉네임을 입력해주세요."),
        { status: 400 }
      );
    }

    // 3. 닉네임 중복 체크 (본인 제외 타인 중복 여부)
    const [existingUser] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.nickname, nickname),
          ne(users.id, user.userId)
        )
      );

    if (existingUser) {
      return NextResponse.json(
        errorResponse("DUPLICATE_NICKNAME", "이미 사용 중인 닉네임입니다."),
        { status: 400 }
      );
    }

    // 4. 유저 정보 업데이트
    const [updatedUser] = await db
      .update(users)
      .set({
        nickname,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.userId))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        errorResponse("USER_NOT_FOUND", "사용자를 찾을 수 없습니다."),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          nickname: updatedUser.nickname,
          role: updatedUser.role,
        },
      })
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
