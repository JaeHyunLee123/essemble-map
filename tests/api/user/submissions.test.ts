// 마이페이지 유저 제보 내역 조회 API를 테스트하는 유닛 테스트 파일입니다.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/user/submissions/route';
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

describe('GET /api/user/submissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증 헤더가 없으면 401 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/user/submissions', {
      method: 'GET',
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('성공적으로 유저의 제보 내역을 모두 가져오고, deny 상태의 반려 사유 및 type: studio 속성을 포함해 200 OK를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/user/submissions', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    (verifyToken as any).mockReturnValue({ userId: 'user-1', username: 'testuser', role: 'user' });

    // Drizzle 체이닝 모킹
    // db.select().from(studios).where(...)
    const mockSubmissionsResult = [
      {
        id: 'studio-1',
        name: '제보합주실A',
        status: 'active',
        denyReason: null,
        createdAt: new Date('2026-05-10T00:00:00.000Z'),
      },
      {
        id: 'studio-2',
        name: '제보합주실B',
        status: 'deny',
        denyReason: '잘못된 위치 정보입니다.',
        createdAt: new Date('2026-05-11T00:00:00.000Z'),
      },
      {
        id: 'studio-3',
        name: '제보합주실C',
        status: 'pending',
        denyReason: null,
        createdAt: new Date('2026-05-12T00:00:00.000Z'),
      },
    ];

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockSubmissionsResult),
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(3);
    
    // type: 'studio' 검증
    expect(body.data[0].type).toBe('studio');
    expect(body.data[1].type).toBe('studio');
    expect(body.data[2].type).toBe('studio');

    // deny 상태 및 반려사유 검증
    const denyItem = body.data.find((item: any) => item.id === 'studio-2');
    expect(denyItem.status).toBe('deny');
    expect(denyItem.denyReason).toBe('잘못된 위치 정보입니다.');

    expect(db.select).toHaveBeenCalled();
  });
});
