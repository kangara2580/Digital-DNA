"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState, type ReactNode } from "react";
import { LayoutGrid, LogOut, Settings, UserRound } from "lucide-react";
import { PaymentDiamondIcon } from "@/components/PaymentDiamondIcon";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Props = {
  triggerClassName: string;
  children: ReactNode;
  "aria-label"?: string;
  /** 캡슐 첫 칸 등 루트 정렬 재정의 (기본: 우측 정렬 헤더 아이콘) */
  rootClassName?: string;
};

const menuPanelInner =
  "w-max min-w-[12.5rem] overflow-hidden rounded-2xl border border-white/[0.16] bg-[rgba(5,8,14,0.96)] py-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.75)] backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[0_14px_44px_-16px_rgba(0,0,0,0.14)]";

const menuItemLink =
  "flex items-center gap-3.5 whitespace-nowrap px-5 py-3.5 text-left text-[15px] font-semibold leading-snug text-zinc-100 transition-colors hover:bg-white/[0.08] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100";

const menuItemLogout =
  "flex w-full items-center gap-3.5 whitespace-nowrap px-5 py-3.5 text-left text-[15px] font-semibold leading-snug text-zinc-100 transition-colors hover:bg-white/[0.08] disabled:opacity-50 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100";

const menuIconClass = "h-[21px] w-[21px] shrink-0 opacity-70";
type InnerProps = Props & {
  /** `/mypage?tab=` 값 — Next 15에서 `useSearchParams`는 Suspense 경계 안에서만 씀 */
  mypageQueryTab: string;
};

function LoggedInAccountHoverMenuInner({
  triggerClassName,
  children,
  "aria-label": ariaLabelProp,
  rootClassName,
  mypageQueryTab,
}: InnerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthSession();
  const { t } = useTranslation();
  const ariaLabel = ariaLabelProp ?? t("account.hoverMenu.aria");
  const [busy, setBusy] = useState(false);

  const onMyFeed =
    Boolean(user?.id) &&
    (pathname === `/seller/${user!.id}` || pathname === `/seller/${encodeURIComponent(user!.id)}`);
  const onMypageHub = pathname.startsWith("/mypage") && mypageQueryTab === "";
  const onSettings = pathname === "/settings" || pathname.startsWith("/settings/");
  const onAssets = pathname === "/assets" || pathname.startsWith("/assets/");

  const myFeedHref =
    user?.id != null && user.id.length > 0
      ? `/seller/${encodeURIComponent(user.id)}`
      : "/mypage";

  const onLogout = useCallback(async () => {
    setBusy(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase.auth.signOut({ scope: "global" });
      }
    } finally {
      setBusy(false);
    }
    router.replace("/");
    router.refresh();
  }, [router]);

  const menuPositionClass =
    "pointer-events-none invisible absolute right-0 top-full z-[240] min-w-0 w-max pt-2.5 opacity-0 transition-[opacity,visibility] duration-150 ease-out motion-reduce:transition-none group-hover/acctmenu:pointer-events-auto group-hover/acctmenu:visible group-hover/acctmenu:opacity-100 group-focus-within/acctmenu:pointer-events-auto group-focus-within/acctmenu:visible group-focus-within/acctmenu:opacity-100";

  const rootAlign =
    rootClassName ?? "group/acctmenu relative inline-flex shrink-0 flex-col items-end";

  return (
    <div className={rootAlign}>
      <Link
        href={myFeedHref}
        className={triggerClassName}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-current={onMyFeed ? "page" : undefined}
        title={t("account.feed")}
      >
        {children}
      </Link>

      <div role="menu" aria-label={t("account.menu.aria")} className={menuPositionClass}>
        <div className={menuPanelInner}>
          <Link
            href={myFeedHref}
            role="menuitem"
            className={menuItemLink}
            aria-current={onMyFeed ? "page" : undefined}
          >
            <UserRound className={menuIconClass} strokeWidth={2} aria-hidden />
            {t("account.feed")}
          </Link>
          <Link
            href="/mypage"
            role="menuitem"
            className={menuItemLink}
            aria-current={onMypageHub ? "page" : undefined}
          >
            <LayoutGrid className={menuIconClass} strokeWidth={2} aria-hidden />
            {t("account.mypage")}
          </Link>
          <Link
            href="/assets"
            role="menuitem"
            className={menuItemLink}
            aria-current={onAssets ? "page" : undefined}
          >
            <PaymentDiamondIcon className={`${menuIconClass} text-[color:var(--reels-point)]`} aria-hidden />
            {t("account.assets")}
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            className={menuItemLink}
            aria-current={onSettings ? "page" : undefined}
          >
            <Settings className={menuIconClass} strokeWidth={2} aria-hidden />
            {t("account.settings")}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => void onLogout()}
            disabled={busy}
            className={menuItemLogout}
          >
            <LogOut className={menuIconClass} strokeWidth={2} aria-hidden />
            {busy ? t("account.logoutBusy") : t("account.logout")}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoggedInAccountHoverSearchParamsBinder(props: Props) {
  const searchParams = useSearchParams();
  const mypageQueryTab = searchParams?.get("tab") ?? "";
  return <LoggedInAccountHoverMenuInner {...props} mypageQueryTab={mypageQueryTab} />;
}

/** 로그인 전용 — 프로필 호버: 내 피드 · 마이페이지 · 설정 · 로그아웃 */
export function LoggedInAccountHoverMenu(props: Props) {
  return (
    <Suspense fallback={<LoggedInAccountHoverMenuInner {...props} mypageQueryTab="" />}>
      <LoggedInAccountHoverSearchParamsBinder {...props} />
    </Suspense>
  );
}
