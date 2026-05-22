// 사용자가 제보한 합주실 목록 및 승인 상태를 배지 형식으로 렌더링하는 컴포넌트입니다.
"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import axios from "axios";
import { Send, Clock, CheckCircle2, AlertCircle, HelpCircle, Loader2 } from "lucide-react";

interface Submission {
  id: string;
  type: string;
  name: string;
  status: "pending" | "active" | "deny";
  denyReason: string | null;
  createdAt: string;
}

export default function SubmissionList() {
  const { accessToken } = useAuthStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 제보 내역 조회
  const fetchSubmissions = async () => {
    try {
      const response = await axios.get("/api/user/submissions", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const result = response.data;
      if (result.success) {
        setSubmissions(result.data);
      } else {
        toast.error("제보 내역을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error(error);
      toast.error("제보 내역을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // 상태 배지 렌더러
  const renderStatusBadge = (status: "pending" | "active" | "deny") => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            승인 완료
          </span>
        );
      case "deny":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            반려됨
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            검토 중
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
        <p className="text-sm text-zinc-400">제보 내역을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800/80 rounded-2xl bg-zinc-900/10 backdrop-blur-sm max-w-lg mx-auto">
        <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 mb-4 animate-pulse">
          <Send className="w-8 h-8" />
        </div>
        <h3 className="font-semibold text-lg text-zinc-200 mb-1">제보한 내역이 없습니다</h3>
        <p className="text-xs text-zinc-500 px-6 leading-relaxed">
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
          className="group relative overflow-hidden rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-5 transition-all duration-300 hover:border-zinc-700/80 hover:shadow-lg hover:shadow-zinc-950/10"
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
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
                  {item.type === "studio" ? "합주실 제보" : item.type}
                </span>
                <span className="text-xs text-zinc-500">
                  {new Date(item.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <h4 className="font-bold text-zinc-100 text-base leading-tight group-hover:text-zinc-200 transition-colors">
                {item.name}
              </h4>
            </div>

            <div className="flex items-center sm:justify-end">
              {renderStatusBadge(item.status)}
            </div>
          </div>

          {/* 반려 사유 카드 렌더링 */}
          {item.status === "deny" && item.denyReason && (
            <div className="mt-4 flex gap-3 p-3.5 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-300 text-xs leading-relaxed transition-all group-hover:border-rose-500/20">
              <HelpCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block text-rose-400">반려 사유</span>
                <span>{item.denyReason}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
