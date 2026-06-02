// 합주실 마커 클릭 시 나타나는 상세 정보 및 북마크 토글 모달 컴포넌트
"use client";

import { useAuthStore } from "@/stores/authStore";
import { useToggleBookmark } from "@/hooks/queries/useBookmarks";
import { useStudioDetail } from "@/hooks/queries/useStudios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookmarkIcon, ExternalLinkIcon, StarIcon } from "lucide-react";
import { useState } from "react";
import StudioUpdateRequestModal from "./StudioUpdateRequestModal";


interface StudioDetailModalProps {
  studioId: string | null;
  onClose: () => void;
}

export default function StudioDetailModal({
  studioId,
  onClose,
}: StudioDetailModalProps) {
  const { user } = useAuthStore();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // 1. 합주실 상세 데이터 쿼리
  const { data: studioResponse, isLoading, isError } = useStudioDetail(studioId);

  const studio = studioResponse?.success ? studioResponse.data : null;

  // 2. 북마크 토글 뮤테이션 훅 사용
  const toggleBookmark = useToggleBookmark();

  const handleBookmarkToggle = () => {
    if (!user) {
      toast.error("로그인이 필요한 서비스입니다.");
      return;
    }
    if (!studioId) return;

    toggleBookmark.mutate(studioId, {
      onSuccess: (data) => {
        if (data?.message) {
          toast.success(data.message);
        }
      },
      onError: (err: any) => {
        toast.error(err.message || "북마크 처리에 실패했습니다.");
      }
    });
  };

  const handleUpdateRequestClick = () => {
    if (!user) {
      toast.error("로그인이 필요한 서비스입니다.");
      return;
    }
    setIsUpdateModalOpen(true);
  };

  return (
    <Dialog open={!!studioId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
        {isLoading ? (
          // 스켈레톤 로딩 UI
          <div className="flex flex-col gap-4 py-6">
            <div className="h-6 w-3/4 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            <div className="h-4 w-full rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            <div className="h-4 w-5/6 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            <div className="flex gap-2 mt-4">
              <div className="h-10 w-24 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              <div className="h-10 w-full rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
          </div>
        ) : isError || !studio ? (
          <div className="py-6 text-center text-zinc-500">
            <p>합주실 상세 정보를 불러오는 중 오류가 발생했습니다.</p>
          </div>
        ) : (
          <>
            <DialogHeader className="gap-1">
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {studio.name}
                </DialogTitle>
                
                {/* 로그인 유저인 경우에만 북마크 버튼 노출 */}
                {user && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleBookmarkToggle}
                    className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all rounded-full"
                  >
                    <StarIcon
                      className={`w-5 h-5 transition-transform duration-200 active:scale-75 ${
                        studio.bookmarked ? "fill-amber-500 text-amber-500" : "text-zinc-400"
                      }`}
                    />
                    <span className="sr-only">북마크 토글</span>
                  </Button>
                )}
              </div>
              <DialogDescription className="text-zinc-400 text-xs">
                합주실의 세부 위치 및 설명 정보를 확인하십시오.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* 설명 영역 */}
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  설명
                </h4>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-100/50 dark:border-zinc-800/50">
                  {studio.description || "등록된 상세 설명이 존재하지 않는 합주실입니다."}
                </p>
              </div>
            </div>

            <DialogFooter className="mt-2 flex sm:flex-row gap-2">
              {studio.mapUrl && (
                <a
                  href={studio.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex-1"
                >
                  <Button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 font-semibold text-sm transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]">
                    <ExternalLinkIcon className="w-4 h-4" />
                    네이버 지도로 이동
                  </Button>
                </a>
              )}
              <Button
                variant="outline"
                onClick={handleUpdateRequestClick}
                className="w-full sm:w-auto border-zinc-200 dark:border-zinc-800 rounded-xl py-5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-semibold"
              >
                정보 수정 제안
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto border-zinc-200 dark:border-zinc-800 rounded-xl py-5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 font-semibold"
              >
                닫기
              </Button>
            </DialogFooter>

            <StudioUpdateRequestModal
              open={isUpdateModalOpen}
              onClose={() => setIsUpdateModalOpen(false)}
              studio={studio}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
