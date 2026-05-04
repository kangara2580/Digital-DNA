"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GoogleOAuthButton } from "@/components/GoogleOAuthButton";
import {
  authLoginPageScrim,
  authModalDialogSurface,
  authModalDismissButtonCls,
  authModalGlowBottom,
  authModalGlowTop,
  authModalGoogleButtonShadow,
  loginPageGoogleButtonText,
  loginPageAmbientBg,
} from "@/lib/authModalTheme";
import { useAuthSession } from "@/hooks/useAuthSession";
import { postLoginRedirectPath } from "@/lib/postLoginRedirect";
import { useTranslation } from "@/hooks/useTranslation";

export function LoginPageClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuthSession();

  const [error, setError] = useState("");
  const notice = "";

  useEffect(() => {
    if (searchParams.get("error") !== "oauth") {
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
    const raw = searchParams.get("redirect");
    const path =
      raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
    router.replace(postLoginRedirectPath(path));
  }, [authLoading, router, searchParams, user]);

  const redirectPath = useMemo(() => searchParams.get("redirect"), [searchParams]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#192731] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div className={`pointer-events-none absolute inset-0 ${loginPageAmbientBg}`} />
      <div className="relative flex min-h-[calc(100vh-3rem)] items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <div className={`absolute inset-0 ${authLoginPageScrim}`} />
        <div className={`relative w-full max-w-[560px] rounded-[24px] px-5 pb-8 pt-8 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-10 sm:pt-10 ${authModalDialogSurface}`}>
          <div className={authModalGlowTop} aria-hidden />
          <div className={authModalGlowBottom} aria-hidden />
          <button
            type="button"
            onClick={() => router.back()}
            className={authModalDismissButtonCls}
            aria-label={t("a11y.close")}
          >
            ×
          </button>
          <p className="relative text-center text-[clamp(1.85rem,6vw,2.65rem)] font-black tracking-tight text-white">
            ARA
          </p>
          <p className="relative mt-3 text-center text-[clamp(1.15rem,4.6vw,1.85rem)] font-semibold leading-tight text-zinc-100">
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
              googleLabelTypographyClass={loginPageGoogleButtonText}
              showBrandChevron
              className={`flex w-full items-center justify-center gap-2.5 rounded-full bg-white px-4 py-3 font-extrabold text-[#1a1a1a] transition hover:brightness-95 sm:gap-3 sm:px-6 sm:py-4 ${authModalGoogleButtonShadow}`}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
