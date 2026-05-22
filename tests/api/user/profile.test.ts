// 마이페이지 유저 프로필(닉네임) 변경 API의 유효성 검사 및 중복 검사를 검증하는 테스트 파일입니다.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/user/profile/route';
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

describe('PATCH /api/user/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증 헤더가 없으면 401 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ nickname: '새닉네임' }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('유효하지 않은 토큰이면 401 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer invalid-token',
      },
      body: JSON.stringify({ nickname: '새닉네임' }),
    });

    (verifyToken as any).mockReturnValue(null);

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('닉네임 입력값이 누락되면 400 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({}),
    });

    (verifyToken as any).mockReturnValue({ userId: 'user-1', username: 'testuser', role: 'user' });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('MISSING_FIELDS');
  });

  it('닉네임이 중복되면 400 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ nickname: '이미존재하는닉네임' }),
    });

    (verifyToken as any).mockReturnValue({ userId: 'user-1', username: 'testuser', role: 'user' });

    // 중복 닉네임 유저 존재 모킹
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 'other-user', nickname: '이미존재하는닉네임' }]),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('DUPLICATE_NICKNAME');
  });

  it('중복이 아니라면 성공적으로 닉네임을 수정하고 200 OK를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ nickname: '새로운닉네임' }),
    });

    (verifyToken as any).mockReturnValue({ userId: 'user-1', username: 'testuser', role: 'user' });

    // 닉네임 조회 시 미존재 (중복 없음)
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });

    // DB 업데이트 모킹
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{
        id: 'user-1',
        username: 'testuser',
        nickname: '새로운닉네임',
        role: 'user',
      }]),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.nickname).toBe('새로운닉네임');
    expect(db.update).toHaveBeenCalled();
  });
});
