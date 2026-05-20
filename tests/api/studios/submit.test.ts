// 합주실 신규 제보 API 단위 테스트 파일
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/studios/submit/route";
import { db } from "@/db";
import { verifyToken } from "@/lib/jwt";
import { parseNaverMapUrl, InvalidNaverMapUrlError } from "@/lib/naverMap";

vi.mock("@/db", () => ({
  db: {
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

describe("POST /api/studios/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증 헤더가 없으면 401 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/submit", {
      method: "POST",
      body: JSON.stringify({
        name: "낙원 합주실",
        mapUrl: "https://map.naver.com/p/entry/place/12345",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("필수 입력값(name 또는 mapUrl)이 없으면 400 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/submit", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        // name 누락
        mapUrl: "https://map.naver.com/p/entry/place/12345",
      }),
    });

    (verifyToken as any).mockReturnValue({ userId: "user-1", username: "testuser", role: "user" });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_INPUT");
  });

  it("네이버 지도 URL 파싱에 실패하면 400 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/submit", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        name: "낙원 합주실",
        mapUrl: "https://invalid-url.com",
      }),
    });

    (verifyToken as any).mockReturnValue({ userId: "user-1", username: "testuser", role: "user" });
    (parseNaverMapUrl as any).mockRejectedValue(new InvalidNaverMapUrlError("유효한 네이버 지도 링크가 아닙니다."));

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_MAP_URL");
  });

  it("정상 정보가 제출되면 위경도를 자동 추출해 pending 상태로 저장하고 201 응답을 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/studios/submit", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({
        name: "낙원 합주실",
        mapUrl: "https://map.naver.com/p/entry/place/11554946",
        description: "최고의 드럼 장비 보유",
      }),
    });

    (verifyToken as any).mockReturnValue({ userId: "user-1", username: "testuser", role: "user" });
    (parseNaverMapUrl as any).mockResolvedValue({
      lat: 37.123456,
      lng: 127.123456,
      placeId: "11554946",
      name: "네이버에등록된낙원합주실",
    });

    // DB insert 모킹
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: "uuid-studio-new", name: "낙원 합주실", status: "pending" }]),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });
});
