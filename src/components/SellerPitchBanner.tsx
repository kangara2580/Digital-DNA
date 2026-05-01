"use client";

import { Download, Link2, PencilRuler, PlayCircle, Tag, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthSession } from "@/hooks/useAuthSession";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { AuthModalGoogleStartButton } from "@/components/AuthModalGoogleStartButton";
import { AuthModalPortal } from "@/components/AuthModalPortal";
import {
  authModalDialogSurface,
  authModalDismissButtonCls,
  authModalGlowBottom,
  authModalGlowTop,
} from "@/lib/authModalTheme";

type AuthModalProps = {
  authOpen: boolean;
  mounted: boolean;
  setAuthOpen: Dispatch<SetStateAction<boolean>>;
  startGoogleAuth: () => Promise<void>;
};

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

  useEffect(() => {
    if (!authOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [authOpen]);

  useEffect(() => {
    if (!authOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authOpen]);

  return { authLoading, authOpen, mounted, onStartClick, setAuthOpen, startGoogleAuth };
}

function SellerPitchAuthModal({
  authOpen,
  mounted,
  setAuthOpen,
  startGoogleAuth,
}: AuthModalProps) {
  return mounted && authOpen
    ? createPortal(
        <AuthModalPortal onDismiss={() => setAuthOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="로그인 또는 회원가입"
            className={`relative w-full max-h-[min(92vh,760px)] overflow-y-auto rounded-[24px] px-5 pb-8 pt-8 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-10 sm:pt-10 ${authModalDialogSurface}`}
          >
            <div className={authModalGlowTop} aria-hidden />
            <div className={authModalGlowBottom} aria-hidden />
            <button
              type="button"
              onClick={() => setAuthOpen(false)}
              className={authModalDismissButtonCls}
              aria-label="닫기"
            >
              ×
            </button>
            <p className="relative text-center text-[clamp(1.85rem,6vw,2.65rem)] font-black tracking-tight text-white">
              ARA
            </p>
            <p className="relative mt-3 text-center text-[clamp(1.15rem,4.6vw,1.85rem)] font-semibold leading-tight text-zinc-100">
              로그인/회원가입
            </p>
            <AuthModalGoogleStartButton onClick={() => void startGoogleAuth()} />
          </div>
        </AuthModalPortal>,
        document.body,
      )
    : null;
}

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
    <button
      type="button"
      onClick={onStartClick}
      disabled={authLoading}
      className="pointer-events-auto relative inline-flex min-w-[188px] items-center justify-center overflow-hidden rounded-full border border-white/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_18%,rgba(9,12,18,0.86)_58%,rgba(10,12,17,0.96)_100%)] px-7 py-2.5 text-[1.65rem] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(255,255,255,0.12),0_10px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-[border-color,border-width,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-2 hover:border-[#e91e63] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(255,255,255,0.12),0_14px_34px_rgba(0,0,0,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e91e63]/80 disabled:hover:translate-y-0"
    >
      <span
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/75 to-transparent"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent"
        aria-hidden
      />
      <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">시작하기</span>
    </button>
  );
}

export function SellerPitchBottomStartButton() {
  const { authLoading, authOpen, mounted, onStartClick, setAuthOpen, startGoogleAuth } =
    useSellerPitchStart();

  return (
    <>
      <section className="home-ranked-strip relative bg-[color:var(--home-ranked-strip-bg)]">
        <div className="relative mx-auto max-w-[1800px] px-4 pb-20 pt-10 sm:px-6 sm:pb-24 lg:px-8">
          <div className="flex flex-col items-center gap-8 sm:gap-9">
            <p className="max-w-[min(92vw,40rem)] text-center text-[clamp(1.35rem,4.6vw,2.25rem)] leading-snug tracking-tight text-zinc-100 sm:text-[clamp(1.45rem,3.8vw,2.4rem)] [html[data-theme='light']_&]:text-zinc-900">
              <span className="block">
                <span className="font-light">지금 </span>
                <span className="font-semibold">ARA와 함께,</span>
              </span>
              <span className="block">
                <span className="font-semibold">원하던 영상</span>
                <span className="font-light">을 </span>
                <span className="font-semibold">완성</span>
                <span className="font-light">해 보세요.</span>
              </span>
            </p>
            <SellerPitchStartButton authLoading={authLoading} onStartClick={onStartClick} />
          </div>
        </div>
      </section>
      <SellerPitchAuthModal
        authOpen={authOpen}
        mounted={mounted}
        setAuthOpen={setAuthOpen}
        startGoogleAuth={startGoogleAuth}
      />
    </>
  );
}

export function SellerPitchBanner({ showStartButton = true }: SellerPitchBannerProps) {
  const { authLoading, authOpen, mounted, onStartClick, setAuthOpen, startGoogleAuth } =
    useSellerPitchStart();

  return (
    <>
      <section
        id="seller-pitch"
        className="home-ranked-strip relative border-t border-white/10 bg-[color:var(--home-ranked-strip-bg)]"
        aria-labelledby="seller-pitch-heading"
      >
        <div className="relative mx-auto max-w-[1800px] px-4 pb-[14px] pt-[44px] sm:px-6 sm:pb-[20px] sm:pt-[60px] lg:px-8 lg:pb-[24px] lg:pt-[76px]">
          <div className="relative mx-auto w-full max-w-[1600px] overflow-visible rounded-2xl bg-transparent px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_50%,rgba(58,143,255,0.12)_0%,rgba(3,10,25,0)_72%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-[26%] top-[8%] h-72 w-72 rounded-full bg-white/18 blur-[110px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-[8%] top-[64%] h-24 w-24 rounded-full bg-[#caeeff]/28 blur-3xl"
            aria-hidden
          />

          <div className="hidden">
            <p className="text-center text-[clamp(1.3rem,2.8vw,1.95rem)] font-semibold tracking-tight text-zinc-100">
              이렇게 이용해 보세요
            </p>
            <ol className="hidden">
              <li className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <div className="relative rounded-xl border border-white/30 bg-white/[0.03] px-5 py-4 text-center lg:text-left">
                  <span
                    className="pointer-events-none absolute -right-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-white/30 bg-[#070f1f] lg:block"
                    aria-hidden
                  />
                  <p className="flex items-center justify-center gap-1.5 font-semibold text-white lg:justify-start"><Link2 className="h-4 w-4" />1. 등록</p>
                  <p>
                    플랫폼 URL을 불러오시거나
                    <br />
                    직접 영상을 올려 주세요.
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
                  <p className="flex items-center justify-center gap-1.5 font-semibold text-white lg:justify-end"><WandSparkles className="h-4 w-4" />2. 재창작</p>
                  <p>ARA AI로 배경, 얼굴, 몸을 자연스럽게 편집해 2차 창작까지 완성해 보세요.</p>
                </div>
              </li>
              <li className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <div className="relative rounded-xl border border-white/30 bg-white/[0.03] px-5 py-4 text-center lg:text-left">
                  <span
                    className="pointer-events-none absolute -right-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-white/30 bg-[#070f1f] lg:block"
                    aria-hidden
                  />
                  <p className="flex items-center justify-center gap-1.5 font-semibold text-white lg:justify-start"><WandSparkles className="h-4 w-4" />3. 재창작</p>
                  <p>ARA AI로 배경, 얼굴, 몸을 자연스럽게 편집해 2차 창작까지 완성해 보세요.</p>
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
                  <p className="font-semibold text-white">1. 등록</p>
                  <p>플랫폼 URL을 불러오시거나 직접 영상을 올려 주세요.</p>
                </div>
                <div className="mx-auto flex h-16 w-14 items-center justify-center border border-white/35 bg-white/[0.04] text-xl font-semibold text-zinc-100">A</div>
                <div className="hidden lg:block" />
                <div className="hidden lg:block" />
                <div className="mx-auto flex h-16 w-14 items-center justify-center border border-white/35 bg-white/[0.04] text-xl font-semibold text-zinc-100">B</div>
                <div className="relative border border-white/28 bg-white/[0.03] px-5 py-4 text-center lg:text-right">
                  <span className="pointer-events-none absolute -left-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-white/30 bg-[#070f1f] lg:block" aria-hidden />
                  <p className="font-semibold text-white">2. 거래</p>
                  <p>필요한 영상을 구매하시거나 내 영상을 판매하실 수 있어요.</p>
                </div>
                <div className="relative border border-white/28 bg-white/[0.03] px-5 py-4 text-center lg:text-left">
                  <span className="pointer-events-none absolute -right-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-white/30 bg-[#070f1f] lg:block" aria-hidden />
                  <p className="font-semibold text-white">3. 재창작</p>
                  <p>ARA AI로 배경, 얼굴, 몸을 자연스럽게 편집해 2차 창작까지 완성해 보세요.</p>
                </div>
                <div className="mx-auto flex h-16 w-14 items-center justify-center border border-white/35 bg-white/[0.04] text-xl font-semibold text-zinc-100">C</div>
                <div className="hidden lg:block" />
              </div>
            </div>

            <div className="mt-14 text-center sm:mt-16">
              <p className="mt-3 text-[clamp(2.1rem,5.6vw,4rem)] font-black tracking-[0.1em] text-white [text-shadow:0_0_22px_rgba(143,208,255,0.22)]">
                ARA
              </p>
            </div>
          </div>

          <div className="hidden">
            <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-5 text-center sm:min-h-[170px]"><p className="text-sm font-semibold text-zinc-900 sm:text-base">1. 등록</p><div className="mx-auto mt-2 h-1 w-10 rounded-full bg-cyan-300" /><p className="mt-3 text-[13px] leading-relaxed text-zinc-600 sm:text-[14px]">플랫폼 URL을 불러오시거나 직접 영상을 올려 주세요.</p></div>
            <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-5 text-center sm:min-h-[170px]"><p className="text-sm font-semibold text-zinc-900 sm:text-base">2. 거래</p><div className="mx-auto mt-2 h-1 w-10 rounded-full bg-cyan-300" /><p className="mt-3 text-[13px] leading-relaxed text-zinc-600 sm:text-[14px]">필요한 영상을 구매하시거나 내 영상을 판매하실 수 있어요.</p></div>
            <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-5 text-center sm:min-h-[170px]"><p className="text-sm font-semibold text-zinc-900 sm:text-base">3. 재창작</p><div className="mx-auto mt-2 h-1 w-10 rounded-full bg-cyan-300" /><p className="mt-3 text-[13px] leading-relaxed text-zinc-600 sm:text-[14px]">ARA AI로 배경, 얼굴, 몸을 자연스럽게 편집해 2차 창작까지 완성해 보세요.</p></div>
          </div>

          <div className="relative mt-0 sm:mt-1">
            <div className="mx-auto mt-3 w-full max-w-[1120px] sm:mt-4">
              <div className="space-y-5 sm:space-y-6">
                <p className="mb-6 text-center text-[clamp(1.9rem,4vw,2.9rem)] tracking-tight text-zinc-100 sm:mb-8">
                  <span className="font-light">단 </span>
                  <span className="font-bold">3</span>
                  <span className="font-light">단계</span>
                </p>
                <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
                  {/* 사용자 카드 */}
                  <div className="relative overflow-hidden rounded-[22px] border-[0.5px] border-solid border-white/[0.26] bg-white/[0.03] px-5 py-6 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.45)] sm:px-6 sm:py-7 lg:px-7 lg:py-8">
                    <section className="flex flex-col items-center space-y-5 text-center">
                      <p className="pt-1 text-[22px] font-extrabold tracking-tight text-white sm:text-[24px]">사용자</p>
                      <p className="pb-1 text-[clamp(0.9rem,2vw,1.1rem)] font-medium leading-relaxed tracking-[0.01em] text-white/60 [html[data-theme='light']_&]:text-zinc-700/72">
                        원하는 영상 AI로 재창작해서 사용하기
                      </p>
                      <ol className="w-full space-y-12">
                        <li className="flex flex-col items-center gap-4">
                          <div className="w-full overflow-hidden rounded-xl border border-white/10 shadow-lg">
                            <img src="/steps/user-step1-browse.png" alt="마켓 영상 탐색 화면" className="h-[220px] w-full object-cover object-top" />
                          </div>
                          <div className="mt-4 space-y-2 sm:mt-5">
                            <p className="text-[16px] font-bold text-white">1. 영상 선택</p>
                            <p className="text-[14px] leading-relaxed text-zinc-300 sm:text-[15px]">마켓에서 원하는 영상을 찾아보세요.</p>
                          </div>
                        </li>
                        <li className="flex flex-col items-center gap-4">
                          <div className="w-full overflow-hidden rounded-xl border border-white/10 shadow-lg">
                            <img src="/steps/user-step2-customize.png" alt="영상 구매 및 커스터마이징 화면" className="h-[220px] w-full object-cover object-top" />
                          </div>
                          <div className="mt-4 space-y-2 sm:mt-5">
                            <p className="text-[16px] font-bold text-white">2. AI로 커스터마이징</p>
                            <p className="text-[14px] leading-relaxed text-zinc-300 sm:text-[15px]">배경, 얼굴, 스타일을 자유롭게 변경하세요.</p>
                          </div>
                        </li>
                        <li className="flex flex-col items-center gap-4">
                          <div className="w-full overflow-hidden rounded-xl border border-white/10 shadow-lg">
                            <img src="/steps/user-step3-download.png" alt="인기 영상 다운로드 화면" className="h-[220px] w-full object-cover object-top" />
                          </div>
                          <div className="mt-4 space-y-2 sm:mt-5">
                            <p className="text-[16px] font-bold text-white">3. 다운로드 &amp; 활용</p>
                            <p className="text-[14px] leading-relaxed text-zinc-300 sm:text-[15px]">완성된 영상을 다운로드해 바로 활용하세요.</p>
                          </div>
                        </li>
                      </ol>
                    </section>
                  </div>

                  {/* 크리에이터 카드 */}
                  <div className="relative overflow-hidden rounded-[22px] border-[0.5px] border-solid border-white/[0.26] bg-white/[0.03] px-5 py-6 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.45)] sm:px-6 sm:py-7 lg:px-7 lg:py-8">
                    <section className="flex flex-col items-center space-y-5 text-center">
                      <p className="pt-1 text-[22px] font-extrabold tracking-tight text-white sm:text-[24px]">크리에이터</p>
                      <p className="pb-1 text-[clamp(0.9rem,2vw,1.1rem)] font-medium leading-relaxed tracking-[0.01em] text-white/60 [html[data-theme='light']_&]:text-zinc-700/72">
                        원하는 영상 판매해서 수익 만들기
                      </p>
                      <ol className="w-full space-y-12">
                        <li className="flex flex-col items-center gap-4">
                          <div className="w-full overflow-hidden rounded-xl border border-white/10 shadow-lg">
                            <img src="/steps/creator-step1-upload.png" alt="영상 URL 등록 화면" className="h-[220px] w-full object-cover object-top" />
                          </div>
                          <div className="mt-4 space-y-2 sm:mt-5">
                            <p className="text-[16px] font-bold text-white">1. 영상 등록</p>
                            <p className="text-[14px] leading-relaxed text-zinc-300 sm:text-[15px]">직접 업로드 또는 URL을 붙여넣어 영상을 등록하세요.</p>
                          </div>
                        </li>
                        <li className="flex flex-col items-center gap-4">
                          <div className="w-full overflow-hidden rounded-xl border border-white/10 shadow-lg">
                            <img src="/steps/creator-step2-price.png" alt="가격 설정 화면" className="h-[220px] w-full object-cover object-top" />
                          </div>
                          <div className="mt-4 space-y-2 sm:mt-5">
                            <p className="text-[16px] font-bold text-white">2. 가격 설정</p>
                            <p className="text-[14px] leading-relaxed text-zinc-300 sm:text-[15px]">원하는 가격을 설정하세요.</p>
                          </div>
                        </li>
                        <li className="flex flex-col items-center gap-4">
                          <div className="w-full overflow-hidden rounded-xl border border-white/10 shadow-lg">
                            <img src="/steps/creator-step3-sell.png" alt="마켓에 공개된 판매 영상 화면" className="h-[220px] w-full object-cover object-top" />
                          </div>
                          <div className="mt-4 space-y-2 sm:mt-5">
                            <p className="text-[16px] font-bold text-white">3. 판매 시작</p>
                            <p className="text-[14px] leading-relaxed text-zinc-300 sm:text-[15px]">플랫폼에 공개하면 누구나 구매할 수 있습니다.</p>
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
      <SellerPitchAuthModal
        authOpen={authOpen}
        mounted={mounted}
        setAuthOpen={setAuthOpen}
        startGoogleAuth={startGoogleAuth}
      />
    </>
  );
}
