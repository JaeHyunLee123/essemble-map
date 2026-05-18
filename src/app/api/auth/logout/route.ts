// 로그아웃 API 핸들러
// Refresh Token 쿠키를 제거함

import { NextRequest, NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  const response = NextResponse.json(successResponse({ message: "로그아웃 성공" }));

  // Refresh Token 쿠키 삭제 (만료 시간을 과거로 설정)
  response.cookies.set("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
    path: "/",
  });

  return response;
}
