// 마이페이지 유저 북마크 목록 조회 API를 테스트하는 유닛 테스트 파일입니다.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/user/bookmarks/route';
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

describe('GET /api/user/bookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증 헤더가 없으면 401 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/user/bookmarks', {
      method: 'GET',
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('성공적으로 북마크 목록을 가져오고 active 상태 합주실만 이너조인 필터링하여 200 OK를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/user/bookmarks', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    (verifyToken as any).mockReturnValue({ userId: 'user-1', username: 'testuser', role: 'user' });

    // Drizzle 체이닝 모킹
    // db.select().from(bookmarks).innerJoin(studios, ...).where(...)
    const mockJoinResult = [
      {
        id: 'studio-1',
        name: '합주실A',
        mapUrl: 'https://map.naver.com/A',
        description: '설명',
        lat: 37.5,
        lng: 127.0,
        status: 'active',
      },
    ];

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockJoinResult),
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('studio-1');
    expect(body.data[0].name).toBe('합주실A');
    expect(db.select).toHaveBeenCalled();
  });
});
