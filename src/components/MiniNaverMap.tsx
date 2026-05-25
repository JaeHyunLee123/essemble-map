// 제보 상세 모달 내에서 위경도 좌표의 정확성을 검증하는 미니 네이버 지도 컴포넌트.
"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

interface MiniNaverMapProps {
  lat: number;
  lng: number;
  studioName?: string;
}

export default function MiniNaverMap({
  lat,
  lng,
  studioName = "제보 위치",
}: MiniNaverMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);
  const markerRef = useRef<naver.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(() => {
    return typeof window !== "undefined" && !!(window as any).naver?.maps;
  });

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  // 1. 지도 및 마커 초기화
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current) {
      return;
    }

    const position = new naver.maps.LatLng(lat, lng);

    // 지도가 아직 생성되지 않은 경우 생성
    if (!mapRef.current) {
      const mapOptions: naver.maps.MapOptions = {
        center: position,
        zoom: 16,
        minZoom: 10,
        maxZoom: 20,
        logoControl: false,
        mapTypeControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: naver.maps.Position.RIGHT_BOTTOM,
        },
      };

      const map = new naver.maps.Map(mapContainerRef.current, mapOptions);
      mapRef.current = map;

      const marker = new naver.maps.Marker({
        position,
        map,
        title: studioName,
        icon: {
          content: `
            <div class="flex flex-col items-center">
              <div class="bg-indigo-600 text-white text-xs px-2.5 py-1.5 rounded-xl font-bold shadow-lg flex items-center gap-1 border border-indigo-400">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ${studioName}
              </div>
              <div class="w-2.5 h-2.5 bg-indigo-600 border-2 border-white rotate-45 -mt-1.5 shadow-md"></div>
            </div>
          `,
          anchor: new naver.maps.Point(24, 30),
        },
      });
      markerRef.current = marker;
    } else {
      // 지도가 이미 생성되어 있는 경우 좌표만 변경
      mapRef.current.setCenter(position);
      mapRef.current.setZoom(16);
      if (markerRef.current) {
        markerRef.current.setPosition(position);
      }
    }

    return () => {
      // cleanup은 부모 컴포넌트 언마운트 시 자동 파괴됨
    };
  }, [isLoaded, lat, lng, studioName]);

  if (!clientId) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-zinc-100 dark:bg-zinc-950 text-zinc-500 text-xs border border-zinc-200 dark:border-zinc-800 rounded-2xl">
        네이버 지도 Client ID가 설정되지 않았습니다.
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
        onLoad={() => setIsLoaded(true)}
        type="text/javascript"
        strategy="lazyOnload"
      />
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm"
      />
    </div>
  );
}
