import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { QueryProvider } from "@/components/providers/QueryProvider";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "합주실 지도",
  description: "내 주변 합주실을 쉽고 빠르게 찾으세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
        <QueryProvider>
          <AuthInitializer />
          <Header />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Toaster position="top-center" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
