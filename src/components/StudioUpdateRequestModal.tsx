// 사용자가 기존 합주실 정보의 수정을 요청하는 모달 폼 컴포넌트
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/stores/authStore";
import { useStudioUpdateRequest } from "@/hooks/queries/useSubmissions";
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
import { Loader2Icon, Edit3Icon } from "lucide-react";
import { useEffect } from "react";

// Zod 유효성 검사 스키마 정의
const updateRequestSchema = z.object({
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

type UpdateRequestFormValues = z.infer<typeof updateRequestSchema>;

interface StudioUpdateRequestModalProps {
  open: boolean;
  onClose: () => void;
  studio: {
    id: string;
    name: string;
    mapUrl: string | null;
    description: string | null;
  } | null;
}

export default function StudioUpdateRequestModal({
  open,
  onClose,
  studio,
}: StudioUpdateRequestModalProps) {
  const { accessToken } = useAuthStore();
  const updateMutation = useStudioUpdateRequest();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateRequestFormValues>({
    resolver: zodResolver(updateRequestSchema),
    defaultValues: {
      name: "",
      mapUrl: "",
      description: "",
    },
  });

  // 스튜디오가 변경되거나 모달이 열릴 때 기본값 리셋
  useEffect(() => {
    if (studio && open) {
      reset({
        name: studio.name,
        mapUrl: studio.mapUrl || "",
        description: studio.description || "",
      });
    }
  }, [studio, open, reset]);

  const onSubmit = (values: UpdateRequestFormValues) => {
    if (!studio) return;
    if (!accessToken) {
      toast.error("로그인이 만료되었습니다. 다시 로그인해 주십시오.");
      return;
    }

    updateMutation.mutate(
      {
        studioId: studio.id,
        values,
      },
      {
        onSuccess: (data) => {
          toast.success(data.message || "정보 수정 요청이 정상적으로 제출되었습니다.");
          reset();
          onClose();
        },
        onError: (error: any) => {
          toast.error(error.message || "수정 요청 등록 중 에러가 발생했습니다.");
        },
      }
    );
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
            <Edit3Icon className="w-5 h-5 text-indigo-500" />
            합주실 정보 수정 제안
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            합주실의 바뀐 정보나 누락된 정보를 제보해 주십시오. 어드민의 검토 후 최종 반영됩니다.
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
              placeholder="수정할 상세 설명 내용을 입력해 주십시오."
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
              disabled={updateMutation.isPending || !isDirty}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 font-semibold text-sm transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                  수정 요청 제출 중...
                </>
              ) : (
                "수정 제안하기"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
