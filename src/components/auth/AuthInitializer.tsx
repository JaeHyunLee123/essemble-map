"use client";

// 앱 로드 시 인증 상태를 초기화(Silent Refresh)하는 컴포넌트

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export function AuthInitializer() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return null;
}
