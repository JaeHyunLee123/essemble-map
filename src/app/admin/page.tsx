// 어드민 대시보드 홈 페이지로 대기열 및 승인 완료 목록 관리 UI를 구현한 컴포넌트.
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import AdminLayout from "@/components/AdminLayout";
import MiniNaverMap from "@/components/MiniNaverMap";
import DenyReasonModal from "@/components/DenyReasonModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";
import {
  UsersIcon,
  InboxIcon,
  CheckCircle2Icon,
  ClockIcon,
  Trash2Icon,
  ExternalLinkIcon,
  MapPinIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";

interface StudioData {
  id: string;
  name: string;
  mapUrl: string;
  description: string | null;
  lat: number;
  lng: number;
  status: "pending" | "active" | "deny";
  createdAt: string;
}

interface StudioUpdateRequestData {
  id: string;
  studioId: string;
  name: string;
  mapUrl: string;
  description: string | null;
  createdAt: string;
  originalStudio: {
    name: string;
    mapUrl: string;
    description: string | null;
    lat: number;
    lng: number;
  };
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "updateRequest">("pending");

  // 상세 검토 모달 관련 상태
  const [selectedStudio, setSelectedStudio] = useState<StudioData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 반려 사유 모달 관련 상태
  const [isDenyModalOpen, setIsDenyModalOpen] = useState(false);

  // 수정 요청 검토 관련 상태
  const [selectedUpdateRequest, setSelectedUpdateRequest] = useState<StudioUpdateRequestData | null>(null);
  const [isUpdateRequestDetailOpen, setIsUpdateRequestDetailOpen] = useState(false);
  const [isRequestDenyModalOpen, setIsRequestDenyModalOpen] = useState(false);

  // 어드민 최종 조율 입력 필드 상태
  const [adjustName, setAdjustName] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjustMapUrl, setAdjustMapUrl] = useState("");

  // 1. 총 가입 유저 수 통계 조회
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["adminStats", accessToken],
    queryFn: async () => {
      const response = await axios.get("/api/admin/stats", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    enabled: !!accessToken,
  });

  // 2. pending 제보 리스트 조회
  const { data: pendingData, isLoading: isPendingLoading } = useQuery({
    queryKey: ["adminPendingStudios", accessToken],
    queryFn: async () => {
      const response = await axios.get("/api/admin/studios/pending", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    enabled: !!accessToken,
  });

  // 2-2. pending 수정 요청 리스트 조회
  const { data: updateRequestData, isLoading: isUpdateRequestLoading } = useQuery({
    queryKey: ["adminPendingUpdateRequests", accessToken],
    queryFn: async () => {
      const response = await axios.get("/api/admin/studio-requests/pending", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    enabled: !!accessToken,
  });

  // 3. active 목록 조회
  const { data: activeData, isLoading: isActiveLoading } = useQuery({
    queryKey: ["adminActiveStudios", accessToken],
    queryFn: async () => {
      const response = await axios.get("/api/admin/studios/active", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    enabled: !!accessToken,
  });

  // 4. 상태 변경(승인/반려/삭제) Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      denyReason,
    }: {
      id: string;
      status: "active" | "deny";
      denyReason?: string;
    }) => {
      const response = await axios.patch(
        `/api/admin/studios/${id}/status`,
        { status, denyReason },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (data?.success) {
        toast.success(
          variables.status === "active"
            ? "제보가 성공적으로 승인되어 활성화되었습니다."
            : "제보가 성공적으로 반려/비활성화 처리되었습니다."
        );
        // 캐시 무효화 및 데이터 리로드
        queryClient.invalidateQueries({ queryKey: ["adminPendingStudios"] });
        queryClient.invalidateQueries({ queryKey: ["adminActiveStudios"] });
        queryClient.invalidateQueries({ queryKey: ["studios"] });

        // 모든 모달 닫기 및 초기화
        setIsDetailOpen(false);
        setIsDenyModalOpen(false);
        setSelectedStudio(null);
      }
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.error?.message ||
        "상태 변경 처리 중 에러가 발생했습니다.";
      toast.error(errorMsg);
    },
  });

  // 4-2. 수정 요청 상태 변경(승인/반려) Mutation
  const updateRequestStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      denyReason,
      name,
      description,
      mapUrl,
    }: {
      id: string;
      status: "approved" | "rejected";
      denyReason?: string;
      name?: string;
      description?: string | null;
      mapUrl?: string;
    }) => {
      const response = await axios.patch(
        `/api/admin/studio-requests/${id}/status`,
        { status, denyReason, name, description, mapUrl },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (data?.success) {
        toast.success(
          variables.status === "approved"
            ? "수정 요청이 성공적으로 승인되어 반영되었습니다."
            : "수정 요청이 반려 처리되었습니다."
        );
        // 캐시 무효화 및 데이터 리로드
        queryClient.invalidateQueries({ queryKey: ["adminPendingUpdateRequests"] });
        queryClient.invalidateQueries({ queryKey: ["adminActiveStudios"] });
        queryClient.invalidateQueries({ queryKey: ["studios"] });

        // 모든 모달 닫기 및 초기화
        setIsUpdateRequestDetailOpen(false);
        setIsRequestDenyModalOpen(false);
        setSelectedUpdateRequest(null);
      }
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.error?.message ||
        "수정 요청 상태 변경 중 에러가 발생했습니다.";
      toast.error(errorMsg);
    },
  });

  // [수락] 클릭 시 바로 호출
  const handleApprove = () => {
    if (!selectedStudio) return;
    updateStatusMutation.mutate({
      id: selectedStudio.id,
      status: "active",
    });
  };

  // [반려 완료] 클릭 시 호출
  const handleDenySubmit = (reason: string) => {
    if (!selectedStudio) return;
    updateStatusMutation.mutate({
      id: selectedStudio.id,
      status: "deny",
      denyReason: reason,
    });
  };

  // [비활성화 / 삭제] 클릭 시 호출
  const handleDeactivate = (studioId: string) => {
    if (confirm("정말로 이 합주실을 비활성화(지도 노출 제외)하시겠습니까?")) {
      updateStatusMutation.mutate({
        id: studioId,
        status: "deny",
        denyReason: "어드민이 관리자 화면에서 수동 비활성화(삭제) 처리함.",
      });
    }
  };

  const handleRowClick = (studio: StudioData) => {
    setSelectedStudio(studio);
    setIsDetailOpen(true);
  };

  const handleUpdateRequestRowClick = (req: StudioUpdateRequestData) => {
    setSelectedUpdateRequest(req);
    setAdjustName(req.name);
    setAdjustDescription(req.description || "");
    setAdjustMapUrl(req.mapUrl);
    setIsUpdateRequestDetailOpen(true);
  };

  const totalUsers = statsData?.data?.totalUsers ?? 0;
  const pendingList: StudioData[] = pendingData?.data ?? [];
  const updateRequestList: StudioUpdateRequestData[] = updateRequestData?.data ?? [];
  const activeList: StudioData[] = activeData?.data ?? [];

  return (
    <AdminLayout>
      {/* 통계 지표 대시보드 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 총 가입 유저 수 카드 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              총 가입 유저 수
            </p>
            <h3 className="text-3xl font-extrabold tracking-tight">
              {isStatsLoading ? (
                <Loader2Icon className="w-6 h-6 animate-spin text-zinc-300" />
              ) : (
                `${totalUsers} 명`
              )}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
            <UsersIcon className="w-5 h-5" />
          </div>
        </div>

        {/* 심사 대기열 개수 카드 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              심사 대기중 제보
            </p>
            <h3 className="text-3xl font-extrabold tracking-tight">
              {isPendingLoading ? (
                <Loader2Icon className="w-6 h-6 animate-spin text-zinc-300" />
              ) : (
                `${pendingList.length} 건`
              )}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
            <ClockIcon className="w-5 h-5" />
          </div>
        </div>

        {/* 활성 합주실 개수 카드 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              지도 활성 합주실
            </p>
            <h3 className="text-3xl font-extrabold tracking-tight">
              {isActiveLoading ? (
                <Loader2Icon className="w-6 h-6 animate-spin text-zinc-300" />
              ) : (
                `${activeList.length} 개`
              )}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
            <CheckCircle2Icon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 대화형 탭 관리 보드 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl overflow-hidden shadow-sm">
        <div className="border-b border-zinc-100 dark:border-zinc-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "pending"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                  : "bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              <ClockIcon className="w-3.5 h-3.5" />
              제보 심사 대기열 ({pendingList.length})
            </button>
            <button
              onClick={() => setActiveTab("updateRequest")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "updateRequest"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                  : "bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              <InboxIcon className="w-3.5 h-3.5" />
              수정 요청 대기열 ({updateRequestList.length})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "active"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                  : "bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              <CheckCircle2Icon className="w-3.5 h-3.5" />
              승인 완료 목록 ({activeList.length})
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium">
            {activeTab === "pending"
              ? "행을 클릭하여 상세한 지리 및 설명 정보를 검토하고 승인 여부를 결정하십시오."
              : activeTab === "updateRequest"
              ? "유저가 제출한 합주실 정보 수정 요청서 목록입니다. 클릭하여 3분할 화면으로 조율 및 승인/반려를 진행하십시오."
              : "이미 서비스에 노출 중인 합주실 목록입니다. 비활성화 버튼을 누르면 지도에서 즉시 제거됩니다."}
          </p>
        </div>

        {/* 탭 내용 */}
        <div className="p-2">
          {activeTab === "pending" ? (
            /* 제보 대기열 뷰 */
            isPendingLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
                <Loader2Icon className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-xs font-semibold">대기열 제보 데이터를 조회하고 있습니다.</p>
              </div>
            ) : pendingList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-300">
                  <InboxIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    대기 중인 제보가 없습니다.
                  </p>
                  <p className="text-xs text-zinc-500">
                    유저들이 올린 새로운 제보 데이터가 수집되면 여기에 노출됩니다.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-semibold">
                      <th className="p-4">합주실 명</th>
                      <th className="p-4 hidden md:table-cell">네이버 지도 링크</th>
                      <th className="p-4 hidden sm:table-cell">제보 일시</th>
                      <th className="p-4 text-right">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingList.map((studio) => (
                      <tr
                        key={studio.id}
                        onClick={() => handleRowClick(studio)}
                        className="border-b border-zinc-50 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 cursor-pointer transition-colors"
                      >
                        <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate">
                          {studio.name}
                        </td>
                        <td className="p-4 hidden md:table-cell max-w-[300px] truncate text-indigo-600 dark:text-indigo-400 underline font-medium">
                          {studio.mapUrl}
                        </td>
                        <td className="p-4 hidden sm:table-cell text-zinc-400 font-semibold">
                          {new Date(studio.createdAt).toLocaleString("ko-KR")}
                        </td>
                        <td className="p-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            대기중
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === "updateRequest" ? (
            /* 수정 요청 대기열 뷰 */
            isUpdateRequestLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
                <Loader2Icon className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-xs font-semibold">수정 요청 데이터를 조회하고 있습니다.</p>
              </div>
            ) : updateRequestList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-300">
                  <InboxIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    대기 중인 수정 요청이 없습니다.
                  </p>
                  <p className="text-xs text-zinc-500">
                    유저들이 올린 수정 제안 데이터가 수집되면 여기에 노출됩니다.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-semibold">
                      <th className="p-4">대상 합주실 명(원본)</th>
                      <th className="p-4">수정 제안 이름</th>
                      <th className="p-4 hidden md:table-cell">제안 지도 링크</th>
                      <th className="p-4 hidden sm:table-cell">신청 일시</th>
                      <th className="p-4 text-right">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {updateRequestList.map((req) => (
                      <tr
                        key={req.id}
                        onClick={() => handleUpdateRequestRowClick(req)}
                        className="border-b border-zinc-50 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 cursor-pointer transition-colors"
                      >
                        <td className="p-4 font-bold text-zinc-500 dark:text-zinc-400 max-w-[150px] truncate">
                          {req.originalStudio.name}
                        </td>
                        <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100 max-w-[150px] truncate">
                          {req.name}
                        </td>
                        <td className="p-4 hidden md:table-cell max-w-[250px] truncate text-indigo-600 dark:text-indigo-400 underline font-medium">
                          {req.mapUrl}
                        </td>
                        <td className="p-4 hidden sm:table-cell text-zinc-400 font-semibold">
                          {new Date(req.createdAt).toLocaleString("ko-KR")}
                        </td>
                        <td className="p-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            대기중
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* 승인 완료 목록 뷰 */
            isActiveLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
                <Loader2Icon className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-xs font-semibold">활성화된 합주실 목록을 가져오고 있습니다.</p>
              </div>
            ) : activeList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-300">
                  <InboxIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    승인된 합주실이 없습니다.
                  </p>
                  <p className="text-xs text-zinc-500">
                    제보 심사를 승인하면 해당 목록이 활성화되어 노출됩니다.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-semibold">
                      <th className="p-4">합주실 명</th>
                      <th className="p-4 hidden md:table-cell">네이버 지도 링크</th>
                      <th className="p-4 hidden sm:table-cell">승인 일시</th>
                      <th className="p-4 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeList.map((studio) => (
                      <tr
                        key={studio.id}
                        className="border-b border-zinc-50 dark:border-zinc-850 hover:bg-zinc-50/20 dark:hover:bg-zinc-950/10 transition-colors"
                      >
                        <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate">
                          {studio.name}
                        </td>
                        <td className="p-4 hidden md:table-cell max-w-[300px] truncate text-indigo-600 dark:text-indigo-400 underline font-medium">
                          <a
                            href={studio.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:text-indigo-700"
                          >
                            {studio.mapUrl}
                            <ExternalLinkIcon className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="p-4 hidden sm:table-cell text-zinc-400 font-semibold">
                          {new Date(studio.createdAt).toLocaleString("ko-KR")}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="outline"
                            onClick={() => handleDeactivate(studio.id)}
                            disabled={updateStatusMutation.isPending}
                            className="rounded-xl border-zinc-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400 text-[10px] h-8 px-3 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-100"
                          >
                            <Trash2Icon className="w-3.5 h-3.5 mr-1" />
                            비활성화
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {/* 상세 검토 팝업 모달 */}
      {selectedStudio && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-2xl bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-indigo-500" />
                제보 상세 정보 검토
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs">
                제보된 합주실 정보와 자동 추출된 위경도 위치 데이터를 시각적으로 철저히 확인해 주십시오.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* 좌측 정보 영역 */}
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                    합주실 이름
                  </span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedStudio.name}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                    설명 및 정보
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 min-h-[80px]">
                    {selectedStudio.description || "등록된 설명이 없습니다."}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                    네이버 지도 링크
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={selectedStudio.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      실제 지도 페이지로 가기
                      <ExternalLinkIcon className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-950/20 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-850">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium">위도 (Latitude)</span>
                    <p className="font-bold text-zinc-700 dark:text-zinc-300">{selectedStudio.lat.toFixed(6)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium">경도 (Longitude)</span>
                    <p className="font-bold text-zinc-700 dark:text-zinc-300">{selectedStudio.lng.toFixed(6)}</p>
                  </div>
                </div>
              </div>

              {/* 우측 위경도 검증 미니 네이버 지도 */}
              <div className="h-60 md:h-full min-h-[240px]">
                <MiniNaverMap
                  lat={selectedStudio.lat}
                  lng={selectedStudio.lng}
                  studioName={selectedStudio.name}
                />
              </div>
            </div>

            <DialogFooter className="mt-4 flex sm:flex-row gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDetailOpen(false)}
                className="w-full sm:w-auto border-zinc-200 dark:border-zinc-800 rounded-xl py-5 font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                닫기
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDenyModalOpen(true)}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 sm:flex-none bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950 rounded-xl py-5 font-semibold text-sm cursor-pointer hover:bg-rose-100"
                >
                  <XCircleIcon className="w-4 h-4 mr-1.5" />
                  거절하기
                </Button>
                <Button
                  type="button"
                  onClick={handleApprove}
                  disabled={updateStatusMutation.isPending}
                  className="flex-2 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 font-semibold text-sm px-6 cursor-pointer shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2Icon className="w-4 h-4" />
                      승인 완료
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 반려 사유 입력 하이브리드 모달 */}
      <DenyReasonModal
        open={isDenyModalOpen}
        onClose={() => setIsDenyModalOpen(false)}
        onSubmit={handleDenySubmit}
        isPending={updateStatusMutation.isPending}
      />

      {/* 수정 요청 상세 검토 (3분할 뷰) 모달 */}
      {selectedUpdateRequest && (
        <Dialog open={isUpdateRequestDetailOpen} onOpenChange={setIsUpdateRequestDetailOpen}>
          <DialogContent className="sm:max-w-5xl bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-indigo-500" />
                정보 수정 요청 조율 및 검토 (3분할 뷰)
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs">
                현재 원본 정보, 유저의 수정 제안 정보를 비교하고, 우측 조율 폼을 통해 최종 저장될 값을 편집하여 승인할 수 있습니다.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 text-xs">
              {/* 1. 좌측 영역 (원본 정보 + 지도) */}
              <div className="space-y-4 border-r border-zinc-100 dark:border-zinc-800 pr-6">
                <div className="bg-zinc-50 dark:bg-zinc-950/20 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 text-[10px] font-bold uppercase text-zinc-400">
                  1. 현재 원본 정보
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                    원본 이름
                  </span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedUpdateRequest.originalStudio.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                    원본 설명
                  </span>
                  <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950/30 p-2.5 rounded-xl min-h-[60px]">
                    {selectedUpdateRequest.originalStudio.description || "등록된 설명이 없습니다."}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                    원본 지도 링크
                  </span>
                  <p className="truncate">
                    <a
                      href={selectedUpdateRequest.originalStudio.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-650 dark:text-indigo-400 font-medium hover:underline inline-flex items-center gap-1"
                    >
                      실제 지도 보기
                      <ExternalLinkIcon className="w-3 h-3" />
                    </a>
                  </p>
                </div>
                {/* 미니 네이버 지도 */}
                <div className="h-40 w-full rounded-xl overflow-hidden">
                  <MiniNaverMap
                    lat={selectedUpdateRequest.originalStudio.lat}
                    lng={selectedUpdateRequest.originalStudio.lng}
                    studioName={selectedUpdateRequest.originalStudio.name}
                  />
                </div>
              </div>

              {/* 2. 중앙 영역 (유저 제안 정보) */}
              <div className="space-y-4 border-r border-zinc-100 dark:border-zinc-800 pr-6">
                <div className="bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/30 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                  2. 유저 수정 제안 정보
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                    제안 이름
                  </span>
                  <p className={`text-sm font-bold ${
                    selectedUpdateRequest.name !== selectedUpdateRequest.originalStudio.name
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}>
                    {selectedUpdateRequest.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                    제안 설명
                  </span>
                  <p className={`text-xs leading-relaxed bg-zinc-50 dark:bg-zinc-950/30 p-2.5 rounded-xl min-h-[60px] ${
                    selectedUpdateRequest.description !== selectedUpdateRequest.originalStudio.description
                      ? "text-amber-600 dark:text-amber-450 border border-amber-100/50"
                      : "text-zinc-650 dark:text-zinc-300"
                  }`}>
                    {selectedUpdateRequest.description || "제안된 설명이 없습니다."}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                    제안 지도 링크
                  </span>
                  <p className="truncate">
                    <a
                      href={selectedUpdateRequest.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-medium hover:underline inline-flex items-center gap-1 ${
                        selectedUpdateRequest.mapUrl !== selectedUpdateRequest.originalStudio.mapUrl
                          ? "text-amber-600 dark:text-amber-400 font-bold"
                          : "text-indigo-650 dark:text-indigo-400"
                      }`}
                    >
                      제안 지도 보기
                      <ExternalLinkIcon className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              </div>

              {/* 3. 우측 영역 (어드민 최종 조율 필드) */}
              <div className="space-y-4">
                <div className="bg-indigo-50 dark:bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-400">
                  3. 어드민 최종 조율 필드
                </div>
                
                {/* 조율 이름 */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px] block">
                    최종 승인 이름
                  </label>
                  <input
                    type="text"
                    value={adjustName}
                    onChange={(e) => setAdjustName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 p-2.5 text-xs text-zinc-850 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                {/* 조율 설명 */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px] block">
                    최종 승인 설명
                  </label>
                  <textarea
                    value={adjustDescription}
                    onChange={(e) => setAdjustDescription(e.target.value)}
                    className="w-full min-h-[90px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 p-2.5 text-xs text-zinc-850 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                  />
                </div>

                {/* 조율 지도 링크 */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px] block">
                    최종 승인 지도 링크
                  </label>
                  <input
                    type="text"
                    value={adjustMapUrl}
                    onChange={(e) => setAdjustMapUrl(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 p-2.5 text-xs text-zinc-850 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 flex sm:flex-row gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUpdateRequestDetailOpen(false)}
                className="w-full sm:w-auto border-zinc-200 dark:border-zinc-800 rounded-xl py-5 font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                닫기
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRequestDenyModalOpen(true)}
                  disabled={updateRequestStatusMutation.isPending}
                  className="flex-1 sm:flex-none bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950 rounded-xl py-5 font-semibold text-sm cursor-pointer hover:bg-rose-100"
                >
                  <XCircleIcon className="w-4 h-4 mr-1.5" />
                  거절하기
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!selectedUpdateRequest) return;
                    updateRequestStatusMutation.mutate({
                      id: selectedUpdateRequest.id,
                      status: "approved",
                      name: adjustName,
                      description: adjustDescription,
                      mapUrl: adjustMapUrl,
                    });
                  }}
                  disabled={updateRequestStatusMutation.isPending}
                  className="flex-2 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 font-semibold text-sm px-6 cursor-pointer shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  {updateRequestStatusMutation.isPending ? (
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2Icon className="w-4 h-4" />
                      최종 승인 반영
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 수정 요청 반려 사유 입력 모달 */}
      <DenyReasonModal
        open={isRequestDenyModalOpen}
        onClose={() => setIsRequestDenyModalOpen(false)}
        onSubmit={(reason) => {
          if (!selectedUpdateRequest) return;
          updateRequestStatusMutation.mutate({
            id: selectedUpdateRequest.id,
            status: "rejected",
            denyReason: reason,
          });
        }}
        isPending={updateRequestStatusMutation.isPending}
      />
    </AdminLayout>
  );
}
