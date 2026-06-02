// 어드민용 수정 요청 대기열 조회 API 단위 테스트 파일
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/admin/studio-requests/pending/route";
import { db } from "@/db";
import { verifyToken } from "@/lib/jwt";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@/lib/jwt", () => ({
  verifyToken: vi.fn(),
}));

describe("GET /api/admin/studio-requests/pending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증 헤더가 없으면 401 Unauthorized 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/admin/studio-requests/pending", {
      method: "GET",
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("일반 유저 권한이면 403 Forbidden 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/admin/studio-requests/pending", {
      method: "GET",
      headers: {
        Authorization: "Bearer user-token",
      },
    });

    (verifyToken as any).mockReturnValue({
      userId: "user-1",
      username: "normaluser",
      role: "user",
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("어드민 권한이면 pending 상태인 수정 요청 목록을 200 OK와 함께 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/admin/studio-requests/pending", {
      method: "GET",
      headers: {
        Authorization: "Bearer admin-token",
      },
    });

    (verifyToken as any).mockReturnValue({
      userId: "admin-1",
      username: "adminuser",
      role: "admin",
    });

    const mockPendingRequests = [
      {
        id: "req-1",
        studioId: "studio-1",
        name: "수정된 홍대 합주실",
        description: "수정된 설명",
        mapUrl: "https://map.naver.com/p/entry/place/123",
        createdAt: new Date("2026-06-02T00:00:00.000Z"),
        originalStudio: {
          name: "원래 홍대 합주실",
          description: "원래 설명",
          mapUrl: "https://map.naver.com/p/entry/place/000",
        },
      },
    ];

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue(mockPendingRequests),
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("req-1");
    expect(body.data[0].originalStudio.name).toBe("원래 홍대 합주실");
    expect(db.select).toHaveBeenCalled();
  });
});
