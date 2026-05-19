"use client";

// 회원가입 폼 컴포넌트
// shadcn/ui와 react-hook-form을 사용하여 구현함

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
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      nickname: "",
    },
  });

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
    } catch {
      toast.error("회원가입 중 오류가 발생했습니다.");
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
                <Input
                  type="password"
                  placeholder="영문, 숫자, 특수문자 포함 6자 이상"
                  {...field}
                />
              </FormControl>
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
                <Input
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  {...field}
                />
              </FormControl>
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
