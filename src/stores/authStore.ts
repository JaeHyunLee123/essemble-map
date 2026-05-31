// 사용자 인증 상태를 관리하는 Zustand 스토어
// 로컬스토리지에 Access Token을 유지하며, Silent Refresh 로직을 포함함

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

interface User {
  id: string;
  username: string;
  nickname: string;
  role: "admin" | "user";
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitialized: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isInitialized: false,

      setAuth: (user, accessToken) => {
        set({ user, accessToken });
      },

      clearAuth: () => {
        set({ user: null, accessToken: null });
      },

      initialize: async () => {
        if (get().isInitialized) return;

        try {
          // 앱 초기화 시 /api/auth/refresh 호출하여 토큰 복구 시도
          const response = await axios.post("/api/auth/refresh");
          const result = response.data;

          if (result.success) {
            set({
              user: result.data.user,
              accessToken: result.data.accessToken,
              isInitialized: true,
            });
          } else {
            set({ user: null, accessToken: null, isInitialized: true });
          }
        } catch (error) {
          console.error("Auth initialization failed:", error);
          set({ user: null, accessToken: null, isInitialized: true });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        // accessToken만 로컬스토리지에 저장 (보안상 주의가 필요하지만 명세에 따라 구현)
        accessToken: state.accessToken,
        user: state.user,
      }),
    }
  )
);
