"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { ProfileColorAvatar } from "@/components/ProfileColorAvatar";
import { ProfileColorSpectrumSlider } from "@/components/ProfileColorSpectrumSlider";
import { useReelsConfirm } from "@/components/ReelsConfirmProvider";
import { useTranslation } from "@/hooks/useTranslation";
import type { ProfileAvatar } from "@/lib/profileAvatarStorage";
import {
  PROFILE_AVATAR_TARGET_CHARS,
  PROFILE_AVATAR_UPLOAD_MAX_CHARS,
} from "@/lib/profileAvatarStorage";
import {
  normalizeProfileColorHex,
  profileColorFromSeed,
} from "@/lib/profileColorSpectrum";

export type ProfileColorPickerDensity = "compact" | "comfortable";

type Props = {
  value: ProfileAvatar | null;
  onChange: (next: ProfileAvatar) => void;
  density?: ProfileColorPickerDensity;
  className?: string;
};

const AVATAR_FRAME =
  "ring-2 ring-white/20 ring-offset-2 ring-offset-transparent [html[data-theme='light']_&]:ring-zinc-200/90 [html[data-theme='light']_&]:ring-offset-white";

const PILL =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] font-semibold text-zinc-200 transition hover:border-white/28 hover:bg-white/[0.1] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:border-zinc-300 [html[data-theme='light']_&]:hover:bg-zinc-200/70";

function encodeJpegUnderLimit(
  bitmap: ImageBitmap,
  maxSide: number,
): string | null {
  const w = bitmap.width;
  const h = bitmap.height;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, tw, th);

  let best = "";
  for (let q = 0.88; q >= 0.32; q -= 0.08) {
    const dataUrl = canvas.toDataURL("image/jpeg", q);
    if (dataUrl.length <= PROFILE_AVATAR_TARGET_CHARS) {
      return dataUrl;
    }
    if (
      dataUrl.length <= PROFILE_AVATAR_UPLOAD_MAX_CHARS &&
      (!best || dataUrl.length < best.length)
    ) {
      best = dataUrl;
    }
  }
  return best || null;
}

/** 2MB+ 원본도 프로필용으로 축소·JPEG 압축 (화면은 작아 400px 이하로 충분) */
function fileToSquareJpegDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const run = async () => {
      const bitmap = await createImageBitmap(file);
      try {
        for (const maxSide of [400, 320, 256, 192, 160]) {
          const dataUrl = encodeJpegUnderLimit(bitmap, maxSide);
          if (dataUrl) {
            resolve(dataUrl);
            return;
          }
        }
        throw new Error("too_large");
      } finally {
        bitmap.close();
      }
    };
    void run().catch(reject);
  });
}

export function ProfileColorPicker({
  value,
  onChange,
  density = "compact",
  className = "",
}: Props) {
  const { t } = useTranslation();
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const reelsConfirm = useReelsConfirm();

  const selectedHex = useMemo(() => {
    if (value?.kind === "color") {
      const n = normalizeProfileColorHex(value.hex);
      if (n) return n;
    }
    return profileColorFromSeed("reels-market");
  }, [value]);

  const isUpload = value?.kind === "upload";
  const isComfortable = density === "comfortable";
  const previewSize = isComfortable ? "h-32 w-32" : "h-24 w-24 sm:h-28 sm:w-28";

  const applyColorChange = useCallback(
    (hex: string) => {
      const normalized = normalizeProfileColorHex(hex);
      if (!normalized) return;
      onChange({ kind: "color", hex: normalized });
    },
    [onChange],
  );

  const onSpectrumColorChange = useCallback(
    async (hex: string) => {
      if (value?.kind === "upload") {
        const ok = await reelsConfirm({
          message: t("avatar.confirmReplaceImageMessage"),
          confirmLabel: t("avatar.confirmReplaceYes"),
          cancelLabel: t("avatar.confirmReplaceNo"),
          dialogAriaLabel: t("common.confirmDialogAria"),
        });
        if (!ok) return;
      }
      applyColorChange(hex);
    },
    [applyColorChange, reelsConfirm, t, value?.kind],
  );

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;
      try {
        const dataUrl = await fileToSquareJpegDataUrl(file);
        onChange({ kind: "upload", dataUrl });
      } catch (err) {
        if (err instanceof Error && err.message === "too_large") {
          window.alert(t("avatar.alertTooLarge"));
        } else if (err instanceof Error && err.message !== "too_large") {
          window.alert(t("avatar.alertLoadFail"));
        }
        onChange({ kind: "color", hex: selectedHex });
      }
    },
    [onChange, selectedHex, t],
  );

  const preview = isUpload ? (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-black/30 ${AVATAR_FRAME} ${previewSize}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={value.dataUrl} alt="" className="h-full w-full object-cover" />
    </div>
  ) : (
    <ProfileColorAvatar
      hex={selectedHex}
      sizeClass={previewSize}
      className={`shrink-0 ${AVATAR_FRAME}`}
      label="프로필 색상 미리보기"
    />
  );

  return (
    <div
      className={`flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5 ${className}`}
    >
      {preview}
      <div className="min-w-0 flex-1 sm:max-w-[min(100%,22rem)]">
        <p
          className={
            isComfortable
              ? "text-[16px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
              : "text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
          }
        >
          프로필 색상
        </p>
        <ProfileColorSpectrumSlider
          className="mt-3 w-full"
          valueHex={selectedHex}
          onChange={onSpectrumColorChange}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`${PILL} px-3.5 py-2.5 text-[14px] font-bold`}
          >
            <ImagePlus
              className="h-4 w-4 text-zinc-300 [html[data-theme='light']_&]:text-zinc-600"
              aria-hidden
            />
            {t("avatar.upload")}
          </button>
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onFile}
          />
          <button
            type="button"
            aria-label="업로드한 이미지 제거"
            disabled={!isUpload}
            className={`${PILL} h-[42px] w-[42px] p-0 disabled:pointer-events-none disabled:opacity-40`}
            onClick={() => onChange({ kind: "color", hex: selectedHex })}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

    </div>
  );
}
