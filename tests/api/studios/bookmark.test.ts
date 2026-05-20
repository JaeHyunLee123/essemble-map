// 특정 합주실의 북마크를 설정하거나 해제하는 API 단위 테스트 파일
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/studios/[id]/bookmark/route";
import { db } from "@/db";
import { verifyToken } from "@/lib/jwt";
import { studios, bookmarks } from "@/db/schema";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/jwt", () => ({
  verifyToken: vi.fn(),
}));

describe("POST /api/studios/:id/bookmark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증 헤더가 없으면 401 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/uuid-1/bookmark", {
      method: "POST",
    });

    const response = await POST(request, { params: Promise.resolve({ id: "uuid-1" }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("유효하지 않은 토큰이면 401 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/uuid-1/bookmark", {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid-token",
      },
    });

    (verifyToken as any).mockReturnValue(null);

    const response = await POST(request, { params: Promise.resolve({ id: "uuid-1" }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("존재하지 않거나 active 상태가 아닌 합주실이면 404 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/uuid-1/bookmark", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });

    (verifyToken as any).mockReturnValue({ userId: "user-1", username: "testuser", role: "user" });
    
    // 합주실 조회: 존재하지 않음
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "uuid-1" }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("STUDIO_NOT_FOUND");
  });

  it("북마크가 되어 있지 않다면 새로 추가하고 성공 응답을 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/uuid-1/bookmark", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });

    (verifyToken as any).mockReturnValue({ userId: "user-1", username: "testuser", role: "user" });
    
    // Drizzle 체이닝 모킹
    const fromMock = vi.fn().mockImplementation((table: any) => {
      if (table === studios) {
        return {
          where: vi.fn().mockResolvedValue([{ id: "uuid-1", status: "active" }]),
        };
      }
      if (table === bookmarks) {
        return {
          where: vi.fn().mockResolvedValue([]), // 북마크 안 됨
        };
      }
      return {
        where: vi.fn().mockResolvedValue([]),
      };
    });

    (db.select as any).mockReturnValue({
      from: fromMock,
    });

    // insert 모킹
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "uuid-1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.bookmarked).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it("이미 북마크가 되어 있다면 삭제하고 성공 응답을 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/uuid-1/bookmark", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });

    (verifyToken as any).mockReturnValue({ userId: "user-1", username: "testuser", role: "user" });

    // Drizzle 체이닝 모킹
    const fromMock = vi.fn().mockImplementation((table: any) => {
      if (table === studios) {
        return {
          where: vi.fn().mockResolvedValue([{ id: "uuid-1", status: "active" }]),
        };
      }
      if (table === bookmarks) {
        return {
          where: vi.fn().mockResolvedValue([{ userId: "user-1", studioId: "uuid-1" }]), // 이미 북마크 됨
        };
      }
      return {
        where: vi.fn().mockResolvedValue([]),
      };
    });

    (db.select as any).mockReturnValue({
      from: fromMock,
    });

    // delete 모킹
    (db.delete as any).mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "uuid-1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.bookmarked).toBe(false);
    expect(db.delete).toHaveBeenCalled();
  });
});
