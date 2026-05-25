// 어드민 대시보드 통계 조회 API 통합 테스트 파일.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/stats/route';
import { db } from '@/db';
import { verifyToken } from '@/lib/jwt';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/jwt', () => ({
  verifyToken: vi.fn(),
}));

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증 헤더가 없으면 401 Unauthorized 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/admin/stats', {
      method: 'GET',
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('유저 역할이 admin이 아니면 403 Forbidden 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/admin/stats', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer user-token',
      },
    });

    (verifyToken as any).mockReturnValue({
      userId: 'user-1',
      username: 'normaluser',
      role: 'user',
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('유저 역할이 admin이면 200 OK와 함께 총 유저 수를 성공적으로 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/admin/stats', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer admin-token',
      },
    });

    (verifyToken as any).mockReturnValue({
      userId: 'admin-1',
      username: 'adminuser',
      role: 'admin',
    });

    // Drizzle count() 모킹
    // db.select({ count: sql`count(*)` }).from(users)
    (db.select as any).mockReturnValue({
      from: vi.fn().mockResolvedValue([{ count: 42 }]),
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalUsers).toBe(42);
    expect(db.select).toHaveBeenCalled();
  });
});
