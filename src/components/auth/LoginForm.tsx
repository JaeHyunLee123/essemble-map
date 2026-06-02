"use client";

// 로그인 폼 컴포넌트
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
import { useLoginMutation } from "@/hooks/queries/useAuthMutations";
import { Eye, EyeOff } from "lucide-react";
import { ERROR_MESSAGES, ErrorCode } from "@/lib/error-codes";

const loginSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const loginMutation = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      const result = await loginMutation.mutateAsync(values);

      if (result.success) {
        toast.success("로그인되었습니다.");
        onSuccess?.();
      } else {
        toast.error(result?.error?.message || "로그인 중 오류가 발생했습니다.");
      }
    } catch (err: any) {
      const code = err.response?.data?.error?.code as ErrorCode;
      const message = (code && ERROR_MESSAGES[code]) || err.response?.data?.error?.message || "로그인 중 오류가 발생했습니다.";
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
                <Input placeholder="아이디를 입력하세요" {...field} />
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
                    placeholder="비밀번호를 입력하세요"
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
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          로그인
        </Button>
      </form>
    </Form>
  );
}
