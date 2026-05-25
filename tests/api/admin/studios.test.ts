// 어드민 전용 합주실 목록 조회 API 통합 테스트 파일.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getPending } from '@/app/api/admin/studios/pending/route';
import { GET as getActive } from '@/app/api/admin/studios/active/route';
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

describe('Admin Studios List APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/studios/pending', () => {
    it('인증 헤더가 없으면 401 Unauthorized 에러를 반환해야 합니다.', async () => {
      const request = new NextRequest('http://localhost/api/admin/studios/pending', {
        method: 'GET',
      });

      const response = await getPending(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('일반 유저 권한이면 403 Forbidden 에러를 반환해야 합니다.', async () => {
      const request = new NextRequest('http://localhost/api/admin/studios/pending', {
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

      const response = await getPending(request);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('어드민 권한이면 pending 상태인 합주실 목록을 200 OK와 함께 반환해야 합니다.', async () => {
      const request = new NextRequest('http://localhost/api/admin/studios/pending', {
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

      const mockPendingStudios = [
        {
          id: 'studio-pending-1',
          name: '대기중 합주실A',
          description: '대기중 설명',
          mapUrl: 'https://map.naver.com/p/entry/place/1',
          createdAt: new Date('2026-05-20T00:00:00.000Z'),
        },
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockPendingStudios),
      });

      const response = await getPending(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe('studio-pending-1');
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('GET /api/admin/studios/active', () => {
    it('인증 헤더가 없으면 401 Unauthorized 에러를 반환해야 합니다.', async () => {
      const request = new NextRequest('http://localhost/api/admin/studios/active', {
        method: 'GET',
      });

      const response = await getActive(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('일반 유저 권한이면 403 Forbidden 에러를 반환해야 합니다.', async () => {
      const request = new NextRequest('http://localhost/api/admin/studios/active', {
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

      const response = await getActive(request);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('어드민 권한이면 active 상태인 합주실 목록을 200 OK와 함께 반환해야 합니다.', async () => {
      const request = new NextRequest('http://localhost/api/admin/studios/active', {
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

      const mockActiveStudios = [
        {
          id: 'studio-active-1',
          name: '활성 합주실A',
          description: '활성 설명',
          mapUrl: 'https://map.naver.com/p/entry/place/2',
          createdAt: new Date('2026-05-21T00:00:00.000Z'),
        },
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockActiveStudios),
      });

      const response = await getActive(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe('studio-active-1');
      expect(db.select).toHaveBeenCalled();
    });
  });
});
