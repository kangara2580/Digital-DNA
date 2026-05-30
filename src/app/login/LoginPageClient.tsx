"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GoogleOAuthButton } from "@/components/GoogleOAuthButton";
import {
  authLoginPageScrim,
  authModalDialogClipNoScroll,
  authModalDialogFixedPaddingClass,
  authModalDialogFixedWidthClass,
  authModalDialogSurface,
  authModalDismissButtonFixedCls,
  authModalFixedSubtitleClass,
  authModalFixedWordmarkClass,
  authModalGlowBottom,
  authModalGlowTop,
  authModalGoogleButtonShadow,
  authModalGoogleButtonTextFixed,
  loginPageAmbientBg,
} from "@/lib/authModalTheme";
import { useAuthSession } from "@/hooks/useAuthSession";
import { isAuthSimulateLoginEnabled } from "@/lib/authSimulate";
import { postLoginRedirectPath } from "@/lib/postLoginRedirect";
import { useTranslation } from "@/hooks/useTranslation";
import {
  araWordmarkFontStyle,
  authModalBrandHeadlineClassName,
} from "@/lib/araBrandTypography";

export function LoginPageClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuthSession();

  const [error, setError] = useState("");
  const notice = "";

  useEffect(() => {
    const errCode = searchParams.get("error") ?? "";
    const isOauthErr =
      errCode === "oauth" ||
      errCode === "oauth_callback_failed" ||
      errCode === "oauth_start_failed";
    if (!isOauthErr) {
      setError("");
      return;
    }
    const reasonRaw = searchParams.get("reason") ?? "";
    const reason = decodeURIComponent(reasonRaw);
    const lower = reason.toLowerCase();
    let detailKey: string = "auth.oauth.detail.default";
    if (lower.includes("redirect") || lower.includes("mismatch")) {
      detailKey = "auth.oauth.detail.redirect";
    } else if (lower.includes("provider") && lower.includes("enabled")) {
      detailKey = "auth.oauth.detail.provider";
    } else if (lower.includes("invalid client") || lower.includes("oauth client")) {
      detailKey = "auth.oauth.detail.oauthClient";
    } else if (lower.includes("access_denied")) {
      detailKey = "auth.oauth.detail.denied";
    } else if (lower.includes("missing_code_or_config")) {
      detailKey = "auth.oauth.detail.missingCode";
    } else if (lower.includes("fetch failed") || lower.includes("failed to fetch")) {
      detailKey = "auth.oauth.detail.fetchFailed";
    } else if (reason) {
      setError(
        t("auth.oauth.failed", { detail: t("auth.oauth.detail.reason", { reason }) }),
      );
      return;
    }
    setError(t("auth.oauth.failed", { detail: t(detailKey) }));
  }, [searchParams, t]);

  useEffect(() => {
    if (authLoading || !user) return;
    // 시뮬레이션 유저는 실제 JWT가 없어 미들웨어와 불일치 → 여기서 / 로내면 로그인 화면이 깜빡입니다.
    if (isAuthSimulateLoginEnabled()) return;
    const raw = searchParams.get("redirect");
    router.replace(postLoginRedirectPath(raw));
  }, [authLoading, router, searchParams, user]);

  const redirectPath = useMemo(() => searchParams.get("redirect"), [searchParams]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#192731] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div className={`pointer-events-none absolute inset-0 ${loginPageAmbientBg}`} />
      <div className="relative flex min-h-[calc(100vh-3rem)] items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <div className={`absolute inset-0 ${authLoginPageScrim}`} />
        <div className={`relative ${authModalDialogFixedWidthClass} ${authModalDialogFixedPaddingClass} ${authModalDialogClipNoScroll} shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] ${authModalDialogSurface}`}>
          <div className={authModalGlowTop} aria-hidden />
          <div className={authModalGlowBottom} aria-hidden />
          <button
            type="button"
            onClick={() => router.back()}
            className={authModalDismissButtonFixedCls}
            aria-label={t("a11y.close")}
          >
            ×
          </button>
          <p
            className={`${authModalFixedWordmarkClass} ${authModalBrandHeadlineClassName}`}
            style={araWordmarkFontStyle}
          >
            ARA
          </p>
          <p
            className={`${authModalFixedSubtitleClass} ${authModalBrandHeadlineClassName}`}
          >
            {t("auth.loginSignupTitle")}
          </p>
          {error ? (
            <p
              className="mt-5 rounded-xl border border-reels-crimson/45 bg-reels-crimson/12 px-3 py-2 text-[13px] font-semibold text-[#F9ECF3]"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {notice ? (
            <p
              className="mt-5 rounded-xl border border-emerald-500/45 bg-emerald-500/10 px-3 py-2 text-[13px] font-semibold text-emerald-200"
              role="status"
            >
              {notice}
            </p>
          ) : null}
          <div className="mx-auto mt-9 w-full max-w-[360px]">
            <GoogleOAuthButton
              nextPath={redirectPath}
              label={t("auth.googleCta")}
              googleLabelTypographyClass={authModalGoogleButtonTextFixed}
              showBrandChevron
              className={`flex w-full items-center justify-center gap-[10px] rounded-full bg-white px-[16px] py-[12px] font-extrabold text-[#1a1a1a] transition hover:brightness-95 sm:gap-3 sm:px-[24px] sm:py-[16px] ${authModalGoogleButtonShadow}`}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
