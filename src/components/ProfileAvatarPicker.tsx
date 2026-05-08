"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  DEFAULT_ARA_DOT_PRESET_SEED,
} from "@/lib/pixelAvatarSprite";
import type { ProfileAvatar } from "@/lib/profileAvatarStorage";
import {
  getProfileAvatarPixelPreview,
  PROFILE_AVATAR_UPLOAD_MAX_CHARS,
} from "@/lib/profileAvatarStorage";

const AVATAR_FRAME =
  "border border-zinc-300/75 [html[data-theme='light']_&]:border-zinc-400";

const PILL =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] font-semibold text-zinc-200 transition hover:border-white/28 hover:bg-white/[0.1] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:border-zinc-300 [html[data-theme='light']_&]:hover:bg-zinc-200/70";

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

export type ProfileAvatarPickerDensity = "compact" | "comfortable";

type Props = {
  value: ProfileAvatar | null;
  onChange: (next: ProfileAvatar | null) => void;
  hint?: string;
  density?: ProfileAvatarPickerDensity;
};

export function ProfileAvatarPicker({ value, onChange, hint, density = "compact" }: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewReady, setPreviewReady] = useState(false);

  useEffect(() => {
    setPreviewReady(true);
  }, []);

  const pixelPreview = useMemo(
    () => getProfileAvatarPixelPreview(value, DEFAULT_ARA_DOT_PRESET_SEED),
    [value],
  );

  const presetLocked = value?.kind === "upload";

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
        onChange({ kind: "preset", seed: DEFAULT_ARA_DOT_PRESET_SEED });
      }
    },
    [onChange],
  );

  const isComfortable = density === "comfortable";

  const previewBlock = (sizeCls: string) => (
    <div className={`relative mx-auto shrink-0 sm:mx-0 ${sizeCls}`}>
      <div className={`relative overflow-hidden rounded-full bg-black/30 [html[data-theme='light']_&]:bg-white ${AVATAR_FRAME} aspect-square ${sizeCls}`}>
        {!previewReady ? (
          <div
            className="h-full w-full animate-pulse bg-zinc-600/35 [html[data-theme='light']_&]:bg-zinc-300/50"
            aria-hidden
          />
        ) : pixelPreview.type === "upload" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pixelPreview.src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full rounded-full bg-black" />
        )}
      </div>
    </div>
  );

  const actionsBlock = (
    <div className="min-w-0 w-full">
      <p
        className={
          isComfortable
            ? "text-center text-[16px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-left"
            : "text-center text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-left"
        }
      >
        프로필 이미지
      </p>
      {hint ? (
        <p
          className={
            isComfortable
              ? "mt-1 text-center text-[14px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-left"
              : "mt-1 text-center text-[14px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-left"
          }
        >
          {hint}
        </p>
      ) : null}
      <div
        className={
          isComfortable
            ? "mt-7 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start"
            : "mt-7 flex flex-wrap items-center justify-center gap-2 sm:justify-start"
        }
      >
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={
            isComfortable
              ? `${PILL} px-3.5 py-2.5 text-[15px] font-bold`
              : `${PILL} gap-1.5 px-3 py-2 text-[14px] font-bold`
          }
        >
          <ImagePlus className="h-4 w-4 text-zinc-300 [html[data-theme='light']_&]:text-zinc-600" aria-hidden />
          이미지 올리기
        </button>
        <input ref={fileRef} id={inputId} type="file" accept="image/*" className="sr-only" onChange={onFile} />
        <button
          type="button"
          aria-label="기본 이미지로 되돌리기"
          disabled={!presetLocked}
          className={`${PILL} h-[42px] w-[42px] p-0 disabled:pointer-events-none disabled:opacity-40`}
          onClick={() => onChange({ kind: "preset", seed: DEFAULT_ARA_DOT_PRESET_SEED })}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );

  if (isComfortable) {
    return (
      <div className="grid h-full grid-cols-1 gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-7 sm:gap-y-5">
        {previewBlock("h-32 w-32 sm:h-36 sm:w-36")}
        {actionsBlock}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
      {previewBlock("h-24 w-24 sm:h-28 sm:w-28")}
      <div className="min-w-0 w-full flex-1">
        {actionsBlock}
      </div>
    </div>
  );
}
