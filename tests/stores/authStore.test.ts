/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

// fetch mock
global.fetch = vi.fn();

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
  });

  it('setAuth가 정상적으로 동작해야 함', () => {
    const mockUser = {
      id: 'uuid-1',
      username: 'testuser',
      nickname: '테스트유저',
      role: 'user' as const,
    };
    const mockAccessToken = 'access_token';

    useAuthStore.getState().setAuth(mockUser, mockAccessToken);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe(mockAccessToken);
  });

  it('clearAuth가 정상적으로 동작해야 함', () => {
    useAuthStore.getState().setAuth({ id: '1', username: 'u', nickname: 'n', role: 'user' }, 'token');
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('initialize 시 refresh API를 호출해야 함', async () => {
    (global.fetch as any).mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          user: { id: 'uuid-1', username: 'testuser', nickname: '테스트', role: 'user' },
          accessToken: 'new_access_token',
        },
      }),
    });

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new_access_token');
    expect(state.isInitialized).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/refresh', expect.anything());
  });
});
