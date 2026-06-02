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
import { Map, User, LogOut, PlusCircle, Home as HomeIcon, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const { user, isInitialized } = useAuthStore();
  const logoutMutation = useLogoutMutation();
  const pathname = usePathname();
  const router = useRouter();
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authCallback, setAuthCallback] = useState<"submit" | "mypage" | null>(null);

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

  const handleSubmitting = () => {
    if (user) {
      setIsSubmitOpen(true);
    } else {
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
      toast.error("로그인이 필요한 서비스입니다.");
      setAuthCallback("submit");
      setIsAuthOpen(true);
    }
  };

  const handleMyPageClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
      toast.error("로그인이 필요한 서비스입니다.");
      setAuthCallback("mypage");
      setIsAuthOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    if (authCallback === "submit") {
      setIsSubmitOpen(true);
    } else if (authCallback === "mypage") {
      router.push("/mypage");
    }
    setAuthCallback(null);
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

            {/* 네비게이션 링크 (데스크톱) */}
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

          {/* 우측 영역 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 데스크톱 인증 및 제보 영역 */}
            <div className="hidden sm:flex items-center gap-3">
              {isInitialized ? (
                <>
                  <Button
                    onClick={handleSubmitting}
                    className="h-9 px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-all active:scale-[0.98] border-none shadow-sm flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>합주실 제보</span>
                  </Button>

                  {user ? (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end text-right">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          {user.nickname}님
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {user.role === "admin" ? "관리자" : "일반 회원"}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="h-9 px-3 rounded-lg border-zinc-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-800 dark:hover:border-rose-950 dark:hover:bg-rose-950/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>로그아웃</span>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAuthCallback(null);
                        setIsAuthOpen(true);
                      }}
                      className="h-9 px-4 rounded-lg text-xs font-semibold"
                    >
                      로그인 / 회원가입
                    </Button>
                  )}
                </>
              ) : (
                <span className="text-xs text-zinc-400">불러오는 중...</span>
              )}
            </div>

            {/* 모바일 햄버거 메뉴 및 사이드바 */}
            <div className="sm:hidden flex items-center">
              {isInitialized ? (
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 p-0 text-zinc-600 dark:text-zinc-400">
                      <Menu className="w-5 h-5" />
                      <span className="sr-only">메뉴 열기</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[280px] sm:w-[320px] p-6 flex flex-col justify-between">
                    <div className="flex flex-col gap-6">
                      <SheetHeader className="p-0 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                        <SheetTitle className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <Map className="w-4 h-4" />
                          </div>
                          <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-zinc-800 via-zinc-900 to-black dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
                            합주실 지도
                          </span>
                        </SheetTitle>
                      </SheetHeader>

                      {/* 로그인 정보/유도 영역 */}
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80">
                        {user ? (
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <User className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                {user.nickname}님
                              </span>
                              <span className="text-[10px] text-emerald-500 font-semibold mt-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded-md w-max">
                                {user.role === "admin" ? "관리자" : "일반 회원"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                              로그인 후 더 많은 서비스를 이용해 보세요.
                            </p>
                            <Button
                              size="sm"
                              onClick={() => {
                                setIsMenuOpen(false);
                                setAuthCallback(null);
                                setIsAuthOpen(true);
                              }}
                              className="w-full h-8 text-xs font-semibold"
                            >
                              로그인 / 회원가입
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* 메뉴 링크 리스트 */}
                      <nav className="flex flex-col gap-2">
                        <Link
                          href="/"
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            pathname === "/"
                              ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white"
                              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                          }`}
                        >
                          <HomeIcon className="w-4 h-4" />
                          지도 홈
                        </Link>
                        <Link
                          href="/mypage"
                          onClick={(e) => {
                            handleMyPageClick(e);
                            if (user) {
                              setIsMenuOpen(false);
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            pathname === "/mypage"
                              ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white"
                              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                          }`}
                        >
                          <User className="w-4 h-4" />
                          마이페이지
                        </Link>
                      </nav>
                    </div>

                    {/* 하단 액션 버튼 */}
                    <div className="flex flex-col gap-2 mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800">
                      <Button
                        onClick={handleSubmitting}
                        className="w-full h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-all active:scale-[0.98] border-none shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>합주실 제보하기</span>
                      </Button>

                      {user && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full h-10 rounded-lg border-zinc-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-800 dark:hover:border-rose-950 dark:hover:bg-rose-950/20 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>로그아웃</span>
                        </Button>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <span className="text-xs text-zinc-400">불러오는 중...</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 합주실 제보 모달 */}
      <StudioSubmitForm
        open={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
      />

      {/* 글로벌 로그인 모달 */}
      <AuthModal
        open={isAuthOpen}
        onOpenChange={setIsAuthOpen}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}

