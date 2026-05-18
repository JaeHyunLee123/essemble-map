// JWT 생성 및 검증 유틸리티
// 명세서(docs/api_specification.md)의 1.2 인증 규격을 준수함

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_for_dev_only";
const ACCESS_TOKEN_EXPIRES_IN = "1h";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

/**
 * Access Token 생성
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

/**
 * Refresh Token 생성
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * 토큰 검증
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}
