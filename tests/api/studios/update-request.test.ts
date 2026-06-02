// 합주실 정보 수정 요청 API 단위 테스트 파일
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/studios/[id]/update-request/route";
import { db } from "@/db";
import { verifyToken } from "@/lib/jwt";
import { parseNaverMapUrl, InvalidNaverMapUrlError } from "@/lib/naverMap";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock("@/lib/jwt", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/naverMap", () => ({
  parseNaverMapUrl: vi.fn(),
  InvalidNaverMapUrlError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "InvalidNaverMapUrlError";
    }
  },
}));

describe("POST /api/studios/:id/update-request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default select mock to prevent chained TypeError
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: "studio-1", status: "active" }]),
      }),
    });
  });

  it("인증 헤더가 없으면 401 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/studio-1/update-request", {
      method: "POST",
      body: JSON.stringify({
        name: "수정된 낙원 합주실",
        mapUrl: "https://map.naver.com/p/entry/place/12345",
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "studio-1" }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("필수 입력값(name 또는 mapUrl)이 없으면 400 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/studio-1/update-request", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        mapUrl: "https://map.naver.com/p/entry/place/12345",
        // name 누락
      }),
    });

    (verifyToken as any).mockReturnValue({ userId: "user-1", username: "testuser", role: "user" });

    const response = await POST(request, { params: Promise.resolve({ id: "studio-1" }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_INPUT");
  });

  it("네이버 지도 URL 파싱에 실패하면 400 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/studio-1/update-request", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        name: "수정된 낙원 합주실",
        mapUrl: "https://invalid-url.com",
      }),
    });

    (verifyToken as any).mockReturnValue({ userId: "user-1", username: "testuser", role: "user" });
    (parseNaverMapUrl as any).mockRejectedValue(new InvalidNaverMapUrlError("유효한 네이버 지도 링크가 아닙니다."));

    // DB select mocking for studio existence check
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: "studio-1" }]),
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "studio-1" }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_MAP_URL");
  });

  it("존재하지 않는 합주실에 대한 요청은 404 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/studio-1/update-request", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        name: "수정된 낙원 합주실",
        mapUrl: "https://map.naver.com/p/entry/place/12345",
      }),
    });

    (verifyToken as any).mockReturnValue({ userId: "user-1", username: "testuser", role: "user" });
    
    // DB select returning empty (studio not found)
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "studio-1" }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("정상 정보가 제출되면 위경도를 자동 추출해 pending 상태로 저장하고 201 응답을 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/studio-1/update-request", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        name: "수정된 낙원 합주실",
        description: "수정된 설명",
        mapUrl: "https://map.naver.com/p/entry/place/12345",
      }),
    });

    (verifyToken as any).mockReturnValue({ userId: "user-1", username: "testuser", role: "user" });
    (parseNaverMapUrl as any).mockResolvedValue({ lat: 37.5665, lng: 126.9780 });

    // DB select mocking for studio existence check
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: "studio-1", status: "active" }]),
      }),
    });

    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: "req-1",
          studioId: "studio-1",
          name: "수정된 낙원 합주실",
          status: "pending",
        }]),
      }),
    });
    (db.insert as any).mockImplementation(mockInsert);

    const response = await POST(request, { params: Promise.resolve({ id: "studio-1" }) });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("req-1");
    expect(mockInsert).toHaveBeenCalled();
  });
});
