// 유저가 새로운 합주실 정보를 제보할 수 있도록 네이버 지도 링크와 이름 등을 입력받는 폼 컴포넌트
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { Loader2Icon, MapPinIcon } from "lucide-react";

// Zod 유효성 검사 스키마 정의
const submitSchema = z.object({
  name: z
    .string()
    .min(2, { message: "합주실 이름은 최소 2글자 이상 입력해야 합니다." })
    .max(100, { message: "합주실 이름은 100자 이하로 입력해야 합니다." }),
  mapUrl: z
    .string()
    .min(1, { message: "네이버 지도 링크를 입력해 주십시오." })
    .refine(
      (val) => val.includes("naver.me") || val.includes("map.naver.com"),
      { message: "올바른 네이버 지도 주소(naver.me 또는 map.naver.com)가 아닙니다." }
    ),
  description: z.string().max(500, { message: "설명은 500자 이하로 입력해야 합니다." }).optional(),
});

type SubmitFormValues = z.infer<typeof submitSchema>;

interface StudioSubmitFormProps {
  open: boolean;
  onClose: () => void;
}

export default function StudioSubmitForm({
  open,
  onClose,
}: StudioSubmitFormProps) {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmitFormValues>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      name: "",
      mapUrl: "",
      description: "",
    },
  });

  // 합주실 제보 뮤테이션
  const submitMutation = useMutation({
    mutationFn: async (values: SubmitFormValues) => {
      const response = await axios.post("/api/studios/submit", values, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success(data.data.message || "제보가 정상 접수되었습니다.");
        reset(); // 폼 리셋
        onClose(); // 모달 닫기
        // 지도나 제보 내역 등 무효화
        queryClient.invalidateQueries({ queryKey: ["studios"] });
        queryClient.invalidateQueries({ queryKey: ["userSubmissions"] });
      }
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.error?.message ||
        "제보 등록 중 서버 에러가 발생했습니다.";
      toast.error(errorMsg);
    },
  });

  const onSubmit = (values: SubmitFormValues) => {
    if (!accessToken) {
      toast.error("로그인이 만료되었습니다. 다시 로그인해 주십시오.");
      return;
    }
    submitMutation.mutate(values);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-indigo-500" />
            신규 합주실 제보
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            알고 계신 합주실을 지도에 제보해 주십시오. 네이버 지도 링크를 제출하면 지리 정보가 자동으로 파싱됩니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* 합주실 이름 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              합주실 이름 <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="예: 낙원 합주실 홍대점"
              {...register("name")}
              className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 py-5"
            />
            {errors.name && (
              <p className="text-rose-500 text-xs font-medium pl-1 mt-0.5">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* 네이버 지도 링크 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
              <span>네이버 지도 링크 <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-zinc-400 normal-case font-normal">
                naver.me 또는 map.naver.com 주소
              </span>
            </label>
            <Input
              placeholder="예: https://naver.me/5TvD0v3J"
              {...register("mapUrl")}
              className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 py-5"
            />
            {errors.mapUrl && (
              <p className="text-rose-500 text-xs font-medium pl-1 mt-0.5">
                {errors.mapUrl.message}
              </p>
            )}
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              설명 (선택)
            </label>
            <textarea
              placeholder="합주실에 대한 간단한 묘사나 장비 보유 정보를 적어 주십시오."
              {...register("description")}
              className="w-full min-h-[90px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
            {errors.description && (
              <p className="text-rose-500 text-xs font-medium pl-1 mt-0.5">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4 flex sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto border-zinc-200 dark:border-zinc-800 rounded-xl py-5 font-semibold text-zinc-600 dark:text-zinc-300"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 font-semibold text-sm transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                  좌표 파싱 및 제보 등록 중...
                </>
              ) : (
                "제보하기"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
