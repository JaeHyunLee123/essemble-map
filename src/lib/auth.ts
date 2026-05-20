// 사용자 요청의 JWT 토큰을 검증하여 유저 정보를 획득하는 헬퍼 함수
import { NextRequest } from "next/server";
import { verifyToken, TokenPayload } from "./jwt";

/**
 * 요청의 Authorization 헤더에서 JWT 토큰을 추출하고 검증합니다.
 * @param request NextRequest 객체
 * @returns 검증된 토큰 페이로드 또는 null
 */
export function getAuthenticatedUser(request: NextRequest): TokenPayload | null {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7); // "Bearer " 제거
  return verifyToken(token);
}
