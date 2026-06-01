// 사용자가 제보한 합주실 목록과 승인 상태를 화이트모드 테마 기반 배지 목록으로 렌더링하는 컴포넌트
"use client";

import React from "react";
import { useUserSubmissions } from "@/hooks/queries/useSubmissions";
import { Send, Clock, CheckCircle2, AlertCircle, HelpCircle, Loader2 } from "lucide-react";

export default function SubmissionList() {
  const { data: submissions = [], isLoading, isError } = useUserSubmissions();

  // 상태 배지 렌더러
  const renderStatusBadge = (status: "pending" | "active" | "deny") => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            승인 완료
          </span>
        );
      case "deny":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/30 text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            반려됨
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            검토 중
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold">제보 내역을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 text-zinc-500">
        <p>제보 내역을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-white/40 dark:bg-zinc-900/10 backdrop-blur-sm max-w-lg mx-auto shadow-sm">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 mb-4 animate-pulse">
          <Send className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200 mb-1">제보한 내역이 없습니다</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 px-6 leading-relaxed">
          지도상에 존재하지 않는 훌륭한 합주실을 알고 계시다면 언제든지 제보해 주세요. 신속하게 검토 후 반영하겠습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-1">
      {submissions.map((item) => (
        <div
          key={item.id}
          className="group relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 transition-all duration-300 hover:border-zinc-300/80 dark:hover:border-zinc-700/80 hover:shadow-xl hover:shadow-zinc-500/5"
        >
          {/* 장식선 효과 */}
          <div
            className={`absolute top-0 left-0 w-full h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
              item.status === "active"
                ? "bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500/0"
                : item.status === "deny"
                ? "bg-gradient-to-r from-rose-500/0 via-rose-500/40 to-rose-500/0"
                : "bg-gradient-to-r from-amber-500/0 via-amber-500/40 to-amber-500/0"
            }`}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-400">
                  {item.type === "studio" ? "합주실 제보" : item.type}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                  {new Date(item.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-base leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {item.name}
              </h4>
            </div>

            <div className="flex items-center sm:justify-end">
              {renderStatusBadge(item.status)}
            </div>
          </div>

          {/* 반려 사유 카드 렌더링 */}
          {item.status === "deny" && item.denyReason && (
            <div className="mt-4 flex gap-3 p-3.5 rounded-xl border border-rose-200/60 dark:border-rose-500/10 bg-rose-50/70 dark:bg-rose-500/5 text-rose-700 dark:text-rose-300 text-xs leading-relaxed transition-all group-hover:border-rose-350 dark:group-hover:border-rose-500/20">
              <HelpCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block text-rose-600 dark:text-rose-450">반려 사유</span>
                <span>{item.denyReason}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
