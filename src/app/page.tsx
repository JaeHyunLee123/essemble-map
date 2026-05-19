"use client";

import { useState } from "react";
import NaverMap from "@/components/map/naver-map";
import { AuthStatus } from "@/components/auth/auth-status";

export default function Home() {
  const [bounds, setBounds] = useState<naver.maps.LatLngBounds | null>(null);

  const handleBoundsChange = (newBounds: naver.maps.LatLngBounds) => {
    setBounds(newBounds);
    console.log("Viewport updated:", {
      ne: newBounds.getNE().toString(),
      sw: newBounds.getSW().toString(),
    });
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-black overflow-hidden">
      {/* 상단 헤더 / 인증 상태 */}
      <header className="absolute top-4 right-4 z-10 flex items-center gap-4">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
          <AuthStatus />
        </div>
      </header>

      {/* 지도 영역 */}
      <main className="flex-1 w-full h-full relative">
        <NaverMap onBoundsChange={handleBoundsChange} />
        
        {/* 디버깅용 정보 (개발 모드에서만 유용) */}
        {bounds && (
          <div className="absolute bottom-4 left-4 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-3 rounded-lg text-xs font-mono border border-zinc-200 dark:border-zinc-800 pointer-events-none">
            <p>NE: {bounds.getNE().lat().toFixed(4)}, {bounds.getNE().lng().toFixed(4)}</p>
            <p>SW: {bounds.getSW().lat().toFixed(4)}, {bounds.getSW().lng().toFixed(4)}</p>
          </div>
        )}
      </main>
    </div>
  );
}
