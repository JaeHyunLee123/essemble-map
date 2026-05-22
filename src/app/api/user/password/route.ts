// 사용자 비밀번호를 검증하고 변경하는 API 핸들러
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import bcrypt from "bcryptjs";

/**
 * 비밀번호 변경 API (PATCH /api/user/password)
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
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        errorResponse("MISSING_FIELDS", "기존 비밀번호와 새 비밀번호를 모두 입력해주세요."),
        { status: 400 }
      );
    }

    // 3. 현재 유저 정보 조회
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.userId));

    if (!currentUser) {
      return NextResponse.json(
        errorResponse("USER_NOT_FOUND", "사용자를 찾을 수 없습니다."),
        { status: 404 }
      );
    }

    // 4. 기존 비밀번호 일치 확인
    const isPasswordMatch = await bcrypt.compare(currentPassword, currentUser.passwordHashed);

    if (!isPasswordMatch) {
      return NextResponse.json(
        errorResponse("INVALID_PASSWORD", "기존 비밀번호가 일치하지 않습니다."),
        { status: 401 }
      );
    }

    // 5. 새 비밀번호 해싱 및 업데이트
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({
        passwordHashed: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.userId));

    return NextResponse.json(
      successResponse({
        message: "비밀번호가 성공적으로 변경되었습니다.",
      })
    );
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
