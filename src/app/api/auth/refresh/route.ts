// 토큰 갱신(Silent Refresh) API 핸들러
// Refresh Token 쿠키를 읽어 새로운 Access Token을 발급함

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken, generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    // 1. 쿠키에서 Refresh Token 추출
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        errorResponse("MISSING_REFRESH_TOKEN", "리프레시 토큰이 없습니다."),
        { status: 401 }
      );
    }

    // 2. 토큰 검증
    const payload = verifyToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        errorResponse("INVALID_REFRESH_TOKEN", "유효하지 않은 리프레시 토큰입니다."),
        { status: 401 }
      );
    }

    // 3. 유저 확인
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId));

    if (!user) {
      return NextResponse.json(
        errorResponse("USER_NOT_FOUND", "사용자를 찾을 수 없습니다."),
        { status: 401 }
      );
    }

    // 4. 새로운 토큰 생성
    const newPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

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

    // 6. 새로운 Refresh Token 쿠키 설정
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      errorResponse("SERVER_ERROR", "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
