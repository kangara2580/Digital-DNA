"use client";

import { PencilLine } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

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
    <div className="w-full rounded-xl border border-white/10 bg-black/20 p-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          판매 피드 소개
        </p>
        {isOwner ? (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-zinc-300 transition hover:border-reels-cyan/45 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700"
            aria-label="소개글 수정"
            title="소개글 수정"
          >
            <PencilLine className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {editing && isOwner ? (
        <div className="mt-2">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 240))}
            rows={3}
            className="w-full resize-none rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-[13px] text-zinc-100 outline-none focus:border-reels-cyan/45 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
            placeholder="내 판매 피드 소개를 적어보세요."
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              {bio.trim().length}/240
            </p>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="rounded-full bg-reels-cyan/20 px-3 py-1.5 text-[12px] font-bold text-reels-cyan transition hover:bg-reels-cyan/30 disabled:opacity-50"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 min-h-[3.25rem] whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
          {helpText}
        </p>
      )}
    </div>
  );
}
