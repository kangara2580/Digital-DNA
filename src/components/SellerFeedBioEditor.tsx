"use client";

import { PencilLine } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { MYPAGE_OUTLINE_BTN_CORE } from "@/lib/mypageOutlineCta";

type Props = {
  sellerId: string;
  initialBio: string | null;
};

export function SellerFeedBioEditor({ sellerId, initialBio }: Props) {
  const { user } = useAuthSession();
  const isOwner = user?.id === sellerId;
  const [bio, setBio] = useState(initialBio ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const helpText = useMemo(() => {
    if (bio.trim()) return bio;
    return "이 판매자의 피드 소개가 아직 없어요.";
  }, [bio]);

  const save = async () => {
    if (!isOwner || saving) return;
    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data.session?.access_token;
      if (!token) {
        window.alert("로그인 후 수정할 수 있어요.");
        return;
      }
      const res = await fetch("/api/sellers/feed-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sellerBio: bio }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !body.ok) {
        window.alert("소개글 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-bold tracking-wide text-[color:var(--reels-point)]">
          판매 피드 소개
        </p>
        {isOwner ? (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/18 bg-white/[0.06] text-white/75 transition hover:border-[color:var(--reels-point)]/45 hover:bg-[color:var(--reels-point)]/10 hover:text-[color:var(--reels-point)] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-[color:var(--reels-point)]/40"
            aria-label="소개글 수정"
            title="소개글 수정"
          >
            <PencilLine className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {editing && isOwner ? (
        <div className="mt-3">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 240))}
            rows={3}
            className="w-full resize-none rounded-xl border border-white/14 bg-black/35 px-3.5 py-2.5 text-[13px] leading-relaxed text-white/[0.95] outline-none ring-0 transition placeholder:text-white/35 focus:border-[color:var(--reels-point)]/45 focus:ring-1 focus:ring-[color:var(--reels-point)]/35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:placeholder:text-zinc-400"
            placeholder="내 판매 피드 소개를 적어보세요."
          />
          <div className="mt-2.5 flex items-center justify-between">
            <p className="text-[11px] font-medium text-white/40 [html[data-theme='light']_&]:text-zinc-500">
              {bio.trim().length}/240
            </p>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className={`${MYPAGE_OUTLINE_BTN_CORE} px-4 py-1.5 text-[12px] disabled:pointer-events-none disabled:opacity-50`}
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2.5 min-h-[3.25rem] whitespace-pre-wrap text-[13px] leading-relaxed text-white/[0.78] [html[data-theme='light']_&]:text-zinc-700">
          {helpText}
        </p>
      )}
    </div>
  );
}
