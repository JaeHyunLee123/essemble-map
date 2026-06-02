// 회원가입 API 핸들러
// 명세서(docs/api_specification.md)의 2.1 회원가입 규격을 준수함

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ERROR_CODES } from "@/lib/error-codes";

export async function POST(request: NextRequest) {
  try {
    const { username, password, nickname } = await request.json();

    // 1. 필수 값 검증
    if (!username || !password || !nickname) {
      return NextResponse.json(
        errorResponse(ERROR_CODES.MISSING_FIELDS, "아이디, 비밀번호, 닉네임은 필수입니다."),
        { status: 400 }
      );
    }

    // 2. 중복 검사 (아이디 또는 닉네임)
    const existingUser = await db
      .select()
      .from(users)
      .where(or(eq(users.username, username), eq(users.nickname, nickname)));

    if (existingUser.length > 0) {
      const isDuplicateUsername = existingUser.some((u) => u.username === username);
      if (isDuplicateUsername) {
        return NextResponse.json(
          errorResponse(ERROR_CODES.DUPLICATE_USERNAME, "이미 사용 중인 아이디입니다."),
          { status: 400 }
        );
      }
      return NextResponse.json(
        errorResponse(ERROR_CODES.DUPLICATE_NICKNAME, "이미 사용 중인 닉네임입니다."),
        { status: 400 }
      );
    }

    // 3. 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. DB 저장
    await db.insert(users).values({
      username,
      passwordHashed: hashedPassword,
      nickname,
      role: "user",
    });

    return NextResponse.json(successResponse({ message: "회원가입 성공" }), {
      status: 201,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      errorResponse(ERROR_CODES.SERVER_ERROR, "서버 오류가 발생했습니다."),
      { status: 500 }
    );
  }
}
