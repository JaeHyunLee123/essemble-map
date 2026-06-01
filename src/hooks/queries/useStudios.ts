// Bounding Box 및 단일 상세 정보를 가져오는 TanStack Query 훅
import { useQuery } from "@tanstack/react-query";
import { ApiResponse } from "@/lib/api-response";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";

export interface MapStudio {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface FetchStudiosParams {
  neLat: number;
  neLng: number;
  swLat: number;
  swLng: number;
}

async function fetchStudios(params: FetchStudiosParams): Promise<MapStudio[]> {
  const queryParams = new URLSearchParams({
    neLat: params.neLat.toString(),
    neLng: params.neLng.toString(),
    swLat: params.swLat.toString(),
    swLng: params.swLng.toString(),
  });

  const response = await fetch(`/api/studios/map?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch studios");
  }

  const result: ApiResponse<MapStudio[]> = await response.json();
  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export function useStudios(params: FetchStudiosParams | null) {
  return useQuery({
    queryKey: ["studios", "map", params],
    queryFn: () => fetchStudios(params!),
    enabled: !!params,
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
  });
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
 * 단일 합주실 상세 정보 조회 쿼리 훅
 */
export function useStudioDetail(studioId: string | null) {
  const { accessToken } = useAuthStore();

  return useQuery<ApiResponse<StudioDetail>>({
    queryKey: ["studio", studioId],
    queryFn: async () => {
      if (!studioId) throw new Error("합주실 ID가 누락되었습니다.");
      
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await axios.get(`/api/studios/${studioId}`, { headers });
      return response.data;
    },
    enabled: !!studioId,
  });
}
