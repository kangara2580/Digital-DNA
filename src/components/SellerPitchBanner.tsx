"use client";

import { Link2, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { HomeStartCtaButton } from "@/components/HomeStartCtaButton";
import { AuthPromptModal } from "@/components/AuthPromptModal";
import { homeSectionHeadingH2ClassName } from "@/lib/homeSectionHeadingTypography";
import { markOAuthFlowStarted } from "@/lib/authOAuthPending";
import { useTranslation } from "@/hooks/useTranslation";
import { araWordmarkFontStyle } from "@/lib/araBrandTypography";
import {
  PitchIllustCreatorPrice,
  PitchIllustCreatorSell,
  PitchIllustCreatorUpload,
  PitchIllustUserBrowse,
  PitchIllustUserCustomize,
  PitchIllustUserDownload,
} from "@/components/HomePitchStepIllustrations";

function useSellerPitchStart() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const startGoogleAuth = useCallback(async () => {
    const next =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : "/";
    const redirectTo = buildAuthCallbackRedirectTo(next);
    markOAuthFlowStarted();
    const supabase = getSupabaseBrowserClient();
    if (supabase && redirectTo) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });
      if (!error && data.url) {
        window.location.assign(data.url);
        return;
      }
    }
    window.location.assign(`/api/auth/google/start?next=${encodeURIComponent(next)}`);
  }, []);

  const onStartClick = useCallback(() => {
    if (authLoading) return;
    if (user) {
      router.push("/mypage");
      return;
    }
    setAuthOpen(true);
  }, [authLoading, user, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return { authLoading, authOpen, mounted, onStartClick, setAuthOpen, startGoogleAuth };
}

const pitchRoleHeadingClassName =
  "pt-0.5 text-[22px] font-extrabold tracking-tight text-white [html[data-theme='light']_&]:text-zinc-900 sm:text-[24px]";
/** 단계 제목(1. … / 2. …): 역할 헤더(사용자·크리에이터)와 동일 크기·웨이트 */
const pitchStepTitleClassName =
  "text-[22px] font-extrabold tracking-tight text-white [html[data-theme='light']_&]:text-zinc-900 sm:text-[24px]";
const pitchStepBodyClassName =
  "text-[14px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600 sm:text-[15px]";

type SellerPitchBannerProps = {
  showStartButton?: boolean;
};

function SellerPitchStartButton({
  authLoading,
  onStartClick,
}: {
  authLoading: boolean;
  onStartClick: () => void;
}) {
  return (
    <HomeStartCtaButton onClick={onStartClick} disabled={authLoading} />
  );
}

export function SellerPitchBottomStartButton() {
  const { t } = useTranslation();
  const { authLoading, authOpen, mounted, onStartClick, setAuthOpen, startGoogleAuth } =
    useSellerPitchStart();

  return (
    <>
      <section className="home-ranked-strip relative bg-[color:var(--home-ranked-strip-bg)] pt-16 pb-28 sm:pt-24 sm:pb-32 lg:pt-28">
        <div className="relative mx-auto max-w-[1800px] px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 lg:px-8">
          <div className="flex flex-col items-center gap-8 sm:gap-9">
            <p className="mx-auto w-full min-w-0 text-center whitespace-nowrap text-[clamp(1.35rem,4.6vw,2.25rem)] leading-snug tracking-[0.02em] text-zinc-100 sm:text-[clamp(1.45rem,3.8vw,2.4rem)] [html[data-theme='light']_&]:text-zinc-900">
              {t("home.pitch.bottomTagline")}
            </p>
            <SellerPitchStartButton authLoading={authLoading} onStartClick={onStartClick} />
          </div>
        </div>
      </section>
      {mounted ? (
        <AuthPromptModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onGoogleStart={() => void startGoogleAuth()}
        />
      ) : null}
    </>
  );
}

export function SellerPitchBanner({ showStartButton = true }: SellerPitchBannerProps) {
  const { t } = useTranslation();
  const { authLoading, authOpen, mounted, onStartClick, setAuthOpen, startGoogleAuth } =
    useSellerPitchStart();

  return (
    <>
      <section
        id="seller-pitch"
        className="home-ranked-strip relative bg-[color:var(--home-ranked-strip-bg)]"
        aria-labelledby="seller-pitch-heading"
      >
        <div className="relative mx-auto max-w-[1800px] px-4 pb-8 pt-12 sm:px-6 sm:pb-10 sm:pt-16 lg:px-8 lg:pb-12 lg:pt-20">
          <div className="relative mx-auto w-full max-w-[1600px] overflow-visible rounded-2xl bg-transparent px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16">

          <div className="hidden">
            <p className="text-center text-[clamp(1.3rem,2.8vw,1.95rem)] font-semibold tracking-tight text-zinc-100">
              {t("home.pitch.hidden.lead")}
            </p>
            <ol className="hidden">
              <li className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <div className="relative rounded-xl border border-white/30 bg-white/[0.03] px-5 py-4 text-center lg:text-left">
                  <span
                    className="pointer-events-none absolute -right-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-white/30 bg-[#070f1f] lg:block"
                    aria-hidden
                  />
                  <p className="flex items-center justify-center gap-1.5 font-semibold text-white lg:justify-start"><Link2 className="h-4 w-4" />{t("home.pitch.hidden.regTitle")}</p>
                  <p>
                    {t("home.pitch.hidden.regBody.line1")}
                    <br />
                    {t("home.pitch.hidden.regBody.line2")}
                  </p>
                </div>
                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-white/40 bg-[#0b1220] text-lg font-semibold text-zinc-100 shadow-[0_0_0_4px_rgba(7,15,31,0.95)]">
                  A
                </div>
                <div className="hidden lg:block" />
              </li>
              <li className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <div className="hidden lg:block" />
                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-white/40 bg-[#0b1220] text-lg font-semibold text-zinc-100 shadow-[0_0_0_4px_rgba(7,15,31,0.95)]">
                  B
                </div>
                <div className="relative rounded-xl border border-white/30 bg-white/[0.03] px-5 py-4 text-center lg:text-left">
                  <span
                    className="pointer-events-none absolute -left-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-white/30 bg-[#070f1f] lg:block"
                    aria-hidden
                  />
                  <p className="flex items-center justify-center gap-1.5 font-semibold text-white lg:justify-end"><WandSparkles className="h-4 w-4" />{t("home.pitch.hidden.remixTitle")}</p>
                  <p>{t("home.pitch.hidden.remixBody")}</p>
                </div>
              </li>
              <li className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <div className="relative rounded-xl border border-white/30 bg-white/[0.03] px-5 py-4 text-center lg:text-left">
                  <span
                    className="pointer-events-none absolute -right-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-white/30 bg-[#070f1f] lg:block"
                    aria-hidden
                  />
                  <p className="flex items-center justify-center gap-1.5 font-semibold text-white lg:justify-start"><WandSparkles className="h-4 w-4" />{t("home.pitch.hidden.step3Title")}</p>
                  <p>{t("home.pitch.hidden.remixBody")}</p>
                </div>
                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-white/40 bg-[#0b1220] text-lg font-semibold text-zinc-100 shadow-[0_0_0_4px_rgba(7,15,31,0.95)]">
                  C
                </div>
                <div className="hidden lg:block" />
              </li>
            </ol>

            <div className="relative mx-auto mt-8 w-full max-w-[1280px] sm:mt-10">
              <div
                className="pointer-events-none absolute bottom-8 left-1/2 top-8 hidden w-px -translate-x-1/2 bg-white/28 lg:block"
                aria-hidden
              />
              <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
                <div className="relative border border-white/28 bg-white/[0.03] px-5 py-4 text-center lg:text-left">
                  <span className="pointer-events-none absolute -right-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-white/30 bg-[#070f1f] lg:block" aria-hidden />
                  <p className="font-semibold text-white">{t("home.pitch.hidden.regTitle")}</p>
                  <p>{t("home.pitch.hidden.regBodyShort")}</p>
                </div>
                <div className="mx-auto flex h-16 w-14 items-center justify-center border border-white/35 bg-white/[0.04] text-xl font-semibold text-zinc-100">A</div>
                <div className="hidden lg:block" />
                <div className="hidden lg:block" />
                <div className="mx-auto flex h-16 w-14 items-center justify-center border border-white/35 bg-white/[0.04] text-xl font-semibold text-zinc-100">B</div>
                <div className="relative border border-white/28 bg-white/[0.03] px-5 py-4 text-center lg:text-right">
                  <span className="pointer-events-none absolute -left-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-white/30 bg-[#070f1f] lg:block" aria-hidden />
                  <p className="font-semibold text-white">{t("home.pitch.hidden.tradeTitle")}</p>
                  <p>{t("home.pitch.hidden.tradeBody")}</p>
                </div>
                <div className="relative border border-white/28 bg-white/[0.03] px-5 py-4 text-center lg:text-left">
                  <span className="pointer-events-none absolute -right-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-white/30 bg-[#070f1f] lg:block" aria-hidden />
                  <p className="font-semibold text-white">{t("home.pitch.hidden.step3Title")}</p>
                  <p>{t("home.pitch.hidden.remixBody")}</p>
                </div>
                <div className="mx-auto flex h-16 w-14 items-center justify-center border border-white/35 bg-white/[0.04] text-xl font-semibold text-zinc-100">C</div>
                <div className="hidden lg:block" />
              </div>
            </div>

            <div className="mt-14 text-center sm:mt-16">
              <p
                className="mt-3 text-[clamp(2.1rem,5.6vw,4rem)] font-semibold leading-none tracking-[0.02em] text-white [text-shadow:0_0_22px_rgba(143,208,255,0.22)] [html[data-theme='light']_&]:text-zinc-950 [html[data-theme='light']_&]:[text-shadow:none]"
                style={araWordmarkFontStyle}
              >
                ARA
              </p>
            </div>
          </div>

          <div className="hidden">
            <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-5 text-center sm:min-h-[170px]"><p className="text-sm font-semibold text-zinc-900 sm:text-base">{t("home.pitch.hidden.regTitle")}</p><div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[color:var(--reels-point)]" /><p className="mt-3 text-[13px] leading-relaxed text-zinc-600 sm:text-[14px]">{t("home.pitch.hidden.regBodyShort")}</p></div>
            <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-5 text-center sm:min-h-[170px]"><p className="text-sm font-semibold text-zinc-900 sm:text-base">{t("home.pitch.hidden.tradeTitle")}</p><div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[color:var(--reels-point)]" /><p className="mt-3 text-[13px] leading-relaxed text-zinc-600 sm:text-[14px]">{t("home.pitch.hidden.tradeBody")}</p></div>
            <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-5 text-center sm:min-h-[170px]"><p className="text-sm font-semibold text-zinc-900 sm:text-base">{t("home.pitch.hidden.step3Title")}</p><div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[color:var(--reels-point)]" /><p className="mt-3 text-[13px] leading-relaxed text-zinc-600 sm:text-[14px]">{t("home.pitch.hidden.remixBody")}</p></div>
          </div>

          <div className="relative mt-0 sm:mt-1">
            <div className="mx-auto w-full max-w-[1120px]">
              <div className="space-y-10 sm:space-y-12 lg:space-y-14">
                <h2
                  id="seller-pitch-heading"
                  className={`${homeSectionHeadingH2ClassName}`}
                >
                  {t("home.pitch.headingLead")}
                  <span className="font-bold">3</span>
                  {t("home.pitch.headingTrail")}
                </h2>
                <div className="grid gap-7 lg:grid-cols-2 lg:gap-10 xl:gap-12">
                  {/* 사용자 카드 */}
                  <div className="relative overflow-hidden rounded-[22px] border-[0.5px] border-solid border-white/[0.26] bg-black px-7 py-9 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.45)] [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[0_14px_44px_-28px_rgba(15,23,42,0.12)] sm:px-9 sm:py-11 lg:px-11 lg:py-12">
                    <section className="flex flex-col items-center space-y-7 text-center sm:space-y-8">
                      <p className={pitchRoleHeadingClassName}>{t("home.pitch.roleUser")}</p>
                      <p className={`max-w-md ${pitchStepBodyClassName}`}>
                        {t("home.pitch.userIntro")}
                      </p>
                      <ol className="w-full space-y-14 sm:space-y-16 lg:space-y-[4.5rem]">
                        <li className="flex flex-col items-center gap-6 sm:gap-8">
                          <PitchIllustUserBrowse aria-label={t("home.pitch.user.step1Alt")} />
                          <div className="space-y-2.5">
                            <p className={pitchStepTitleClassName}>{t("home.pitch.user.step1Title")}</p>
                            <p className={pitchStepBodyClassName}>{t("home.pitch.user.step1Body")}</p>
                          </div>
                        </li>
                        <li className="flex flex-col items-center gap-6 sm:gap-8">
                          <PitchIllustUserCustomize aria-label={t("home.pitch.user.step2Alt")} />
                          <div className="space-y-2.5">
                            <p className={pitchStepTitleClassName}>{t("home.pitch.user.step2Title")}</p>
                            <p className={pitchStepBodyClassName}>{t("home.pitch.user.step2Body")}</p>
                          </div>
                        </li>
                        <li className="flex flex-col items-center gap-6 sm:gap-8">
                          <PitchIllustUserDownload aria-label={t("home.pitch.user.step3Alt")} />
                          <div className="space-y-2.5">
                            <p className={pitchStepTitleClassName}>{t("home.pitch.user.step3Title")}</p>
                            <p className={pitchStepBodyClassName}>{t("home.pitch.user.step3Body")}</p>
                          </div>
                        </li>
                      </ol>
                    </section>
                  </div>

                  {/* 크리에이터 카드 */}
                  <div className="relative overflow-hidden rounded-[22px] border-[0.5px] border-solid border-white/[0.26] bg-black px-7 py-9 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.45)] [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[0_14px_44px_-28px_rgba(15,23,42,0.12)] sm:px-9 sm:py-11 lg:px-11 lg:py-12">
                    <section className="flex flex-col items-center space-y-7 text-center sm:space-y-8">
                      <p className={pitchRoleHeadingClassName}>{t("home.pitch.roleCreator")}</p>
                      <p className={`max-w-md ${pitchStepBodyClassName}`}>
                        {t("home.pitch.creatorIntro")}
                      </p>
                      <ol className="w-full space-y-14 sm:space-y-16 lg:space-y-[4.5rem]">
                        <li className="flex flex-col items-center gap-6 sm:gap-8">
                          <PitchIllustCreatorUpload aria-label={t("home.pitch.creator.step1Alt")} />
                          <div className="space-y-2.5">
                            <p className={pitchStepTitleClassName}>{t("home.pitch.creator.step1Title")}</p>
                            <p className={pitchStepBodyClassName}>{t("home.pitch.creator.step1Body")}</p>
                          </div>
                        </li>
                        <li className="flex flex-col items-center gap-6 sm:gap-8">
                          <PitchIllustCreatorPrice aria-label={t("home.pitch.creator.step2Alt")} />
                          <div className="-translate-y-2 space-y-2.5">
                            <p className={pitchStepTitleClassName}>{t("home.pitch.creator.step2Title")}</p>
                            <p className={pitchStepBodyClassName}>{t("home.pitch.creator.step2Body")}</p>
                          </div>
                        </li>
                        <li className="flex flex-col items-center gap-6 sm:gap-8">
                          <PitchIllustCreatorSell aria-label={t("home.pitch.creator.step3Alt")} />
                          <div className="space-y-2.5">
                            <p className={pitchStepTitleClassName}>{t("home.pitch.creator.step3Title")}</p>
                            <p className={pitchStepBodyClassName}>{t("home.pitch.creator.step3Body")}</p>
                          </div>
                        </li>
                      </ol>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showStartButton ? (
            <div className="relative mt-[2.2rem] flex flex-col items-center gap-7 text-center lg:text-center sm:mt-[2.7rem]">
              <div className="min-w-0 lg:w-auto lg:flex-none">
                <div className="flex items-center justify-center gap-4">
                  <div className="min-w-0">
                    <div className="mt-[20px] flex justify-center">
                      <SellerPitchStartButton authLoading={authLoading} onStartClick={onStartClick} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          </div>
        </div>
      </section>
      {mounted ? (
        <AuthPromptModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onGoogleStart={() => void startGoogleAuth()}
        />
      ) : null}
    </>
  );
}
