import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { db } from '@/db';
import bcrypt from 'bcryptjs';
import * as jwtUtils from '@/lib/jwt';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock('@/lib/jwt', () => ({
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
}));

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('성공적으로 로그인하고 토큰을 반환해야 함', async () => {
    const mockCredentials = {
      username: 'testuser',
      password: 'password123!',
    };

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(mockCredentials),
    });

    // 유저 조회 성공
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        id: 'uuid-1',
        username: 'testuser',
        passwordHashed: 'hashed_password',
        role: 'user',
        nickname: '테스트유저'
      }]),
    });

    // 비밀번호 일치
    (bcrypt.compare as any).mockResolvedValue(true);

    // 토큰 생성
    (jwtUtils.generateAccessToken as any).mockReturnValue('access_token');
    (jwtUtils.generateRefreshToken as any).mockReturnValue('refresh_token');

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBe('access_token');
    expect(response.headers.get('set-cookie')).toContain('refreshToken=refresh_token');
  });

  it('비밀번호가 틀리면 401 에러를 반환해야 함', async () => {
    const mockCredentials = {
      username: 'testuser',
      password: 'wrong_password',
    };

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(mockCredentials),
    });

    // 유저 조회 성공
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        id: 'uuid-1',
        username: 'testuser',
        passwordHashed: 'hashed_password',
      }]),
    });

    // 비밀번호 불일치
    (bcrypt.compare as any).mockResolvedValue(false);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
