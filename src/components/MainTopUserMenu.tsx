"use client";

import Link from "next/link";
import { Plus, ShoppingCart, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthSession } from "@/hooks/useAuthSession";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import { AuthModalGoogleStartButton } from "@/components/AuthModalGoogleStartButton";
import { LoggedInAccountHoverMenu } from "@/components/LoggedInAccountHoverMenu";
import { AuthModalPortal } from "@/components/AuthModalPortal";
import {
  TOP_NAV_ACCOUNT_CART_DUAL_MIN_WIDTH,
  TOP_NAV_ACCOUNT_CART_PILL_OUTER,
  TOP_NAV_ACCOUNT_CART_PILL_CELL,
  TOP_NAV_ACCOUNT_CART_PILL_DIVIDER,
  TOP_NAV_ACCOUNT_CART_PILL_DUAL_LAYOUT,
  TOP_NAV_ACCOUNT_CART_PILL_GRID_SINGLE,
  topNavHeroCapsuleGlyphIconClass,
} from "@/lib/topNavIconRing";
import {
  authModalDialogSurface,
  authModalDismissButtonCls,
  authModalGlowBottom,
  authModalGlowTop,
} from "@/lib/authModalTheme";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

/** 계정+장바구니 쌍: 드롭다운 루트는 가로 패딩 없음(호버가 캡슐 끝까지 닿게). */
const accountHoverRootDualClass =
  "group/acctmenu relative flex h-full min-h-0 w-full min-w-0 flex-col items-stretch overflow-visible rounded-l-full";

/** 푸터 등 계정만 */
const accountHoverRootSoloClass =
  "group/acctmenu relative flex h-full min-h-0 w-full min-w-0 flex-col items-stretch overflow-visible rounded-full";

/** 양 칸 같은 px 패딩; 가로폭은 grid 1fr|1fr 로 대칭 */
const capsuleSegmentLeftLoggedClass = `${TOP_NAV_ACCOUNT_CART_PILL_CELL} rounded-l-full px-2.5`;
const capsuleSegmentCartClass = `${TOP_NAV_ACCOUNT_CART_PILL_CELL} rounded-r-full px-2.5`;

const capsuleGuestButtonClass = `${TOP_NAV_ACCOUNT_CART_PILL_CELL} rounded-full px-3.5`;

type Props = {
  /** false: 장바구니 없이 계정만 (푸터 등). true: 로그인 시 계정·장바구니 한 캡슐. */
  withCart?: boolean;
};

function CapsuleUserGlyph() {
  return (
    <UserRound className={topNavHeroCapsuleGlyphIconClass()} strokeWidth={2} aria-hidden />
  );
}

function CapsuleCartGlyph() {
  return (
    <ShoppingCart
      className={`${topNavHeroCapsuleGlyphIconClass()} -translate-x-[1.5px]`}
      strokeWidth={2}
      aria-hidden
    />
  );
}

export function MainTopUserMenu({ withCart = true }: Props) {
  const { user, loading } = useAuthSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  if (loading) {
    if (!withCart) {
      return (
        <div
          className={`${TOP_NAV_ACCOUNT_CART_PILL_OUTER} ${TOP_NAV_ACCOUNT_CART_PILL_GRID_SINGLE} min-w-[2.75rem] pointer-events-none animate-pulse opacity-50`}
          aria-hidden
        >
          <div className={`${TOP_NAV_ACCOUNT_CART_PILL_CELL} rounded-full`} />
        </div>
      );
    }
    return (
      <div
        className={`${TOP_NAV_ACCOUNT_CART_PILL_OUTER} ${TOP_NAV_ACCOUNT_CART_PILL_DUAL_LAYOUT} pointer-events-none animate-pulse opacity-50`}
        aria-hidden
      >
        <div className={TOP_NAV_ACCOUNT_CART_PILL_CELL} />
        <div className={TOP_NAV_ACCOUNT_CART_PILL_DIVIDER} />
        <div className={TOP_NAV_ACCOUNT_CART_PILL_CELL} />
      </div>
    );
  }

  const guestAuthButtonInner = (
    <span className="relative inline-flex size-8 shrink-0 items-center justify-center">
      <CapsuleUserGlyph />
      <Plus className="absolute -right-[2px] -top-[2px] size-3" strokeWidth={2.35} aria-hidden />
    </span>
  );

  const guestModal =
    mounted && authOpen
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
              <AuthModalGoogleStartButton onClick={startGoogleAuth} />
            </div>
          </AuthModalPortal>,
          document.body,
        )
      : null;

  const guestCapsuleButton = (
    <button
      type="button"
      onClick={() => setAuthOpen(true)}
      className={capsuleGuestButtonClass}
      aria-haspopup="dialog"
      aria-expanded={authOpen}
      aria-label="로그인/회원가입 시작하기"
    >
      {guestAuthButtonInner}
    </button>
  );

  if (!user) {
    return (
      <>
        <div
          className={`${TOP_NAV_ACCOUNT_CART_PILL_OUTER} ${TOP_NAV_ACCOUNT_CART_PILL_GRID_SINGLE} ${TOP_NAV_ACCOUNT_CART_DUAL_MIN_WIDTH}`}
        >
          {guestCapsuleButton}
        </div>
        {guestModal}
      </>
    );
  }

  const loggedRow =
    withCart ? (
      <div className={`${TOP_NAV_ACCOUNT_CART_PILL_OUTER} ${TOP_NAV_ACCOUNT_CART_PILL_DUAL_LAYOUT}`}>
        <LoggedInAccountHoverMenu
          rootClassName={accountHoverRootDualClass}
          triggerClassName={capsuleSegmentLeftLoggedClass}
        >
          <CapsuleUserGlyph />
        </LoggedInAccountHoverMenu>
        <div className={TOP_NAV_ACCOUNT_CART_PILL_DIVIDER} aria-hidden />
        <Link
          href="/cart"
          className={capsuleSegmentCartClass}
          aria-label="장바구니"
        >
          <CapsuleCartGlyph />
        </Link>
      </div>
    ) : (
      <div className={`${TOP_NAV_ACCOUNT_CART_PILL_OUTER} ${TOP_NAV_ACCOUNT_CART_PILL_GRID_SINGLE} min-w-[2.75rem]`}>
        <LoggedInAccountHoverMenu
          rootClassName={accountHoverRootSoloClass}
          triggerClassName={`${TOP_NAV_ACCOUNT_CART_PILL_CELL} rounded-full px-2.5`}
        >
          <CapsuleUserGlyph />
        </LoggedInAccountHoverMenu>
      </div>
    );

  return loggedRow;
}
