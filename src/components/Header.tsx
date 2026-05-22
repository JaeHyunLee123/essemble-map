// 사용자 로그인 정보 및 글로벌 네비게이션 링크를 렌더링하는 헤더 컴포넌트
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useLogoutMutation } from "@/hooks/queries/useAuthMutations";
import { AuthModal } from "@/components/auth/AuthModal";
import StudioSubmitForm from "@/components/StudioSubmitForm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Map, User, LogOut, PlusCircle, Home as HomeIcon } from "lucide-react";

export default function Header() {
  const { user, isInitialized } = useAuthStore();
  const logoutMutation = useLogoutMutation();
  const pathname = usePathname();
  const router = useRouter();
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const result = await logoutMutation.mutateAsync();
      if (result.success) {
        toast.success("로그아웃되었습니다.");
        router.push("/");
      }
    } catch {
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  };

  const handleMyPageClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      toast.error("로그인이 필요한 서비스입니다.");
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* 좌측 로고 영역 */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 group outline-none select-none"
            >
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
                <Map className="w-5 h-5 transition-transform duration-500 group-hover:rotate-12" />
              </div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-zinc-800 via-zinc-900 to-black dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
                합주실 지도
              </span>
            </Link>

            {/* 네비게이션 링크 */}
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/"
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                }`}
              >
                <HomeIcon className="w-3.5 h-3.5" />
                지도 홈
              </Link>
              <Link
                href="/mypage"
                onClick={handleMyPageClick}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/mypage"
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                마이페이지
              </Link>
            </nav>
          </div>

          {/* 우측 인증 및 제보 영역 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isInitialized ? (
              user ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* 모바일용 링크 (네비게이션 숨김 대비) */}
                  <Link
                    href="/mypage"
                    className="sm:hidden p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all"
                  >
                    <User className="w-4 h-4" />
                  </Link>

                  {/* 제보하기 버튼 */}
                  <Button
                    onClick={() => setIsSubmitOpen(true)}
                    className="h-9 px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-all active:scale-[0.98] border-none shadow-sm flex items-center gap-1.5"
                  >
                    <span className="xs:inline">합주실 제보</span>
                  </Button>

                  {/* 유저 정보 칩 */}
                  <div className="hidden md:flex flex-col items-end text-right">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {user.nickname}님
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {user.role === "admin" ? "관리자" : "일반 회원"}
                    </span>
                  </div>

                  {/* 로그아웃 버튼 */}
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="h-9 px-3 rounded-lg border-zinc-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-800 dark:hover:border-rose-950 dark:hover:bg-rose-950/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">로그아웃</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/mypage"
                    onClick={handleMyPageClick}
                    className="sm:hidden p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all"
                  >
                    <User className="w-4 h-4" />
                  </Link>
                  <AuthModal />
                </div>
              )
            ) : (
              <span className="text-xs text-zinc-400">불러오는 중...</span>
            )}
          </div>
        </div>
      </header>

      {/* 합주실 제보 모달 */}
      <StudioSubmitForm
        open={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
      />
    </>
  );
}
