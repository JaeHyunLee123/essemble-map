// 사용자 닉네임 및 비밀번호 변경을 관리하는 개인정보 수정 폼 컴포넌트입니다.
"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, KeyRound, UserRound, Check } from "lucide-react";

export default function ProfileEditForm() {
  const { user, accessToken, setAuth } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 1. 프로필(닉네임) 변경 요청
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      toast.error("닉네임을 입력해 주세요.");
      return;
    }
    if (nickname === user?.nickname) {
      toast.error("현재 닉네임과 동일합니다.");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const response = await axios.patch(
        "/api/user/profile",
        { nickname },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = response.data;
      if (result.success) {
        // Zustand 스토어 유저 정보 갱신
        if (accessToken) {
          setAuth(result.data.user, accessToken);
        }
        toast.success("닉네임이 성공적으로 변경되었습니다.");
      } else {
        toast.error(result.error.message || "닉네임 변경에 실패했습니다.");
      }
    } catch (error: any) {
      console.error(error);
      const errMsg =
        error.response?.data?.error?.message || "서버 오류가 발생했습니다.";
      toast.error(errMsg);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // 2. 비밀번호 변경 요청
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("모든 비밀번호 필드를 입력해 주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("새 비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await axios.patch(
        "/api/user/password",
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = response.data;
      if (result.success) {
        toast.success("비밀번호가 성공적으로 변경되었습니다.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error.message || "비밀번호 변경에 실패했습니다.");
      }
    } catch (error: any) {
      console.error(error);
      const errMsg =
        error.response?.data?.error?.message || "비밀번호 변경에 실패했습니다.";
      toast.error(errMsg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto p-1">
      {/* 닉네임 변경 카드 */}
      <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 transition-all duration-300 hover:border-zinc-300/80 dark:hover:border-zinc-700/80 hover:shadow-xl hover:shadow-emerald-500/5">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <UserRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">닉네임 변경</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">커뮤니티 및 제보 시 노출될 별명입니다.</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">현재 아이디</label>
            <input
              type="text"
              disabled
              value={user?.username || ""}
              className="w-full px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-400 dark:text-zinc-500 text-sm cursor-not-allowed select-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">새로운 닉네임</label>
            <input
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="변경할 닉네임을 입력해 주세요."
              className="w-full px-4 py-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/10 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-sm outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdatingProfile}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            {isUpdatingProfile ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                닉네임 저장
              </>
            )}
          </button>
        </form>
      </div>

      {/* 비밀번호 변경 카드 */}
      <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 transition-all duration-300 hover:border-zinc-300/80 dark:hover:border-zinc-700/80 hover:shadow-xl hover:shadow-sky-500/5">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-sky-500/0 via-sky-500/40 to-sky-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">비밀번호 변경</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">안전한 계정 관리를 위해 주기적으로 변경하세요.</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">기존 비밀번호</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="현재 비밀번호를 입력하세요."
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 focus:border-sky-500/80 focus:ring-2 focus:ring-sky-500/10 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-sm outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">새 비밀번호</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="최소 6자 이상의 새 비밀번호."
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 focus:border-sky-500/80 focus:ring-2 focus:ring-sky-500/10 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-sm outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">새 비밀번호 확인</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호를 한번 더 입력하세요."
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 focus:border-sky-500/80 focus:ring-2 focus:ring-sky-500/10 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-sm outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-sky-500/10 cursor-pointer"
          >
            {isUpdatingPassword ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                비밀번호 저장
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
