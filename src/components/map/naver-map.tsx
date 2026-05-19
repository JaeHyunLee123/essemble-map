// 네이버 지도 SDK를 로드하고 useRef를 통해 직접 제어하는 지도 컴포넌트
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { debounce } from "@/lib/utils";

interface NaverMapProps {
  onBoundsChange?: (bounds: naver.maps.LatLngBounds) => void;
}

export default function NaverMap({ onBoundsChange }: NaverMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  // 지도의 현재 영역을 부모 컴포넌트에 알리는 함수
  const updateBounds = useCallback(() => {
    if (!mapRef.current || !onBoundsChange) return;
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
    </>
  );
}
