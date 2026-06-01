// 사용자의 합주실 제보 내역 목록을 조회하고 캐싱하는 쿼리 훅
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";
import { ApiResponse } from "@/lib/api-response";

export interface Submission {
  id: string;
  type: string;
  name: string;
  status: "pending" | "active" | "deny";
  denyReason: string | null;
  createdAt: string;
}

/**
 * 유저의 제보 내역 목록 조회 쿼리 훅
 */
export function useUserSubmissions() {
  const { accessToken } = useAuthStore();

  return useQuery<Submission[]>({
    queryKey: ["userSubmissions"],
    queryFn: async () => {
      if (!accessToken) return [];
      const response = await axios.get("/api/user/submissions", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const result: ApiResponse<Submission[]> = response.data;
      if (!result.success) {
        throw new Error(result.error?.message || "제보 내역을 불러오지 못했습니다.");
      }
      return result.data;
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5, // 5분간 fresh 유지
  });
}
