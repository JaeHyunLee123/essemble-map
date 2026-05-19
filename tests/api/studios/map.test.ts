/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/studios/map/route';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('GET /api/studios/map', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Bounding Box 범위 내의 active 합주실 목록을 반환해야 함', async () => {
    const url = 'http://localhost/api/studios/map?neLat=37.6&neLng=127.1&swLat=37.4&swLng=126.9';
    const request = new NextRequest(url);

    const mockStudios = [
      { id: '1', name: 'Studio A', lat: 37.5, lng: 127.0 },
      { id: '2', name: 'Studio B', lat: 37.55, lng: 126.95 },
    ];

    (db.select as unknown as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockStudios),
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toEqual({
      id: '1',
      name: 'Studio A',
      lat: 37.5,
      lng: 127.0,
    });
  });

  it('쿼리 파라미터가 누락되면 400 에러를 반환해야 함', async () => {
    const url = 'http://localhost/api/studios/map?neLat=37.6'; // 일부 누락
    const request = new NextRequest(url);

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_QUERY_PARAMS');
  });

  it('좌표 형식이 올바르지 않으면 400 에러를 반환해야 함', async () => {
    const url = 'http://localhost/api/studios/map?neLat=abc&neLng=127.1&swLat=37.4&swLng=126.9';
    const request = new NextRequest(url);

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });
});
