"use client";

import Link from "next/link";
import { GoogleOAuthButton } from "@/components/GoogleOAuthButton";

export default function SignupPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080f] px-4 py-10 text-zinc-100 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(236,72,153,0.18),transparent_40%),radial-gradient(circle_at_85%_90%,rgba(59,130,246,0.16),transparent_45%),linear-gradient(180deg,#05060b_0%,#080913_100%)]" />
      <div className="relative mx-auto w-full max-w-xl rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">ARA</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">회원가입</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          ARA는 Google 계정으로만 가입할 수 있습니다. 버튼을 누르면 Google 인증 후
          자동으로 계정이 만들어집니다.
        </p>

        <div className="mt-7">
          <GoogleOAuthButton nextPath={null} label="Google로 로그인 / 회원가입" />
        </div>

        <p className="mt-4 text-xs leading-relaxed text-zinc-500">
          계속 진행하면{" "}
          <Link href="/terms" className="font-semibold text-reels-cyan hover:underline">
            이용약관
          </Link>
          과{" "}
          <Link href="/privacy" className="font-semibold text-reels-cyan hover:underline">
            개인정보처리방침
          </Link>
          에 동의한 것으로 간주됩니다.
        </p>

        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-full border border-fuchsia-400/45 bg-fuchsia-500/20 px-5 py-3 text-[14px] font-extrabold text-fuchsia-100 transition hover:bg-fuchsia-500/30"
          >
            로그인 화면으로 이동
          </Link>
        </div>
      </div>
    </main>
  );
}
