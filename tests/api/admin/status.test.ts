// 어드민 합주실 제보 승인/반려/삭제 처리 API 통합 테스트 파일.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/admin/studios/[id]/status/route';
import { db } from '@/db';
import { verifyToken } from '@/lib/jwt';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/jwt', () => ({
  verifyToken: vi.fn(),
}));

describe('PATCH /api/admin/studios/[id]/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증 헤더가 없으면 401 Unauthorized 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/admin/studios/studio-1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'studio-1' }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('일반 유저 권한이면 403 Forbidden 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/admin/studios/studio-1/status', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer user-token',
      },
      body: JSON.stringify({ status: 'active' }),
    });

    (verifyToken as any).mockReturnValue({
      userId: 'user-1',
      username: 'normaluser',
      role: 'user',
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'studio-1' }) });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('필수 입력값 status가 유효하지 않으면 400 Bad Request 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/admin/studios/studio-1/status', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer admin-token',
      },
      body: JSON.stringify({ status: 'invalid-status' }),
    });

    (verifyToken as any).mockReturnValue({
      userId: 'admin-1',
      username: 'adminuser',
      role: 'admin',
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'studio-1' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  it('status가 deny일 때 denyReason이 누락되면 400 Bad Request 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/admin/studios/studio-1/status', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer admin-token',
      },
      body: JSON.stringify({ status: 'deny' }), // denyReason 누락
    });

    (verifyToken as any).mockReturnValue({
      userId: 'admin-1',
      username: 'adminuser',
      role: 'admin',
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'studio-1' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('MISSING_DENY_REASON');
  });

  it('어드민 권한이고 status가 active이면 제보를 성공적으로 승인해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/admin/studios/studio-1/status', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer admin-token',
      },
      body: JSON.stringify({ status: 'active' }),
    });

    (verifyToken as any).mockReturnValue({
      userId: 'admin-1',
      username: 'adminuser',
      role: 'admin',
    });

    // DB select 및 update 모킹
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 'studio-1', status: 'pending' }]),
    });

    const mockUpdateSet = vi.fn().mockReturnThis();
    (db.update as any).mockReturnValue({
      set: mockUpdateSet,
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'studio-1', status: 'active' }]),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'studio-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('active');
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
      })
    );
  });

  it('어드민 권한이고 status가 deny이고 denyReason이 있으면 제보를 성공적으로 반려해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/admin/studios/studio-1/status', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer admin-token',
      },
      body: JSON.stringify({ status: 'deny', denyReason: '올바르지 않은 정보입니다.' }),
    });

    (verifyToken as any).mockReturnValue({
      userId: 'admin-1',
      username: 'adminuser',
      role: 'admin',
    });

    // DB select 및 update 모킹
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 'studio-1', status: 'pending' }]),
    });

    const mockUpdateSet = vi.fn().mockReturnThis();
    (db.update as any).mockReturnValue({
      set: mockUpdateSet,
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'studio-1', status: 'deny', denyReason: '올바르지 않은 정보입니다.' }]),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'studio-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('deny');
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'deny',
        denyReason: '올바르지 않은 정보입니다.',
      })
    );
  });

  it('이미 active 상태인 합주실에 대해 status=deny 요청 시 비활성화(삭제) 처리를 수행해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/admin/studios/studio-active/status', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer admin-token',
      },
      body: JSON.stringify({ status: 'deny', denyReason: '서비스에서 내림' }),
    });

    (verifyToken as any).mockReturnValue({
      userId: 'admin-1',
      username: 'adminuser',
      role: 'admin',
    });

    // 이미 active 상태인 합주실 조회 모킹
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 'studio-active', status: 'active' }]),
    });

    const mockUpdateSet = vi.fn().mockReturnThis();
    (db.update as any).mockReturnValue({
      set: mockUpdateSet,
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'studio-active', status: 'deny', denyReason: '서비스에서 내림' }]),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'studio-active' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('deny');
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'deny',
        denyReason: '서비스에서 내림',
      })
    );
  });
});
