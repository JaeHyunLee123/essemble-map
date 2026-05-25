// 제보 반려 사유를 상용구 템플릿과 직접 입력을 조합해 작성하는 하이브리드 모달 컴포넌트.
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, Edit3Icon } from "lucide-react";

interface DenyReasonModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isPending: boolean;
}

const PRESET_REASONS = [
  "존재하지 않는 합주실입니다.",
  "올바르지 않은 네이버 지도 링크입니다.",
  "이미 등록되어 있는 동일 합주실입니다.",
];

export default function DenyReasonModal({
  open,
  onClose,
  onSubmit,
  isPending,
}: DenyReasonModalProps) {
  const [reason, setReason] = useState("");

  const handlePresetClick = (preset: string) => {
    setReason((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return preset;
      }
      return `${trimmed}\n${preset}`;
    });
  };

  const handleConfirm = () => {
    if (!reason.trim()) {
      return;
    }
    onSubmit(reason);
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangleIcon className="w-5 h-5" />
            제보 반려 사유 작성
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
            제보를 반려하는 명확한 사유를 기입해 주십시오. 유저에게 투명하게 고지되는 반려 사유입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 자주 쓰는 반려 사유 (템플릿 상용구) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Edit3Icon className="w-3.5 h-3.5" />
              자주 쓰는 반려 사유 템플릿
            </label>
            <div className="flex flex-col gap-1.5">
              {PRESET_REASONS.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="w-full text-left text-xs bg-zinc-50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl transition-all cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 직접 입력 영역 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              상세 사유 입력 <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="제보 반려 사유를 직접 기입해 주십시오. 위 템플릿 버튼을 누르면 문구가 덧붙여집니다."
              className="w-full min-h-[120px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all resize-none text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <DialogFooter className="mt-4 flex sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto border-zinc-200 dark:border-zinc-800 rounded-xl py-5 font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || !reason.trim()}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-5 font-semibold text-sm transition-all shadow-lg hover:shadow-rose-500/20 active:scale-[0.98] flex items-center justify-center cursor-pointer"
          >
            반려 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
