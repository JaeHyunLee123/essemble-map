// 어드민 대시보드 및 페이지들을 통일된 디자인으로 감싸주는 레이아웃 컴포넌트.
"use client";

import { ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ShieldAlertIcon, LogOutIcon, LayoutDashboardIcon, MapPinIcon } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";


interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout request error:", error);
    }
    clearAuth();
    toast.success("로그아웃되었습니다.");
    router.push("/");
  };


  // 비인가 렌더링 방지 (proxy가 1차 방어하지만 클라이언트 렌더링 2차 안전장치)
  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-xl max-w-md w-full flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldAlertIcon className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            접근 권한이 없습니다.
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            해당 영역은 관리자만 접근할 수 있습니다. 메인 화면으로 돌아가 주십시오.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 font-semibold text-sm cursor-pointer"
          >
            메인 화면으로 이동
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans">
      {/* 어드민 헤더 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <LayoutDashboardIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-zinc-900 dark:text-zinc-50 text-sm flex items-center gap-1.5">
              Assemble Room Map Admin
              <span className="bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                운영 대시보드
              </span>
            </h1>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              합주실 정보 제보 심사 및 활성 매장 비활성화 관리 도구
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 어드민 프로필 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-zinc-200 dark:border-zinc-700">
              {user.nickname.substring(0, 2)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                {user.nickname}
              </p>
              <p className="text-[9px] text-zinc-400 font-semibold uppercase">
                System Admin
              </p>
            </div>
          </div>

          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

          {/* 지도 바로가기 버튼 */}
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="rounded-xl border-zinc-200 dark:border-zinc-800 font-semibold text-xs h-9 flex items-center gap-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850"
          >
            <MapPinIcon className="w-3.5 h-3.5" />
            지도 홈
          </Button>

          {/* 로그아웃 버튼 */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="rounded-xl border-zinc-200 dark:border-zinc-800 font-semibold text-xs h-9 text-rose-600 dark:text-rose-400 flex items-center gap-1.5 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-100"
          >
            <LogOutIcon className="w-3.5 h-3.5" />
            로그아웃
          </Button>
        </div>
      </header>

      {/* 어드민 본문 콘텐츠 */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        {children}
      </main>
    </div>
  );
}
