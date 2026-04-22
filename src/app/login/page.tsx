import { Suspense } from "react";
import { LoginPageClient } from "./LoginPageClient";

export const metadata = {
  title: "로그인 — REELS MARKET",
};

function LoginFallback() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080f] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(236,72,153,0.18),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(59,130,246,0.16),transparent_45%),linear-gradient(180deg,#05060b_0%,#080913_100%)]" />
      <div className="relative mx-auto mt-1 flex min-h-[40vh] w-full max-w-md items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-zinc-400 backdrop-blur-xl sm:mt-4">
        불러오는 중…
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageClient />
    </Suspense>
  );
}
