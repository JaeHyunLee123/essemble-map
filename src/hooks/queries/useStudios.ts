// 지도 영역(Bounding Box)을 기반으로 합주실 목록을 가져오는 TanStack Query 훅
import { useQuery } from "@tanstack/react-query";
import { ApiResponse } from "@/lib/api-response";

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
