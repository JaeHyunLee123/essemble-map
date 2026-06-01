// 사용자의 북마크 목록을 조회하고 토글 뮤테이션 및 낙관적 업데이트를 제어하는 쿼리 훅
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";
import { ApiResponse } from "@/lib/api-response";

export interface BookmarkedStudio {
  id: string;
  name: string;
  mapUrl: string | null;
  description: string | null;
  images: string[];
  lat: number;
  lng: number;
}

export interface StudioDetail {
  id: string;
  name: string;
  mapUrl: string | null;
  description: string | null;
  images: string[];
  lat: number;
  lng: number;
  bookmarked: boolean;
}

/**
 * 1. 유저의 북마크 목록 조회 쿼리 훅
 */
export function useUserBookmarks() {
  const { accessToken } = useAuthStore();

  return useQuery<BookmarkedStudio[]>({
    queryKey: ["userBookmarks"],
    queryFn: async () => {
      if (!accessToken) return [];
      const response = await axios.get("/api/user/bookmarks", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const result: ApiResponse<BookmarkedStudio[]> = response.data;
      if (!result.success) {
        throw new Error(result.error?.message || "북마크를 불러오지 못했습니다.");
      }
      return result.data;
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5, // 5분간 fresh 유지
  });
}

/**
 * 2. 특정 합주실 북마크 토글 뮤테이션 훅 (낙관적 업데이트 내장)
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async (studioId: string) => {
      if (!accessToken) throw new Error("인증 정보가 없습니다.");
      const response = await axios.post(
        `/api/studios/${studioId}/bookmark`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const result: ApiResponse<{ bookmarked: boolean; message: string }> = response.data;
      if (!result.success) {
        throw new Error(result.error?.message || "북마크 수정에 실패했습니다.");
      }
      return result.data;
    },

    // 1. 뮤테이션 동작 시 낙관적 업데이트 수행
    onMutate: async (studioId: string) => {
      // 동시성 에러 방지를 위해 관련 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ["studio", studioId] });
      await queryClient.cancelQueries({ queryKey: ["userBookmarks"] });

      // 이전 캐시 상태 스냅샷 저장
      const previousStudioResponse = queryClient.getQueryData<ApiResponse<StudioDetail>>(["studio", studioId]);
      const previousBookmarks = queryClient.getQueryData<BookmarkedStudio[]>(["userBookmarks"]) || [];

      // A. 합주실 상세 캐시 낙관적 업데이트
      if (previousStudioResponse && previousStudioResponse.success && previousStudioResponse.data) {
        const cloned = JSON.parse(JSON.stringify(previousStudioResponse));
        cloned.data.bookmarked = !cloned.data.bookmarked;
        queryClient.setQueryData(["studio", studioId], cloned);
      }

      // B. 유저 북마크 목록 캐시 낙관적 업데이트
      let isCurrentlyBookmarked = previousBookmarks.some((b) => b.id === studioId);
      if (previousStudioResponse && previousStudioResponse.success) {
        isCurrentlyBookmarked = previousStudioResponse.data.bookmarked;
      }

      if (isCurrentlyBookmarked) {
        // 북마크 취소인 경우 -> 목록에서 즉시 필터링하여 제외
        const filtered = previousBookmarks.filter((b) => b.id !== studioId);
        queryClient.setQueryData(["userBookmarks"], filtered);
      } else {
        // 북마크 추가인 경우 -> 기존 상세 정보를 기반으로 목록에 카드 즉각 삽입
        if (previousStudioResponse && previousStudioResponse.success) {
          const studioInfo = previousStudioResponse.data;
          const newBookmark: BookmarkedStudio = {
            id: studioInfo.id,
            name: studioInfo.name,
            mapUrl: studioInfo.mapUrl,
            description: studioInfo.description,
            images: studioInfo.images || [],
            lat: studioInfo.lat,
            lng: studioInfo.lng,
          };
          queryClient.setQueryData(["userBookmarks"], [newBookmark, ...previousBookmarks]);
        }
      }

      // 롤백을 위한 스냅샷 콘텍스트 반환
      return { previousStudioResponse, previousBookmarks };
    },

    // 2. 뮤테이션 에러 발생 시 원래 캐시 상태로 복구(롤백)
    onError: (err, studioId, context) => {
      if (context?.previousStudioResponse) {
        queryClient.setQueryData(["studio", studioId], context.previousStudioResponse);
      }
      if (context?.previousBookmarks) {
        queryClient.setQueryData(["userBookmarks"], context.previousBookmarks);
      }
    },

    // 3. 완료 시 서버 정합성을 보장하기 위해 쿼리 무효화(정적 패치 보증)
    onSettled: (data, error, studioId) => {
      queryClient.invalidateQueries({ queryKey: ["studio", studioId] });
      queryClient.invalidateQueries({ queryKey: ["userBookmarks"] });
      // 지도상에 표시된 북마크 상태 갱신이 필요할 수 있으므로 studios 쿼리도 연동 무효화
      queryClient.invalidateQueries({ queryKey: ["studios"] });
    },
  });
}
