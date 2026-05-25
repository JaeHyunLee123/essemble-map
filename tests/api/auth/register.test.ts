/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register/route';
import { db } from '@/db';
import bcrypt from 'bcryptjs';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('새로운 유저를 성공적으로 등록해야 함', async () => {
    const mockUser = {
      username: 'testuser',
      password: 'password123!',
      nickname: '테스트유저',
    };

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(mockUser),
    });

    // 중복 검사 통과 (조회 결과 없음)
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });

    // 비밀번호 해싱
    (bcrypt.hash as any).mockResolvedValue('hashed_password');

    // DB 삽입
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'uuid-1', ...mockUser }]),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it('중복된 아이디가 있으면 400 에러를 반환해야 함', async () => {
    const mockUser = {
      username: 'existinguser',
      password: 'password123!',
      nickname: '닉네임',
    };

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(mockUser),
    });

    // 중복된 유저 발견
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 'existing-uuid', username: 'existinguser' }]),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('DUPLICATE_USERNAME');
  });

  it('클라이언트가 role을 admin으로 전달하더라도 무시하고 user로 저장해야 함', async () => {
    const mockUser = {
      username: 'eviladmin',
      password: 'password123!',
      nickname: '해커닉네임',
      role: 'admin',
    };

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(mockUser),
    });

    // 중복 검사 통과 (조회 결과 없음)
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });

    // 비밀번호 해싱
    (bcrypt.hash as any).mockResolvedValue('hashed_password');

    const mockValues = vi.fn().mockReturnThis();

    // DB 삽입 모킹
    (db.insert as any).mockReturnValue({
      values: mockValues,
      returning: vi.fn().mockResolvedValue([{ id: 'uuid-evil', username: 'eviladmin', role: 'user' }]),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);

    // db.insert(users).values({ ... })에서 role이 user로 고정되어 전달되었는지 검증
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'user',
      })
    );
  });
});

