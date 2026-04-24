"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  getProfileAvatarDisplayUrl,
  resolveProfileAvatar,
} from "@/lib/profileAvatarStorage";

type Props = {
  compact: boolean;
};

export function MainTopUserMenu({ compact }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuthSession();
  const [busy, setBusy] = useState(false);

  const onLogout = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    try {
      await supabase.auth.signOut({ scope: "global" });
    } finally {
      setBusy(false);
    }
    router.replace("/login?logged_out=1");
    router.refresh();
  }, [router]);

  if (pathname !== "/" || loading || !user) return null;

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const nickname =
    typeof meta?.nickname === "string" ? meta.nickname.trim() : "";
  const email = user.email ?? "";
  const localPart = email.includes("@") ? email.split("@")[0]! : email || "회원";
  const greetName = nickname || localPart;

  const avatar = resolveProfileAvatar(user);
  const avatarSrc = getProfileAvatarDisplayUrl(
    avatar,
    typeof user.id === "string" ? user.id : "reels-market",
  );

  return (
    <div
      className={`flex min-w-0 shrink-0 items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] py-1 pl-1 pr-1 shadow-[0_0_20px_-8px_rgba(0,242,234,0.35)] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.12)] ${
        compact ? "max-w-[min(52vw,14rem)]" : "max-w-[min(90vw,20rem)]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarSrc}
        alt=""
        className={`shrink-0 rounded-full border border-white/20 bg-black/30 object-cover [html[data-theme='light']_&]:border-zinc-200 ${
          compact ? "h-7 w-7" : "h-9 w-9"
        }`}
      />
      <div className="min-w-0 flex-1 leading-tight">
        <p
          className={`truncate font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 ${
            compact ? "text-[11px]" : "text-[12px] sm:text-[13px]"
          }`}
        >
          {greetName}님
        </p>
        <p
          className={`truncate text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 ${
            compact ? "hidden" : "text-[10px] sm:text-[11px]"
          }`}
        >
          {email}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void onLogout()}
        disabled={busy}
        className="shrink-0 rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold tracking-tight text-zinc-300 transition hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-100 disabled:opacity-50 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-rose-300 [html[data-theme='light']_&]:hover:bg-rose-50 [html[data-theme='light']_&]:hover:text-rose-800"
      >
        {busy ? "…" : "로그아웃"}
      </button>
    </div>
  );
}
