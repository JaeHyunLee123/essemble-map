// 사용자가 북마크한 합주실 목록을 화이트모드 라이트 테마 기반 카드 그리드로 렌더링하는 컴포넌트
"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import axios from "axios";
import { MapPin, ExternalLink, BookmarkX, Loader2 } from "lucide-react";

interface Studio {
  id: string;
  name: string;
  mapUrl: string | null;
  description: string | null;
  images: string[];
  lat: number;
  lng: number;
}

export default function BookmarkList() {
  const { accessToken } = useAuthStore();
  const [bookmarks, setBookmarks] = useState<Studio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 북마크 목록 가져오기
  const fetchBookmarks = async () => {
    try {
      const response = await axios.get("/api/user/bookmarks", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const result = response.data;
      if (result.success) {
        setBookmarks(result.data);
      } else {
        toast.error("북마크 목록을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error(error);
      toast.error("북마크 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 북마크 삭제(토글) 처리
  const handleRemoveBookmark = async (studioId: string) => {
    try {
      const response = await axios.post(
        `/api/studios/${studioId}/bookmark`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const result = response.data;
      if (result.success && !result.data.bookmarked) {
        toast.success("북마크가 해제되었습니다.");
        // 로컬 상태에서 제거
        setBookmarks((prev) => prev.filter((item) => item.id !== studioId));
      } else {
        toast.error("북마크 해제에 실패했습니다.");
      }
    } catch (error) {
      console.error(error);
      toast.error("서버 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchBookmarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-550 dark:text-emerald-500" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold">북마크한 합주실을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-white/40 dark:bg-zinc-900/10 backdrop-blur-sm max-w-lg mx-auto shadow-sm">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 mb-4 animate-pulse">
          <MapPin className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200 mb-1">북마크한 합주실이 없습니다</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 px-6 leading-relaxed">
          마음에 드는 합주실을 발견하면 상세 모달에서 북마크 아이콘을 클릭하여 나만의 공간 목록을 만들어 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto p-1">
      {bookmarks.map((studio) => (
        <div
          key={studio.id}
          className="group relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 transition-all duration-300 hover:border-zinc-300/80 dark:hover:border-zinc-700/80 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5"
        >
          {/* 상단 장식 효과 */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-400/30 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="flex flex-col h-full justify-between gap-4">
            <div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 leading-tight">
                  {studio.name}
                </h4>
                <button
                  onClick={() => handleRemoveBookmark(studio.id)}
                  title="북마크 해제"
                  className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all outline-none cursor-pointer"
                >
                  <BookmarkX className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 mb-4 leading-relaxed">
                {studio.description || "설명이 등록되지 않은 합주실입니다."}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60 pt-3.5 mt-auto">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-650" />
                좌표 등록됨
              </span>

              {studio.mapUrl && (
                <a
                  href={studio.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all outline-none"
                >
                  지도 보기
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
