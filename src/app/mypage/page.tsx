// 마이페이지 전체 화면 레이아웃 및 탭 전환 상태를 렌더링하는 페이지 컴포넌트입니다.
"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { User, Bookmark, Send, Sparkles } from "lucide-react";
import ProfileEditForm from "@/components/ProfileEditForm";
import BookmarkList from "@/components/BookmarkList";
import SubmissionList from "@/components/SubmissionList";

type TabType = "profile" | "bookmarks" | "submissions";

export default function MyPage() {
  const { user, isInitialized, initialize } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // 인증 상태 복구 초기화 시도
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 비인가 사용자는 proxy가 가로채지만, 렌더링 측면에서도 2차 안전장치로 리다이렉트 처리
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/");
    }
  }, [isInitialized, user, router]);

  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-t-2 border-emerald-500 border-r-2 border-r-transparent animate-spin" />
          <p className="text-zinc-400 text-sm font-medium">페이지 정보를 준비 중입니다.</p>
        </div>
      </div>
    );
  }

  // 탭 목록 정의
  const tabs = [
    { id: "profile" as const, label: "내 정보 수정", icon: User },
    { id: "bookmarks" as const, label: "북마크 목록", icon: Bookmark },
    { id: "submissions" as const, label: "제보 내역", icon: Send },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* 백그라운드 디자인 그라디언트 오버레이 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[350px] bg-gradient-to-b from-emerald-500/5 via-teal-500/0 to-transparent pointer-events-none blur-3xl" />

      {/* 헤더 섹션 */}
      <div className="relative pt-16 pb-10 border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit mx-auto sm:mx-0">
              <Sparkles className="w-3.5 h-3.5" />
              마이페이지
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-400 bg-clip-text text-transparent">
              안녕하세요, <span className="from-emerald-400 to-teal-400 bg-gradient-to-r bg-clip-text text-transparent">{user.nickname}</span>님
            </h1>
            <p className="text-sm text-zinc-400">
              개인 정보를 안전하게 관리하고 내가 활동한 북마크와 합주실 제보 내역을 확인하세요.
            </p>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="max-w-5xl mx-auto px-6 mt-10 space-y-8">
        {/* 네온 유리 탭 바 */}
        <div className="flex justify-center sm:justify-start">
          <div className="flex gap-1.5 p-1.5 rounded-2xl bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 w-full sm:w-auto shadow-inner shadow-zinc-950/50">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 w-full sm:w-auto cursor-pointer outline-none ${
                    isActive
                      ? "bg-zinc-800 text-emerald-400 shadow-md border border-zinc-700/50"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
                  }`}
                >
                  <TabIcon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 탭 내부 뷰 전환 */}
        <div className="mt-8 transition-opacity duration-300">
          {activeTab === "profile" && <ProfileEditForm />}
          {activeTab === "bookmarks" && <BookmarkList />}
          {activeTab === "submissions" && <SubmissionList />}
        </div>
      </div>
    </div>
  );
}
