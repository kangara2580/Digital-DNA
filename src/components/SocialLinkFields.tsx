"use client";

import { Link2, Plus, Trash2 } from "lucide-react";
import { SellerSocialPlatformIcon } from "@/components/SellerSocialPlatformIcon";
import {
  getSellerSocialPlatformFromInput,
  type SellerSocialPlatform,
} from "@/lib/sellerSocialLinks";
import { useTranslation } from "@/hooks/useTranslation";

const INPUT_CLS =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[14px] text-zinc-100 outline-none transition focus:border-reels-crimson/45 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-[#24163b]";

const MAX_LINKS = 20;

function usePlatformLabel() {
  const { t } = useTranslation();
  return (platform: SellerSocialPlatform): string => {
    switch (platform) {
      case "tiktok":
        return "TikTok";
      case "instagram":
        return "Instagram";
      case "youtube":
        return "YouTube";
      case "twitter":
        return "X";
      default:
        return t("socialLinks.other");
    }
  };
}

type Props = {
  links: string[];
  onChange: (next: string[]) => void;
  errors?: string[];
  placeholder?: string;
};

/**
 * SNS·영상 플랫폼 URL 여러 개 — 링크 추가/삭제
 */
export function SocialLinkFields({
  links,
  onChange,
  errors = [],
  placeholder,
}: Props) {
  const { t } = useTranslation();
  const platformLabel = usePlatformLabel();
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
        const platform = getSellerSocialPlatformFromInput(url);
        const label = platform ? platformLabel(platform) : null;
        return (
          <div
            key={i}
            className="rounded-lg border border-white/10 p-3 [html[data-theme='light']_&]:border-black/10"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-2">
              <div className="min-w-0 flex-1">
                <p className="inline-flex flex-wrap items-center gap-1.5 text-[13px] font-semibold">
                  <Link2 className="h-4 w-4 shrink-0" />
                  {t("socialLinks.linkN", { n: i + 1 })}
                  {label && platform ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-reels-crimson/35 bg-reels-crimson/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-reels-crimson">
                      <SellerSocialPlatformIcon
                        platform={platform}
                        className="h-3 w-3 shrink-0"
                      />
                      {label}
                    </span>
                  ) : null}
                </p>
                <input
                  className={`${INPUT_CLS} mt-2`}
                  placeholder={
                    placeholder ?? t("socialLinks.placeholderLong")
                  }
                  value={url}
                  onChange={(e) => setAt(i, e.target.value)}
                  inputMode="url"
                  autoComplete="url"
                />
                {errors[i] ? (
                  <p className="mt-1.5 text-[12px] font-semibold text-reels-crimson/95 [html[data-theme='light']_&]:text-reels-crimson">
                    {errors[i]}
                  </p>
                ) : null}
              </div>
              {links.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-[12px] font-semibold text-zinc-300 transition hover:border-reels-crimson/35 hover:bg-reels-crimson/10 hover:text-zinc-100 [html[data-theme='light']_&]:border-black/10 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-700"
                  aria-label={t("socialLinks.removeAria", { n: i + 1 })}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("socialLinks.remove")}
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-reels-crimson/40 bg-reels-crimson/5 px-4 py-3 text-[13px] font-bold text-reels-crimson transition hover:border-reels-crimson/60 hover:bg-reels-crimson/10 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        {t("socialLinks.add")}
        <span className="text-[11px] font-medium text-zinc-500">
          ({links.length}/{MAX_LINKS})
        </span>
      </button>
    </div>
  );
}
