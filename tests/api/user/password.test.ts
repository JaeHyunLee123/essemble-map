// 마이페이지 유저 비밀번호 변경 API의 기존 비밀번호 검증 및 변경 로직을 검증하는 테스트 파일입니다.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/user/password/route';
import { db } from '@/db';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/jwt', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

describe('PATCH /api/user/password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증 헤더가 없으면 401 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/user/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword: 'old', newPassword: 'new' }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('입력 필드(currentPassword, newPassword)가 누락되면 400 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/user/password', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ currentPassword: 'old' }),
    });

    (verifyToken as any).mockReturnValue({ userId: 'user-1', username: 'testuser', role: 'user' });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('MISSING_FIELDS');
  });

  it('기존 비밀번호가 일치하지 않으면 401 에러를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/user/password', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ currentPassword: 'wrong-password', newPassword: 'new-password123!' }),
    });

    (verifyToken as any).mockReturnValue({ userId: 'user-1', username: 'testuser', role: 'user' });

    // 유저 DB 조회
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 'user-1', passwordHashed: 'correct-hash' }]),
    });

    // bcrypt.compare 실패
    (bcrypt.compare as any).mockResolvedValue(false);

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_PASSWORD');
  });

  it('비밀번호 검증에 성공하면 새 비밀번호를 해싱하여 저장하고 200 OK를 반환해야 합니다.', async () => {
    const request = new NextRequest('http://localhost/api/user/password', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ currentPassword: 'correct-password', newPassword: 'new-password123!' }),
    });

    (verifyToken as any).mockReturnValue({ userId: 'user-1', username: 'testuser', role: 'user' });

    // 유저 DB 조회
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 'user-1', passwordHashed: 'correct-hash' }]),
    });

    // bcrypt.compare 성공 및 해싱 모킹
    (bcrypt.compare as any).mockResolvedValue(true);
    (bcrypt.hash as any).mockResolvedValue('new-hashed-password');

    // DB 업데이트 모킹
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 'user-1' }]),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('new-password123!', 10);
  });
});
