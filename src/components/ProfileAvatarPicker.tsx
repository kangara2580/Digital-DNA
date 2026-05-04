"use client";

import { ImagePlus } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ProfileAvatarSprite } from "@/components/ProfileAvatarSprite";
import {
  ARA_DOT_PROFILE_PRESETS,
  DEFAULT_ARA_DOT_PRESET_SEED,
  getAraDotPresetByStorageSeed,
  type AraDotProfilePreset,
  type PixelAvatarPalette,
} from "@/lib/pixelAvatarSprite";
import type { ProfileAvatar } from "@/lib/profileAvatarStorage";
import {
  getProfileAvatarPixelPreview,
  PROFILE_AVATAR_UPLOAD_MAX_CHARS,
} from "@/lib/profileAvatarStorage";

const AVATAR_FRAME =
  "border-2 border-white/30 shadow-lg ring-4 ring-white/10 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:ring-zinc-200/40";

const PILL =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] font-semibold text-zinc-200 transition hover:border-white/28 hover:bg-white/[0.1] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:border-zinc-300 [html[data-theme='light']_&]:hover:bg-zinc-200/70";

const PANEL_SHELL =
  "rounded-xl border border-white/12 bg-gradient-to-br from-black/40 to-black/20 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:from-zinc-100/90 [html[data-theme='light']_&]:to-white";

function wellShellCls(palette: PixelAvatarPalette): string {
  return palette === "stardust"
    ? "flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#e8ecf7] ring-1 ring-[#3d4558]/18 [html[data-theme='dark']_&]:bg-[#1a1f2e] [html[data-theme='dark']_&]:ring-white/12"
    : "flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#f3e8f0] ring-1 ring-[#4a3f55]/15 [html[data-theme='dark']_&]:bg-[#241c2a] [html[data-theme='dark']_&]:ring-white/10";
}

function previewWellCls(palette: PixelAvatarPalette): string {
  return palette === "stardust"
    ? "absolute inset-0 flex items-center justify-center overflow-hidden rounded-full bg-[#e8ecf7] ring-1 ring-[#3d4558]/18 [html[data-theme='dark']_&]:bg-[#1a1f2e] [html[data-theme='dark']_&]:ring-white/12"
    : "absolute inset-0 flex items-center justify-center overflow-hidden rounded-full bg-[#f3e8f0] ring-1 ring-[#4a3f55]/15 [html[data-theme='dark']_&]:bg-[#241c2a] [html[data-theme='dark']_&]:ring-white/10";
}

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

  const selectedPresetSeed =
    value?.kind === "preset" && value.seed.trim()
      ? getAraDotPresetByStorageSeed(value.seed.trim())
        ? value.seed.trim()
        : undefined
      : undefined;

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

  const pickPreset = useCallback(
    (p: AraDotProfilePreset) => {
      onChange({ kind: "preset", seed: p.storageSeed });
    },
    [onChange],
  );

  const isComfortable = density === "comfortable";

  const presetGridCls = isComfortable
    ? "mt-3 grid grid-cols-4 gap-2.5 sm:grid-cols-8"
    : "mt-2.5 grid grid-cols-4 gap-2 sm:gap-2.5";

  const presetTileCls = isComfortable ? "h-14 w-14 sm:h-[3.65rem] sm:w-[3.65rem]" : "h-11 w-11 sm:h-12 sm:w-12";

  const innerSpriteScale = isComfortable ? "scale-[1.15]" : "scale-[1.12]";

  const presetPanel = (
    <div className={`w-full ${PANEL_SHELL} p-3 sm:p-3.5 ${presetLocked ? "opacity-45" : ""}`}>
      <p className="text-[11px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[12px]">
        기본 도트에서 선택
      </p>
      <p className="mt-1 text-[10px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-[11px]">
        {presetLocked
          ? "지금은 내 사진이 적용되어 있어요. 아래는 잠시 볼 수만 있어요 — 도트를 쓰려면 「기본 도트로 바꾸기」를 눌러 주세요."
          : "마음에 드는 캐릭터 하나를 고르면 프로필에 바로 반영돼요."}
      </p>
      <div className={presetGridCls} role="listbox" aria-label="기본 도트 프로필">
        {ARA_DOT_PROFILE_PRESETS.map((p) => {
          const on = selectedPresetSeed === p.storageSeed;
          return (
            <button
              key={p.storageSeed}
              type="button"
              role="option"
              aria-selected={on}
              disabled={presetLocked}
              onClick={() => pickPreset(p)}
              className={`relative shrink-0 rounded-full p-0.5 outline-none ring-offset-2 ring-offset-transparent transition focus-visible:ring-2 focus-visible:ring-white/40 [html[data-theme='light']_&]:focus-visible:ring-zinc-400 ${
                on && !presetLocked
                  ? "ring-2 ring-[#6366f1]/85 [html[data-theme='light']_&]:ring-[#818cf8]"
                  : "hover:opacity-92"
              } ${presetLocked ? "cursor-not-allowed" : "cursor-pointer"}`}
              title={p.label}
            >
              <div className={`relative overflow-hidden rounded-full ${presetTileCls} ${AVATAR_FRAME}`}>
                <div className={`${wellShellCls(p.palette)} absolute inset-0`}>
                  <div className={`flex h-[135%] w-[135%] items-center justify-center ${innerSpriteScale}`}>
                    <ProfileAvatarSprite
                      entropy={p.entropy}
                      variant={p.variant}
                      palette={p.palette}
                      alt=""
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const previewBlock = (sizeCls: string, innerMin: string) => (
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
          <div className={previewWellCls(pixelPreview.palette)}>
            <div className={`h-[132%] w-[132%] ${innerMin} shrink-0`}>
              <ProfileAvatarSprite
                entropy={pixelPreview.entropy}
                palette={pixelPreview.palette}
                variant={pixelPreview.variant}
                alt=""
                className="h-full w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const actionsBlock = (
    <div className="min-w-0 w-full">
      <p
        className={
          isComfortable
            ? "text-center text-[14px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-left"
            : "text-center text-[13px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-left"
        }
      >
        프로필 이미지
      </p>
      {hint ? (
        <p
          className={
            isComfortable
              ? "mt-1 text-center text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-left"
              : "mt-1 text-center text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-left"
          }
        >
          {hint}
        </p>
      ) : null}
      <div
        className={
          isComfortable
            ? "mt-3 flex flex-wrap justify-center gap-2.5 sm:justify-start"
            : "mt-3 flex flex-wrap justify-center gap-2 sm:justify-start"
        }
      >
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={
            isComfortable
              ? `${PILL} px-3.5 py-2.5 text-[13px] font-bold`
              : `${PILL} gap-1.5 px-3 py-2 text-[12px] font-bold`
          }
        >
          <ImagePlus className="h-4 w-4 text-zinc-300 [html[data-theme='light']_&]:text-zinc-600" aria-hidden />
          이미지 올리기
        </button>
        <input ref={fileRef} id={inputId} type="file" accept="image/*" className="sr-only" onChange={onFile} />
        {presetLocked ? (
          <button
            type="button"
            className={`${PILL} px-3 py-2 text-[12px] font-semibold`}
            onClick={() => onChange({ kind: "preset", seed: DEFAULT_ARA_DOT_PRESET_SEED })}
          >
            기본 도트로 바꾸기
          </button>
        ) : null}
      </div>
    </div>
  );

  if (isComfortable) {
    return (
      <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-6 sm:gap-y-4">
        {previewBlock("h-32 w-32 sm:h-36 sm:w-36", "min-h-[8rem] min-w-[8rem] sm:min-h-[9rem] sm:min-w-[9rem]")}
        {actionsBlock}
        <div className="sm:col-span-2">{presetPanel}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
      {previewBlock(
        "h-24 w-24 sm:h-28 sm:w-28",
        "min-h-[7.5rem] min-w-[7.5rem] shrink-0 sm:min-h-[8.75rem] sm:min-w-[8.75rem]",
      )}
      <div className="min-w-0 w-full flex-1">
        {actionsBlock}
        {presetPanel}
      </div>
    </div>
  );
}
