"use client";

// 로그인 및 회원가입을 토글할 수 있는 모달 컴포넌트

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { Button } from "@/components/ui/button";

export function AuthModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">로그인 / 회원가입</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" ? "로그인" : "회원가입"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {mode === "login" ? (
            <LoginForm onSuccess={handleSuccess} />
          ) : (
            <RegisterForm onSuccess={handleSuccess} />
          )}
        </div>
        <div className="text-center text-sm">
          {mode === "login" ? (
            <p>
              계정이 없으신가요?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-primary underline font-medium"
              >
                회원가입
              </button>
            </p>
          ) : (
            <p>
              이미 계정이 있으신가요?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-primary underline font-medium"
              >
                로그인
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
