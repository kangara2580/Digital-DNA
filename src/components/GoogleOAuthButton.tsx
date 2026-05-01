"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { AUTH_MODAL_BRAND_PINK_HEX, authModalGoogleChevronClass } from "@/lib/authModalTheme";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const BTN =
  "flex w-full items-center justify-center gap-2.5 rounded-full border border-white/20 bg-white/[0.06] py-3 text-[14px] font-extrabold text-zinc-100 shadow-sm transition hover:border-white/35 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-55 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-50";

type Props = {
  /** 로그인/가입 후 이동할 앱 내 경로 (쿼리 `redirect` 등) */
  nextPath: string | null;
  label: string;
  className?: string;
  /** 모달 외 로그인 페이지 등 — 브랜드 핑크 우측 화살표 */
  showBrandChevron?: boolean;
};

export function GoogleOAuthButton({
  nextPath,
  label,
  className,
  showBrandChevron = false,
}: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      className={className ?? BTN}
      onClick={async () => {
        const next =
          nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
            ? nextPath
            : "/";
        const redirectTo = buildAuthCallbackRedirectTo(next);
        const supabase = getSupabaseBrowserClient();
        setBusy(true);
        try {
          if (supabase && redirectTo) {
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo,
                queryParams: { prompt: "select_account" },
              },
            });
            if (error) throw error;
            if (data.url) {
              window.location.assign(data.url);
              return;
            }
          }
          // 환경변수/클라이언트 초기화 실패 시 서버 시작 라우트로 폴백
          window.location.assign(`/api/auth/google/start?next=${encodeURIComponent(next)}`);
        } finally {
          setBusy(false);
        }
      }}
    >
      <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 48 48" aria-hidden>
        <path
          fill="#FFC107"
          d="M43.611 20.083H42V20H24v8h11.303C33.42 32.583 29.214 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
        />
        <path
          fill="#FF3D00"
          d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
        />
      </svg>
      {busy ? "Google로 이동 중…" : label}
      {showBrandChevron && !busy ? (
        <ChevronRight
          className={authModalGoogleChevronClass}
          color={AUTH_MODAL_BRAND_PINK_HEX}
          stroke={AUTH_MODAL_BRAND_PINK_HEX}
          strokeWidth={3.85}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        />
      ) : null}
    </button>
  );
}
