"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Props = {
  triggerClassName: string;
  children: ReactNode;
  "aria-label"?: string;
  /** 캡슐 첫 칸 등 루트 정렬 재정의 (기본: 우측 정렬 헤더 아이콘) */
  rootClassName?: string;
};

const menuPanelInner =
  "overflow-hidden rounded-xl border border-white/[0.16] bg-[rgba(5,8,14,0.96)] py-1 shadow-[0_14px_42px_-12px_rgba(0,0,0,0.75)] backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)]";

const menuItemMyPage =
  "block px-3.5 py-2.5 text-left text-[13px] font-semibold text-zinc-100 transition-colors hover:bg-white/[0.08] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100";

const menuItemLogout =
  "flex w-full px-3.5 py-2.5 text-left text-[13px] font-semibold text-rose-200/95 transition-colors hover:bg-white/[0.08] disabled:opacity-50 [html[data-theme='light']_&]:text-rose-700 [html[data-theme='light']_&]:hover:bg-zinc-100";

/** 로그인 전용 — 상단 헤더 프로필 호버 시 마이페이지·로그아웃 */
export function LoggedInAccountHoverMenu({
  triggerClassName,
  children,
  "aria-label": ariaLabel = "계정 메뉴",
  rootClassName,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  const onMypage = pathname.startsWith("/mypage");

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
    router.replace("/login?logged_out=1");
    router.refresh();
  }, [router]);

  const menuPositionClass =
    "pointer-events-none invisible absolute right-0 top-full z-[220] min-w-[10.5rem] pt-2 opacity-0 transition-[opacity,visibility] duration-150 ease-out motion-reduce:transition-none group-hover/acctmenu:pointer-events-auto group-hover/acctmenu:visible group-hover/acctmenu:opacity-100 group-focus-within/acctmenu:pointer-events-auto group-focus-within/acctmenu:visible group-focus-within/acctmenu:opacity-100";

  const rootAlign =
    rootClassName ??
    "group/acctmenu relative inline-flex shrink-0 flex-col items-end";

  return (
    <div className={rootAlign}>
      <button
        type="button"
        className={triggerClassName}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-current={onMypage ? "page" : undefined}
      >
        {children}
      </button>

      <div role="menu" aria-label="계정" className={menuPositionClass}>
        <div className={menuPanelInner}>
          <Link href="/mypage" role="menuitem" className={menuItemMyPage}>
            마이페이지
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => void onLogout()}
            disabled={busy}
            className={menuItemLogout}
          >
            {busy ? "처리 중…" : "로그아웃"}
          </button>
        </div>
      </div>
    </div>
  );
}
