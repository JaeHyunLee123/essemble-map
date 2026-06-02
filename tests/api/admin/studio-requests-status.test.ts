// 어드민용 수정 요청 상태 변경 API 단위 테스트 파일
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "@/app/api/admin/studio-requests/[id]/status/route";
import { db } from "@/db";
import { verifyToken } from "@/lib/jwt";
import { parseNaverMapUrl, InvalidNaverMapUrlError } from "@/lib/naverMap";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
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

describe("PATCH /api/admin/studio-requests/:id/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default select mock for innerJoin query
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });
  });

  it("인증 헤더가 없으면 401 Unauthorized 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/admin/studio-requests/req-1/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "approved" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "req-1" }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("일반 유저 권한이면 403 Forbidden 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/admin/studio-requests/req-1/status", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer user-token",
      },
      body: JSON.stringify({ status: "approved" }),
    });

    (verifyToken as any).mockReturnValue({
      userId: "user-1",
      username: "normaluser",
      role: "user",
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "req-1" }) });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("필수 입력값 status가 유효하지 않으면 400 Bad Request 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/admin/studio-requests/req-1/status", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer admin-token",
      },
      body: JSON.stringify({ status: "invalid-status" }),
    });

    (verifyToken as any).mockReturnValue({
      userId: "admin-1",
      username: "adminuser",
      role: "admin",
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "req-1" }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_INPUT");
  });

  it("status가 rejected일 때 denyReason이 누락되면 400 Bad Request 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/admin/studio-requests/req-1/status", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer admin-token",
      },
      body: JSON.stringify({ status: "rejected" }), // denyReason 누락
    });

    (verifyToken as any).mockReturnValue({
      userId: "admin-1",
      username: "adminuser",
      role: "admin",
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "req-1" }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_INPUT");
  });

  it("존재하지 않는 수정 요청 ID이면 404 Not Found 에러를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/admin/studio-requests/req-1/status", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer admin-token",
      },
      body: JSON.stringify({ status: "rejected", denyReason: "사유" }),
    });

    (verifyToken as any).mockReturnValue({
      userId: "admin-1",
      username: "adminuser",
      role: "admin",
    });

    // Default mocked select returns empty array (not found)
    // No need to override as default returns []

    const response = await PATCH(request, { params: Promise.resolve({ id: "req-1" }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("status가 rejected이고 denyReason이 있으면 요청을 반려 상태로 업데이트하고 200 OK를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/admin/studio-requests/req-1/status", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer admin-token",
      },
      body: JSON.stringify({ status: "rejected", denyReason: "정보가 잘못되었습니다." }),
    });

    (verifyToken as any).mockReturnValue({
      userId: "admin-1",
      username: "adminuser",
      role: "admin",
    });

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        studio_update_requests: {
          id: "req-1",
          studioId: "studio-1",
          status: "pending",
        },
        studios: {
          id: "studio-1",
          mapUrl: "https://map.naver.com/original",
          lat: 37.5,
          lng: 127.0,
        }
      }]),
    });

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "req-1", status: "rejected" }]),
        }),
      }),
    });
    (db.update as any).mockImplementation(mockUpdate);

    // transaction 모킹
    (db.transaction as any).mockImplementation(async (callback: any) => {
      return callback(db);
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "req-1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("rejected");
    expect(db.update).toHaveBeenCalled();
  });

  it("status가 approved이면 원본 합주실 정보를 업데이트하고 요청 상태를 approved로 설정한 뒤 200 OK를 반환해야 합니다.", async () => {
    const request = new NextRequest("http://localhost/api/admin/studio-requests/req-1/status", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer admin-token",
      },
      body: JSON.stringify({
        status: "approved",
        name: "최종 조율된 이름", // 어드민이 최종 조율한 값
      }),
    });

    (verifyToken as any).mockReturnValue({
      userId: "admin-1",
      username: "adminuser",
      role: "admin",
    });

    // select mock: 수정 요청과 조인된 원본 합주실 데이터
    const mockJoinResult = [{
      studio_update_requests: {
        id: "req-1",
        studioId: "studio-1",
        name: "수정 제안 이름",
        description: "수정 제안 설명",
        mapUrl: "https://map.naver.com/p/entry/place/changed",
        status: "pending",
      },
      studios: {
        id: "studio-1",
        name: "원래 이름",
        description: "원래 설명",
        mapUrl: "https://map.naver.com/p/entry/place/original",
        lat: 37.5,
        lng: 127.0,
      }
    }];

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockJoinResult),
    });

    // naverMap parsing mock: 네이버 지도 링크 변경에 의한 파싱
    (parseNaverMapUrl as any).mockResolvedValue({ lat: 37.6, lng: 127.1 });

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "req-1", status: "approved" }]),
        }),
      }),
    });
    (db.update as any).mockImplementation(mockUpdate);

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return callback(db);
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "req-1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("approved");
    expect(parseNaverMapUrl).toHaveBeenCalledWith("https://map.naver.com/p/entry/place/changed");
    expect(db.update).toHaveBeenCalledTimes(2); // studios 업데이트 1회, studio_update_requests 업데이트 1회
  });
});
