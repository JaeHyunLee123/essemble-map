"use client";

import { useAuthStore } from "@/stores/authStore";
import { AuthModal } from "@/components/auth/auth-modal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Home() {
  const { user, clearAuth, isInitialized } = useAuthStore();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const result = await response.json();
      if (result.success) {
        clearAuth();
        toast.success("로그아웃되었습니다.");
      }
    } catch (error) {
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="flex flex-col items-center gap-8 text-center bg-white dark:bg-zinc-900 p-12 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          합주실 지도 Phase 2
        </h1>
        
        <div className="flex flex-col items-center gap-4 w-full">
          {user ? (
            <>
              <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-full">
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
              <p className="text-zinc-600 dark:text-zinc-400">
                서비스를 이용하려면 로그인이 필요합니다.
              </p>
              <AuthModal />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
