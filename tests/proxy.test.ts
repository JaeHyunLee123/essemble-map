// Next.js 16 통합 인증 프록시 동작을 검증하는 테스트 파일입니다.
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

// Base64 URL 인코딩 헬퍼 함수
function base64UrlEncode(obj: object): string {
  const str = JSON.stringify(obj);
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// 테스트용 가짜 JWT 생성 헬퍼
function createMockJwt(payload: object): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  return `${encodedHeader}.${encodedPayload}.signature`;
}

describe('Next.js 16 Proxy 통합 인증 제어', () => {
  it('refreshToken 쿠키가 없으면 마이페이지 접근 시 메인 화면으로 리다이렉트되어야 합니다.', () => {
    const request = new NextRequest('http://localhost/mypage', {
      method: 'GET',
    });

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/');
  });

  it('refreshToken 쿠키가 만료되었다면 마이페이지 접근 시 메인 화면으로 리다이렉트되어야 합니다.', () => {
    const expiredPayload = {
      userId: 'user-1',
      username: 'testuser',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) - 3600, // 1시간 전 만료
    };
    const token = createMockJwt(expiredPayload);

    const request = new NextRequest('http://localhost/mypage', {
      method: 'GET',
    });
    request.cookies.set('refreshToken', token);

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/');
  });

  it('유효한 토큰을 가진 일반 유저는 마이페이지에 정상 접근 가능해야 합니다.', () => {
    const validPayload = {
      userId: 'user-1',
      username: 'testuser',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1시간 후 만료
    };
    const token = createMockJwt(validPayload);

    const request = new NextRequest('http://localhost/mypage', {
      method: 'GET',
    });
    request.cookies.set('refreshToken', token);

    const response = proxy(request);

    // NextResponse.next()는 응답 상태가 200이거나 리다이렉트 헤더가 없음
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('일반 유저가 어드민 라우트에 접근 시 메인 화면으로 리다이렉트되어야 합니다.', () => {
    const validPayload = {
      userId: 'user-1',
      username: 'testuser',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = createMockJwt(validPayload);

    const request = new NextRequest('http://localhost/admin/stats', {
      method: 'GET',
    });
    request.cookies.set('refreshToken', token);

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/');
  });

  it('어드민 유저가 어드민 라우트에 접근 시 정상적으로 통과되어야 합니다.', () => {
    const adminPayload = {
      userId: 'admin-1',
      username: 'adminuser',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = createMockJwt(adminPayload);

    const request = new NextRequest('http://localhost/admin/stats', {
      method: 'GET',
    });
    request.cookies.set('refreshToken', token);

    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
