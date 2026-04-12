"use client";

import Image from "next/image";
import { ImagePlus, Sparkles } from "lucide-react";
import { useCallback, useId, useRef } from "react";
import {
  BEST_REVIEW_AVATAR_PRESETS,
  buildNotionistsAvatarUrl,
  DEFAULT_BEST_REVIEW_AVATAR_SEED,
} from "@/data/reelsAvatarPresets";
import type { ProfileAvatar } from "@/lib/profileAvatarStorage";
import { PROFILE_AVATAR_UPLOAD_MAX_CHARS } from "@/lib/profileAvatarStorage";

function fileToSquareJpegDataUrl(file: File, maxSide: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const run = async () => {
      const bitmap = await createImageBitmap(file);
      try {
        const w = bitmap.width;
        const h = bitmap.height;
        const scale = Math.min(1, maxSide / Math.max(w, h));
        const tw = Math.max(1, Math.round(w * scale));
        const th = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("2d");
        ctx.drawImage(bitmap, 0, 0, tw, th);
        let q = 0.9;
        let dataUrl = canvas.toDataURL("image/jpeg", q);
        while (dataUrl.length > PROFILE_AVATAR_UPLOAD_MAX_CHARS && q > 0.45) {
          q -= 0.08;
          dataUrl = canvas.toDataURL("image/jpeg", q);
        }
        if (dataUrl.length > PROFILE_AVATAR_UPLOAD_MAX_CHARS) {
          throw new Error("too_large");
        }
        resolve(dataUrl);
      } finally {
        bitmap.close();
      }
    };
    void run().catch(reject);
  });
}

type Props = {
  value: ProfileAvatar | null;
  onChange: (next: ProfileAvatar | null) => void;
  /** 회원가입 / 마이페이지 등 짧은 부연 */
  hint?: string;
};

export function ProfileAvatarPicker({ value, onChange, hint }: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const previewUrl =
    value == null
      ? buildNotionistsAvatarUrl(DEFAULT_BEST_REVIEW_AVATAR_SEED)
      : value.kind === "preset"
        ? buildNotionistsAvatarUrl(value.seed)
        : value.dataUrl;

  const selectPreset = useCallback(
    (seed: string) => {
      onChange({ kind: "preset", seed });
    },
    [onChange],
  );

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;
      try {
        const dataUrl = await fileToSquareJpegDataUrl(file, 512);
        onChange({ kind: "upload", dataUrl });
      } catch (err) {
        if (err instanceof Error && err.message === "too_large") {
          window.alert("이미지 용량이 커서 저장할 수 없어요. 더 작은 사진을 선택해 주세요.");
        } else if (err instanceof Error && err.message !== "too_large") {
          window.alert("이미지를 불러오지 못했어요. 다른 파일을 시도해 주세요.");
        }
        onChange({ kind: "preset", seed: DEFAULT_BEST_REVIEW_AVATAR_SEED });
      }
    },
    [onChange],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-reels-cyan/35 bg-black/30 shadow-lg ring-4 ring-reels-cyan/10 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:ring-reels-cyan/15 sm:h-28 sm:w-28">
            {value?.kind === "upload" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={previewUrl}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            )}
          </div>
          <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-reels-cyan/25 text-reels-cyan shadow-md backdrop-blur-sm">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[13px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            프로필 이미지
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {hint ??
              "오늘의 베스트 구매평과 같은 스타일의 기본 캐릭터를 고르거나, 본인 사진을 올려도 돼요. 기본 프로필도 충분히 트렌디합니다."}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-[12px] font-bold text-zinc-200 transition hover:border-reels-cyan/40 hover:bg-reels-cyan/10 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
            >
              <ImagePlus className="h-4 w-4 text-reels-cyan" aria-hidden />
              내 사진 올리기
            </button>
            <input
              ref={fileRef}
              id={inputId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onFile}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          베스트 구매평 스타일 · 기본 프로필
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 [-webkit-overflow-scrolling:touch]">
          {BEST_REVIEW_AVATAR_PRESETS.map((p) => {
            const active =
              value?.kind === "preset" && value.seed === p.seed;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPreset(p.seed)}
                title={p.label}
                className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 transition ${
                  active
                    ? "border-reels-cyan shadow-[0_0_0_3px_rgba(0,242,234,0.25)]"
                    : "border-white/10 opacity-90 hover:border-reels-cyan/50 hover:opacity-100 [html[data-theme='light']_&]:border-zinc-200"
                }`}
              >
                <Image
                  src={buildNotionistsAvatarUrl(p.seed)}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
