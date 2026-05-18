// 메인 홈 페이지 (Next.js 서버 컴포넌트)

import { AuthStatus } from "@/components/auth/auth-status";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="flex flex-col items-center gap-8 text-center bg-white dark:bg-zinc-900 p-12 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          합주실 지도 Phase 2
        </h1>
        
        <AuthStatus />
      </main>
    </div>
  );
}
