"use client";

import { useState } from "react";
import NaverMap from "@/components/map/NaverMap";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { useStudios } from "@/hooks/queries/useStudios";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import StudioDetailModal from "@/components/StudioDetailModal";
import StudioSubmitForm from "@/components/StudioSubmitForm";

export default function Home() {
  const { user } = useAuthStore();
  const [viewport, setViewport] = useState<{
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
  } | null>(null);

  const [selectedStudioId, setSelectedStudioId] = useState<string | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  const { data: studios = [] } = useStudios(viewport);

  const handleBoundsChange = (newBounds: naver.maps.LatLngBounds) => {
    const ne = newBounds.getNE();
    const sw = newBounds.getSW();
    
    setViewport({
      neLat: ne.lat(),
      neLng: ne.lng(),
      swLat: sw.lat(),
      swLng: sw.lng(),
    });
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-black overflow-hidden">
      {/* 상단 헤더 / 인증 상태 및 제보 버튼 */}
      <header className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {user && (
          <Button
            onClick={() => setIsSubmitOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg rounded-xl font-semibold text-xs py-2.5 px-4 h-auto active:scale-[0.98] transition-all border-none"
          >
            합주실 제보
          </Button>
        )}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
          <AuthStatus />
        </div>
      </header>

      {/* 지도 영역 */}
      <main className="flex-1 w-full h-full relative">
        <NaverMap
          onBoundsChange={handleBoundsChange}
          studios={studios}
          onStudioClick={(id) => setSelectedStudioId(id)}
        />
        
        {/* 디버깅용 정보 및 상태 표시 */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
          {viewport && (
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-3 rounded-lg text-xs font-mono border border-zinc-200 dark:border-zinc-800">
              <p>Studios found: {studios.length}</p>
              <p className="mt-1 opacity-50">
                NE: {viewport.neLat.toFixed(4)}, {viewport.neLng.toFixed(4)}<br/>
                SW: {viewport.swLat.toFixed(4)}, {viewport.swLng.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* 합주실 상세 모달 */}
      <StudioDetailModal
        studioId={selectedStudioId}
        onClose={() => setSelectedStudioId(null)}
      />

      {/* 합주실 제보 모달 */}
      <StudioSubmitForm
        open={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
      />
    </div>
  );
}
