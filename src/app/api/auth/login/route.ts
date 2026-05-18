// 로그인 API 핸들러
// 명세서(docs/api_specification.md)의 2.2 로그인 규격을 준수함

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 1. 필수 값 검증
    if (!username || !password) {
      return NextResponse.json(
        errorResponse("MISSING_FIELDS", "아이디와 비밀번호를 입력해주세요."),
        { status: 400 }
      );
    }

    // 2. 유저 조회
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (!user) {
      return NextResponse.json(
        errorResponse("INVALID_CREDENTIALS", "아이디 또는 비밀번호가 일치하지 않습니다."),
        { status: 401 }
      );
    }

    // 3. 비밀번호 확인
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHashed);

    if (!isPasswordMatch) {
      return NextResponse.json(
        errorResponse("INVALID_CREDENTIALS", "아이디 또는 비밀번호가 일치하지 않습니다."),
        { status: 401 }
      );
    }

    // 4. 토큰 생성
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // 5. 응답 생성
    const response = NextResponse.json(
      successResponse({
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
        },
        accessToken,
      })
    );

    // 6. Refresh Token 쿠키 설정 (HttpOnly, Secure, SameSite=Strict)
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
