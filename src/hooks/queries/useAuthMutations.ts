// 인증 관련 mutations를 관리하는 커스텀 훅
"use client";

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

interface User {
  id: string;
  username: string;
  nickname: string;
  role: "admin" | "user";
}

interface RegisterRequest {
  username: string;
  nickname: string;
  password?: string;
}

interface LoginRequest {
  username: string;
  password?: string;
}

interface LoginData {
  user: User;
  accessToken: string;
}

interface AuthResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
}

export function useRegisterMutation() {
  return useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: async (data) => {
      const response = await axios.post("/api/auth/register", data);
      return response.data;
    },
  });
}

export function useLoginMutation() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation<AuthResponse<LoginData>, Error, LoginRequest>({
    mutationFn: async (data) => {
      const response = await axios.post("/api/auth/login", data);
      return response.data;
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        setAuth(result.data.user, result.data.accessToken);
      }
    },
  });
}

export function useLogoutMutation() {
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation<AuthResponse, Error, void>({
    mutationFn: async () => {
      const response = await axios.post("/api/auth/logout");
      return response.data;
    },
    onSuccess: (result) => {
      if (result.success) {
        clearAuth();
      }
    },
  });
}
