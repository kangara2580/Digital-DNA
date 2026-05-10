"use client";

import Link from "next/link";
import { ShoppingCart, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthSession } from "@/hooks/useAuthSession";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import { AuthModalGoogleStartButton } from "@/components/AuthModalGoogleStartButton";
import { LoggedInAccountHoverMenu } from "@/components/LoggedInAccountHoverMenu";
import { AuthModalPortal } from "@/components/AuthModalPortal";
import {
  TOP_NAV_ACCOUNT_CART_PILL_CELL,
  TOP_NAV_ACCOUNT_CART_PILL_DIAMOND_USER_LAYOUT,
  TOP_NAV_ACCOUNT_CART_PILL_DIVIDER,
  TOP_NAV_ACCOUNT_CART_PILL_OUTER,
  TOP_NAV_ACCOUNT_CART_PILL_TRIPLE_LAYOUT,
  topNavHeroCapsuleGlyphIconClass,
  topNavHeroCapsulePaymentDiamondIconClass,
} from "@/lib/topNavIconRing";
import {
  authModalDialogSurface,
  authModalDismissButtonCls,
  authModalGlowBottom,
  authModalGlowTop,
} from "@/lib/authModalTheme";
import { PaymentDiamondIcon } from "@/components/PaymentDiamondIcon";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useTranslation } from "@/hooks/useTranslation";
import {
  araAuthDialogWordmarkClassName,
  araWordmarkFontStyle,
} from "@/lib/araBrandTypography";

/** 추후 결제 백엔드 연동 시 이 경로에 페이지 연결 */
const PAYMENT_PLACEHOLDER_HREF = "/payment";

function CapsulePaymentDiamondGlyph() {
  return (
    <PaymentDiamondIcon
      className={`${topNavHeroCapsulePaymentDiamondIconClass()} text-[color:var(--reels-point)]`}
    />
  );
}

/** 3칸: 결제 | 계정 | 장바구니 — 가운데 호버 메뉴 루트 */
const accountHoverRootTripleMidClass =
  "group/acctmenu relative flex h-full min-h-0 w-full min-w-0 flex-col items-stretch overflow-visible rounded-none";

/** 2칸: 결제 | 계정 — 우측만 둥근 모서리 */
const accountHoverRootDiamondUserRightClass =
  "group/acctmenu relative flex h-full min-h-0 w-full min-w-0 flex-col items-stretch overflow-visible rounded-r-full";

const capsuleSegmentDiamondClass = `${TOP_NAV_ACCOUNT_CART_PILL_CELL} rounded-l-full px-2.5`;
const capsuleSegmentUserMidClass = `${TOP_NAV_ACCOUNT_CART_PILL_CELL} px-2.5`;
const capsuleSegmentCartClass = `${TOP_NAV_ACCOUNT_CART_PILL_CELL} rounded-r-full px-2.5`;

type Props = {
  /** false: 장바구니 없이 결제 다이아 + 계정만 (히어로 등). true: 결제 | 계정 | 장바구니. */
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
  const { t } = useTranslation();
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

  const paymentLink = (
    <Link
      href={PAYMENT_PLACEHOLDER_HREF}
      className={capsuleSegmentDiamondClass}
      aria-label={t("topNav.paymentAria")}
    >
      <CapsulePaymentDiamondGlyph />
    </Link>
  );

  if (loading) {
    if (!withCart) {
      return (
        <div
          className={`${TOP_NAV_ACCOUNT_CART_PILL_OUTER} ${TOP_NAV_ACCOUNT_CART_PILL_DIAMOND_USER_LAYOUT} pointer-events-none animate-pulse opacity-50`}
          aria-hidden
        >
          <div className={TOP_NAV_ACCOUNT_CART_PILL_CELL} />
          <div className={TOP_NAV_ACCOUNT_CART_PILL_DIVIDER} />
          <div className={TOP_NAV_ACCOUNT_CART_PILL_CELL} />
        </div>
      );
    }
    return (
      <div
        className={`${TOP_NAV_ACCOUNT_CART_PILL_OUTER} ${TOP_NAV_ACCOUNT_CART_PILL_TRIPLE_LAYOUT} pointer-events-none animate-pulse opacity-50`}
        aria-hidden
      >
        <div className={TOP_NAV_ACCOUNT_CART_PILL_CELL} />
        <div className={TOP_NAV_ACCOUNT_CART_PILL_DIVIDER} />
        <div className={TOP_NAV_ACCOUNT_CART_PILL_CELL} />
        <div className={TOP_NAV_ACCOUNT_CART_PILL_DIVIDER} />
        <div className={TOP_NAV_ACCOUNT_CART_PILL_CELL} />
      </div>
    );
  }

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
              <p className={araAuthDialogWordmarkClassName} style={araWordmarkFontStyle}>
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

  if (!user) {
    if (!withCart) {
      return (
        <>
          <div className={`${TOP_NAV_ACCOUNT_CART_PILL_OUTER} ${TOP_NAV_ACCOUNT_CART_PILL_DIAMOND_USER_LAYOUT}`}>
            {paymentLink}
            <div className={TOP_NAV_ACCOUNT_CART_PILL_DIVIDER} aria-hidden />
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className={`${TOP_NAV_ACCOUNT_CART_PILL_CELL} rounded-r-full px-2.5`}
              aria-haspopup="dialog"
              aria-expanded={authOpen}
              aria-label="로그인/회원가입 시작하기"
            >
              <CapsuleUserGlyph />
            </button>
          </div>
          {guestModal}
        </>
      );
    }

    return (
      <>
        <div className={`${TOP_NAV_ACCOUNT_CART_PILL_OUTER} ${TOP_NAV_ACCOUNT_CART_PILL_TRIPLE_LAYOUT}`}>
          {paymentLink}
          <div className={TOP_NAV_ACCOUNT_CART_PILL_DIVIDER} aria-hidden />
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className={capsuleSegmentUserMidClass}
            aria-haspopup="dialog"
            aria-expanded={authOpen}
            aria-label="로그인/회원가입 시작하기"
          >
            <CapsuleUserGlyph />
          </button>
          <div className={TOP_NAV_ACCOUNT_CART_PILL_DIVIDER} aria-hidden />
          <Link href="/cart" className={capsuleSegmentCartClass} aria-label="장바구니">
            <CapsuleCartGlyph />
          </Link>
        </div>
        {guestModal}
      </>
    );
  }

  if (!withCart) {
    return (
      <div className={`${TOP_NAV_ACCOUNT_CART_PILL_OUTER} ${TOP_NAV_ACCOUNT_CART_PILL_DIAMOND_USER_LAYOUT}`}>
        {paymentLink}
        <div className={TOP_NAV_ACCOUNT_CART_PILL_DIVIDER} aria-hidden />
        <LoggedInAccountHoverMenu
          rootClassName={accountHoverRootDiamondUserRightClass}
          triggerClassName={`${TOP_NAV_ACCOUNT_CART_PILL_CELL} rounded-r-full px-2.5`}
        >
          <CapsuleUserGlyph />
        </LoggedInAccountHoverMenu>
      </div>
    );
  }

  return (
    <div className={`${TOP_NAV_ACCOUNT_CART_PILL_OUTER} ${TOP_NAV_ACCOUNT_CART_PILL_TRIPLE_LAYOUT}`}>
      {paymentLink}
      <div className={TOP_NAV_ACCOUNT_CART_PILL_DIVIDER} aria-hidden />
      <LoggedInAccountHoverMenu
        rootClassName={accountHoverRootTripleMidClass}
        triggerClassName={capsuleSegmentUserMidClass}
      >
        <CapsuleUserGlyph />
      </LoggedInAccountHoverMenu>
      <div className={TOP_NAV_ACCOUNT_CART_PILL_DIVIDER} aria-hidden />
      <Link href="/cart" className={capsuleSegmentCartClass} aria-label="장바구니">
        <CapsuleCartGlyph />
      </Link>
    </div>
  );
}
