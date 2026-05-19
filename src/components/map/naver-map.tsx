// 네이버 지도 SDK를 로드하고 useRef를 통해 직접 제어하는 지도 컴포넌트
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { debounce } from "@/lib/utils";
import Supercluster from "supercluster";

interface MapStudio {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface NaverMapProps {
  onBoundsChange?: (bounds: naver.maps.LatLngBounds) => void;
  studios?: MapStudio[];
}

export default function NaverMap({ onBoundsChange, studios = [] }: NaverMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);
  const clusterRef = useRef<Supercluster | null>(null);
  const markersRef = useRef<Map<string | number, naver.maps.Marker>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const [zoom, setZoom] = useState(14);
  const [selectedClusterStudios, setSelectedClusterStudios] = useState<MapStudio[] | null>(null);

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  // 지도의 현재 영역을 부모 컴포넌트에 알리는 함수
  const updateBounds = useCallback(() => {
    if (!mapRef.current || !onBoundsChange) return;
    const currentZoom = mapRef.current.getZoom();
    setZoom(currentZoom);
    onBoundsChange(mapRef.current.getBounds() as naver.maps.LatLngBounds);
  }, [onBoundsChange]);

  // 디바운스된 업데이트 함수를 Ref에 저장 (렌더링 사이클에서 안정성 유지 및 린트 에러 방지)
  const debouncedUpdateBoundsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    debouncedUpdateBoundsRef.current = debounce(updateBounds, 300);
  }, [updateBounds]);

  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapRef.current) return;

    // 지도 초기화
    const mapOptions: naver.maps.MapOptions = {
      center: new naver.maps.LatLng(37.5665, 126.978), // 서울 시청 기준
      zoom: 14,
      minZoom: 6,
      maxZoom: 21,
    };

    const map = new naver.maps.Map(mapContainerRef.current, mapOptions);
    mapRef.current = map;

    // 이벤트 리스너에서 호출할 래퍼 함수
    const handleEvent = () => {
      debouncedUpdateBoundsRef.current?.();
    };

    // 이벤트 리스너 등록
    const dragEndListener = naver.maps.Event.addListener(map, "dragend", handleEvent);
    const zoomChangedListener = naver.maps.Event.addListener(map, "zoom_changed", handleEvent);

    // 초기 바운드 전달 (디바운스 없이 즉시)
    updateBounds();

    return () => {
      naver.maps.Event.removeListener(dragEndListener);
      naver.maps.Event.removeListener(zoomChangedListener);
    };
  }, [isLoaded, updateBounds]);

  // 현재 줌과 바운드에 따라 클러스터 렌더링
  const renderClusters = useCallback(() => {
    if (!mapRef.current || !clusterRef.current) return;

    const bounds = mapRef.current.getBounds() as naver.maps.LatLngBounds;
    const sw = bounds.getSW();
    const ne = bounds.getNE();
    
    // [westLng, southLat, eastLng, northLat]
    const bbox: [number, number, number, number] = [sw.lng(), sw.lat(), ne.lng(), ne.lat()];
    const clusters = clusterRef.current.getClusters(bbox, zoom);

    const currentMap = mapRef.current;
    const newMarkersMap = new Map();

    clusters.forEach((cluster) => {
      const [longitude, latitude] = cluster.geometry.coordinates;
      const { cluster: isCluster, point_count: pointCount, studioId } = cluster.properties;
      const id = isCluster ? `cluster-${cluster.id}` : studioId;

      if (markersRef.current.has(id)) {
        newMarkersMap.set(id, markersRef.current.get(id));
        markersRef.current.delete(id);
      } else {
        let marker: naver.maps.Marker;

        if (isCluster) {
          // 클러스터 마커
          marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(latitude, longitude),
            map: currentMap,
            icon: {
              content: `
                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 border-2 border-white text-white text-xs font-bold shadow-lg cursor-pointer transform hover:scale-110 transition-transform">
                  ${pointCount}
                </div>
              `,
              anchor: new naver.maps.Point(16, 16),
            },
          });

          naver.maps.Event.addListener(marker, "click", () => {
            const expansionZoom = clusterRef.current?.getClusterExpansionZoom(cluster.id as number) || 21;
            
            if (expansionZoom > 21) {
              // 최대 줌을 넘어가는 경우 (동일 좌표)
              const leaves = clusterRef.current?.getLeaves(cluster.id as number, Infinity) || [];
              const clusterStudios = leaves.map(leaf => {
                const s = studios.find(st => st.id === leaf.properties.studioId);
                return s!;
              }).filter(Boolean);
              setSelectedClusterStudios(clusterStudios);
            } else {
              currentMap.morph(new naver.maps.LatLng(latitude, longitude), expansionZoom);
            }
          });
        } else {
          // 개별 합주실 마커
          const studio = studios.find(s => s.id === studioId);
          marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(latitude, longitude),
            map: currentMap,
            title: studio?.name,
            icon: {
              content: `
                <div class="group relative flex items-center justify-center">
                  <div class="bg-indigo-600 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-md transform group-hover:scale-110 transition-transform whitespace-nowrap">
                    ${studio?.name}
                  </div>
                </div>
              `,
              anchor: new naver.maps.Point(12, 12),
            },
          });
        }
        newMarkersMap.set(id, marker);
      }
    });

    // 제거된 마커들 정리
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = newMarkersMap;
  }, [zoom, studios]);

  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // supercluster 인스턴스 초기화 및 데이터 로드
    const cluster = new Supercluster({
      radius: 60,
      maxZoom: 20, // 21까지 가능하지만 클러스터링은 20까지
    });

    const points = studios.map((studio) => ({
      type: "Feature" as const,
      properties: {
        cluster: false,
        studioId: studio.id,
        name: studio.name,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [studio.lng, studio.lat],
      },
    }));

    cluster.load(points);
    clusterRef.current = cluster;

    renderClusters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studios, isLoaded]);

  // 줌 또는 바운드 변경 시 다시 렌더링
  useEffect(() => {
    renderClusters();
  }, [renderClusters]);

  if (!clientId) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-zinc-100 text-zinc-500">
        Naver Map Client ID is missing.
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`}
        onLoad={() => setIsLoaded(true)}
      />
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 동일 좌표 합주실 목록 모달 */}
      {selectedClusterStudios && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">이 위치의 합주실 ({selectedClusterStudios.length})</h3>
              <button 
                onClick={() => setSelectedClusterStudios(null)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <span className="sr-only">닫기</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {selectedClusterStudios.map(studio => (
                <div key={studio.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl cursor-pointer transition-colors group">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {studio.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">클릭하여 상세 정보 보기</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
