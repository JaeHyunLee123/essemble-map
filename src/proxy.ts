// Next.js 16 통합 인증 프록시로 마이페이지 및 어드민 페이지 접근을 제어하는 파일입니다.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Base64 URL 디코딩을 안전하게 수행하는 헬퍼 함수
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

// JWT 토큰 구조에서 Payload 파싱 헬퍼 함수
function parseJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const payloadJson = base64UrlDecode(parts[1]);
    return JSON.parse(payloadJson);
  } catch (error) {
    return null;
  }
}

/**
 * Next.js 16 Proxy 미들웨어 함수
 */
export function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const path = nextUrl.pathname;
  const isAdminApi = path.startsWith("/api/admin");

  // 마이페이지, 어드민 페이지 혹은 어드민 API 경로에 대해서만 검증 진행
  if (path.startsWith("/mypage") || path.startsWith("/admin") || isAdminApi) {
    const refreshTokenCookie = request.cookies.get("refreshToken");

    if (!refreshTokenCookie || !refreshTokenCookie.value) {
      if (isAdminApi) {
        return new NextResponse(
          JSON.stringify({ success: false, error: { code: "FORBIDDEN", message: "권한이 없습니다." } }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    const payload = parseJwtPayload(refreshTokenCookie.value);

    if (!payload) {
      if (isAdminApi) {
        return new NextResponse(
          JSON.stringify({ success: false, error: { code: "FORBIDDEN", message: "권한이 없습니다." } }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 만료 여부 검증 (exp)
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      if (isAdminApi) {
        return new NextResponse(
          JSON.stringify({ success: false, error: { code: "FORBIDDEN", message: "토큰이 만료되었습니다." } }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 어드민 권한(role) 검증
    if (path.startsWith("/admin") || isAdminApi) {
      if (payload.role !== "admin") {
        if (isAdminApi) {
          return new NextResponse(
            JSON.stringify({ success: false, error: { code: "FORBIDDEN", message: "권한이 없습니다." } }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return NextResponse.next();
}

// Proxy 작동 경로 설정
export const config = {
  matcher: ["/mypage", "/admin/:path*", "/api/admin/:path*"],
};

