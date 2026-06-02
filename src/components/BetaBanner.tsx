// 웹사이트가 베타 버전임을 안내하고 닫기 기능을 제공하는 배너 컴포넌트
"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function BetaBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem("beta-banner-hidden");
    if (!isHidden) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("beta-banner-hidden", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const text =
    "합주실 지도 서비스는 현재 베타 버전입니다. 버그 제보는 jhyon123@gmail.com으로 부탁드립니다.";
  const text2 =
    "합주실 정보는 여러분의 제보로 만들어집니다. 많은 제보 부탁드립니다.";
  const marqueeText = `${text} ${text2} \u00a0\u00a0\u00a0\u00a0 • \u00a0\u00a0\u00a0\u00a0 `;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-black/80 backdrop-blur-sm border-b border-zinc-800/50 text-white h-9 flex items-center justify-between overflow-hidden px-4 text-xs font-medium select-none">
      {/* Marquee 영역 */}
      <div className="flex-1 overflow-hidden relative flex items-center">
        <div className="animate-marquee whitespace-nowrap">
          <span>{marqueeText}</span>
          <span>{marqueeText}</span>
        </div>
      </div>

      {/* 닫기 버튼 */}
      <button
        onClick={handleClose}
        className="ml-4 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-500 cursor-pointer flex-shrink-0"
        aria-label="안내 배너 닫기"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
