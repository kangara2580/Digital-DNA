"use client";

import Link from "next/link";
import { ShoppingCart, UserRound } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useAuthPromptModal } from "@/components/AuthPromptModalProvider";
import { LoggedInAccountHoverMenu } from "@/components/LoggedInAccountHoverMenu";
import {
  TOP_NAV_ACCOUNT_CART_PILL_CELL,
  TOP_NAV_ACCOUNT_CART_PILL_DIAMOND_USER_LAYOUT,
  TOP_NAV_ACCOUNT_CART_PILL_DIVIDER,
  TOP_NAV_ACCOUNT_CART_PILL_OUTER,
  TOP_NAV_ACCOUNT_CART_PILL_TRIPLE_LAYOUT,
  topNavHeroCapsuleGlyphIconClass,
  topNavHeroCapsulePaymentDiamondIconClass,
} from "@/lib/topNavIconRing";
import { PaymentDiamondIcon } from "@/components/PaymentDiamondIcon";
import { useTranslation } from "@/hooks/useTranslation";
import { ASSETS_CREDIT_PAYMENT } from "@/lib/assetsPaths";

/** 결제·크레딧·정산 통합 — 내 자산 */
const PAYMENT_HREF = ASSETS_CREDIT_PAYMENT;

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
  const { openAuthModal } = useAuthPromptModal();

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

  const paymentLoggedIn = (
    <Link
      href={PAYMENT_HREF}
      className={capsuleSegmentDiamondClass}
      aria-label={t("topNav.paymentAria")}
    >
      <CapsulePaymentDiamondGlyph />
    </Link>
  );

  const paymentGuest = (
    <button
      type="button"
      onClick={() => openAuthModal()}
      className={capsuleSegmentDiamondClass}
      aria-label={t("topNav.paymentAria")}
      aria-haspopup="dialog"
    >
      <CapsulePaymentDiamondGlyph />
    </button>
  );

  if (!user) {
    if (!withCart) {
      return (
        <div className={`${TOP_NAV_ACCOUNT_CART_PILL_OUTER} ${TOP_NAV_ACCOUNT_CART_PILL_DIAMOND_USER_LAYOUT}`}>
          {paymentGuest}
          <div className={TOP_NAV_ACCOUNT_CART_PILL_DIVIDER} aria-hidden />
          <button
            type="button"
            onClick={() => openAuthModal()}
            className={`${TOP_NAV_ACCOUNT_CART_PILL_CELL} rounded-r-full px-2.5`}
            aria-haspopup="dialog"
            aria-label="로그인/회원가입 시작하기"
          >
            <CapsuleUserGlyph />
          </button>
        </div>
      );
    }

    return (
      <div className={`${TOP_NAV_ACCOUNT_CART_PILL_OUTER} ${TOP_NAV_ACCOUNT_CART_PILL_TRIPLE_LAYOUT}`}>
        {paymentGuest}
        <div className={TOP_NAV_ACCOUNT_CART_PILL_DIVIDER} aria-hidden />
        <button
          type="button"
          onClick={() => openAuthModal()}
          className={capsuleSegmentUserMidClass}
          aria-haspopup="dialog"
          aria-label="로그인/회원가입 시작하기"
        >
          <CapsuleUserGlyph />
        </button>
        <div className={TOP_NAV_ACCOUNT_CART_PILL_DIVIDER} aria-hidden />
        <button
          type="button"
          onClick={() => openAuthModal()}
          className={capsuleSegmentCartClass}
          aria-label={t("meta.cart")}
          aria-haspopup="dialog"
        >
          <CapsuleCartGlyph />
        </button>
      </div>
    );
  }

  if (!withCart) {
    return (
      <div className={`${TOP_NAV_ACCOUNT_CART_PILL_OUTER} ${TOP_NAV_ACCOUNT_CART_PILL_DIAMOND_USER_LAYOUT}`}>
        {paymentLoggedIn}
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
      {paymentLoggedIn}
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
