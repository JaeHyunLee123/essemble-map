// 특정 합주실의 상세 정보를 조회하는 API 단위 테스트 파일
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/studios/[id]/route";
import { db } from "@/db";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

describe("GET /api/studios/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("존재하는 합주실 ID로 요청 시 상세 정보와 rooms 빈 배열을 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/uuid-1");
    const mockStudio = {
      id: "uuid-1",
      name: "낙원 합주실",
      description: "최고의 시설...",
      images: [],
      lat: 37.1234,
      lng: 127.1234,
      mapUrl: "https://map.naver.com/p/entry/place/12345",
      status: "active",
    };

    (db.select as unknown as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockStudio]),
    });

    // Next.js 15+ dynamic route params support
    const response = await GET(request, { params: Promise.resolve({ id: "uuid-1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("uuid-1");
    expect(body.data.name).toBe("낙원 합주실");
    expect(body.data.rooms).toEqual([]); // MVP 스코프 준수를 위한 빈 배열
  });

  it("존재하지 않는 합주실 ID인 경우 404 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/non-existent-id");

    (db.select as unknown as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });

    const response = await GET(request, { params: Promise.resolve({ id: "non-existent-id" }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("STUDIO_NOT_FOUND");
  });
});
