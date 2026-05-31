/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

// axios mock
vi.mock('axios');

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
    useAuthStore.setState({ isInitialized: false });
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
    (axios.post as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          user: { id: 'uuid-1', username: 'testuser', nickname: '테스트', role: 'user' },
          accessToken: 'new_access_token',
        },
      },
    });

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new_access_token');
    expect(state.isInitialized).toBe(true);
    expect(axios.post).toHaveBeenCalledWith('/api/auth/refresh');
  });

  it('initialize 실패 시 기존 로컬 세션을 깨끗이 청소(null)해야 함', async () => {
    // 1. 기존에 남아있던 만료 세션 주입
    useAuthStore.getState().setAuth(
      { id: 'uuid-1', username: 'testuser', nickname: '테스트', role: 'user' },
      'expired_access_token'
    );

    // 2. refresh API가 401 에러로 실패하도록 모킹
    (axios.post as any).mockRejectedValue(new Error('Request failed with status code 401'));

    // 3. initialize 실행
    await useAuthStore.getState().initialize();

    // 4. 세션 청소 및 초기화 여부 검증
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isInitialized).toBe(true);
  });
});

