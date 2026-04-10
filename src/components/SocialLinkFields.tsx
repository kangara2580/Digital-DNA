"use client";

import { Link2, Plus, Trash2 } from "lucide-react";
import { parseSocialReelsUrl } from "@/lib/socialReelsUrl";

const INPUT_CLS =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[14px] text-zinc-100 outline-none transition focus:border-reels-cyan/45 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-[#24163b]";

const MAX_LINKS = 20;

function platformLabel(url: string): string | null {
  const t = url.trim();
  if (!t) return null;
  const p = parseSocialReelsUrl(t);
  if (!p) return null;
  switch (p.platform) {
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "youtube":
      return "YouTube";
    default:
      return "기타 링크";
  }
}

type Props = {
  links: string[];
  onChange: (next: string[]) => void;
};

/**
 * SNS·영상 플랫폼 URL 여러 개 — 링크 추가/삭제
 */
export function SocialLinkFields({ links, onChange }: Props) {
  const setAt = (index: number, value: string) => {
    const next = [...links];
    next[index] = value;
    onChange(next);
  };

  const add = () => {
    if (links.length >= MAX_LINKS) return;
    onChange([...links, ""]);
  };

  const remove = (index: number) => {
    if (links.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {links.map((url, i) => {
        const label = platformLabel(url);
        return (
          <div
            key={i}
            className="rounded-lg border border-white/10 p-3 [html[data-theme='light']_&]:border-black/10"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-2">
              <div className="min-w-0 flex-1">
                <p className="inline-flex flex-wrap items-center gap-1.5 text-[13px] font-semibold">
                  <Link2 className="h-4 w-4 shrink-0" />
                  링크 {i + 1}
                  {label ? (
                    <span className="rounded-full border border-reels-cyan/35 bg-reels-cyan/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-reels-cyan">
                      {label}
                    </span>
                  ) : null}
                </p>
                <input
                  className={`${INPUT_CLS} mt-2`}
                  placeholder="Instagram 릴스, TikTok, YouTube(Shorts/일반), 채널 등 공개 URL"
                  value={url}
                  onChange={(e) => setAt(i, e.target.value)}
                  inputMode="url"
                  autoComplete="url"
                />
              </div>
              {links.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-[12px] font-semibold text-zinc-300 transition hover:border-reels-crimson/35 hover:bg-reels-crimson/10 hover:text-zinc-100 [html[data-theme='light']_&]:border-black/10 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-700"
                  aria-label={`링크 ${i + 1} 삭제`}
                >
                  <Trash2 className="h-4 w-4" />
                  삭제
                </button>
              ) : null}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        disabled={links.length >= MAX_LINKS}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-reels-cyan/40 bg-reels-cyan/5 px-4 py-3 text-[13px] font-bold text-reels-cyan transition hover:border-reels-cyan/60 hover:bg-reels-cyan/10 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        링크 추가
        <span className="text-[11px] font-medium text-zinc-500">
          ({links.length}/{MAX_LINKS})
        </span>
      </button>
    </div>
  );
}
