"use client";

// 회원가입 폼 컴포넌트
// shadcn/ui와 react-hook-form을 사용하여 구현함

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRegisterMutation } from "@/hooks/queries/useAuthMutations";
import { Eye, EyeOff, Check } from "lucide-react";
import { ERROR_MESSAGES, ErrorCode } from "@/lib/error-codes";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "아이디는 3자 이상이어야 합니다.")
      .max(20, "아이디는 20자 이내여야 합니다."),
    password: z
      .string()
      .min(6, "비밀번호는 6자 이상이어야 합니다.")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{6,20}$/,
        "비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다."
      ),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요."),
    nickname: z
      .string()
      .min(2, "닉네임은 2자 이상이어야 합니다.")
      .max(10, "닉네임은 10자 이내여야 합니다."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const registerMutation = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      nickname: "",
    },
  });

  const passwordValue = form.watch("password") || "";
  const confirmPasswordValue = form.watch("confirmPassword") || "";

  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{6,20}$/;
  const isPasswordValid = passwordRegex.test(passwordValue);
  const isConfirmPasswordValid =
    confirmPasswordValue.length > 0 && passwordValue === confirmPasswordValue;

  const onSubmit = async (values: RegisterValues) => {
    try {
      const result = await registerMutation.mutateAsync({
        username: values.username,
        password: values.password,
        nickname: values.nickname,
      });

      if (result.success) {
        toast.success("회원가입이 완료되었습니다. 로그인해주세요.");
        onSuccess?.();
      } else {
        toast.error(result.error?.message || "회원가입에 실패했습니다.");
      }
    } catch (err: any) {
      const code = err.response?.data?.error?.code as ErrorCode;
      const message = (code && ERROR_MESSAGES[code]) || err.response?.data?.error?.message || "회원가입 중 오류가 발생했습니다.";
      toast.error(message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>아이디</FormLabel>
              <FormControl>
                <Input placeholder="3~20자의 아이디" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>닉네임</FormLabel>
              <FormControl>
                <Input placeholder="2~10자의 닉네임" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="영문, 숫자, 특수문자 포함 6자 이상"
                    className="pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <div
                className={cn(
                  "text-xs flex items-center gap-1 mt-1 transition-colors duration-200",
                  isPasswordValid
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-500 dark:text-zinc-400"
                )}
              >
                {isPasswordValid && <Check className="w-3.5 h-3.5" />}
                <span>영문, 숫자, 특수문자 포함 6자 이상 (6~20자)</span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호 확인</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="비밀번호를 다시 입력하세요"
                    className="pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <div
                className={cn(
                  "text-xs flex items-center gap-1 mt-1 transition-colors duration-200",
                  isConfirmPasswordValid
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-500 dark:text-zinc-400"
                )}
              >
                {isConfirmPasswordValid && <Check className="w-3.5 h-3.5" />}
                <span>
                  {!confirmPasswordValue
                    ? "비밀번호를 한번 더 입력해 주세요."
                    : isConfirmPasswordValid
                    ? "비밀번호가 일치합니다."
                    : "비밀번호가 일치하지 않습니다."}
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          회원가입
        </Button>
      </form>
    </Form>
  );
}
