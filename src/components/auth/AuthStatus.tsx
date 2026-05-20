"use client";

// 사용자의 인증 상태에 따라 로그인/로그아웃 UI를 렌더링하는 클라이언트 컴포넌트

import { useAuthStore } from "@/stores/authStore";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLogoutMutation } from "@/hooks/queries/useAuthMutations";

export function AuthStatus() {
  const { user, isInitialized } = useAuthStore();
  const logoutMutation = useLogoutMutation();

  const handleLogout = async () => {
    try {
      const result = await logoutMutation.mutateAsync();
      if (result.success) {
        toast.success("로그아웃되었습니다.");
      }
    } catch {
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-zinc-500">인증 상태 확인 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {user ? (
        <>
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-full text-center">
            <p className="text-lg font-medium">반가워요, {user.nickname}님!</p>
            <p className="text-sm text-zinc-500">아이디: {user.username}</p>
            <p className="text-sm text-zinc-500">역할: {user.role}</p>
          </div>
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            로그아웃
          </Button>
        </>
      ) : (
        <>
          <p className="text-zinc-600 dark:text-zinc-400 text-center">
            서비스를 이용하려면 로그인이 필요합니다.
          </p>
          <AuthModal />
        </>
      )}
    </div>
  );
}
