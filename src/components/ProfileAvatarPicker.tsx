"use client";

import { ChevronLeft, ChevronRight, Dices, ImagePlus } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ProfileAvatarSprite } from "@/components/ProfileAvatarSprite";
import { DEFAULT_BEST_REVIEW_AVATAR_SEED } from "@/data/reelsAvatarPresets";
import {
  buildNotionistsCustomAvatarUrl,
  createDefaultCharacterParts,
  NOTIONISTS_BROWS,
  NOTIONISTS_BODY,
  NOTIONISTS_EYES,
  NOTIONISTS_HAIR,
  NOTIONISTS_LIPS,
  NOTIONISTS_NOSE,
  randomCharacterSeed,
  type CharacterFaceShape,
  type CharacterGender,
  type CharacterPartsV1,
} from "@/lib/notionistsCharacter";
import type { ProfileAvatar } from "@/lib/profileAvatarStorage";
import {
  getProfileAvatarPixelPreview,
  PROFILE_AVATAR_UPLOAD_MAX_CHARS,
} from "@/lib/profileAvatarStorage";

/** 미리보기 링 — 핑크 없이 글래스 톤 */
const AVATAR_FRAME =
  "border-2 border-white/30 shadow-lg ring-4 ring-white/10 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:ring-zinc-200/40";

/** 피드·카테고리 등과 맞춘 중립 캡슐 버튼 */
const PILL =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] font-semibold text-zinc-200 transition hover:border-white/28 hover:bg-white/[0.1] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:border-zinc-300 [html[data-theme='light']_&]:hover:bg-zinc-200/70";

const PANEL_SHELL =
  "rounded-xl border border-white/12 bg-gradient-to-br from-black/40 to-black/20 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:from-zinc-100/90 [html[data-theme='light']_&]:to-white";

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

function cycleInList<T extends string>(list: readonly T[], current: T, dir: -1 | 1): T {
  let i = list.indexOf(current);
  if (i < 0) i = 0;
  const idx = (i + dir + list.length) % list.length;
  return list[idx];
}

export type ProfileAvatarPickerDensity = "compact" | "comfortable";

type Props = {
  value: ProfileAvatar | null;
  onChange: (next: ProfileAvatar | null) => void;
  /** 회원가입 / 마이페이지 등 짧은 부연 */
  hint?: string;
  /** compact: 회원가입 등 좁은 레이아웃 · comfortable: 마이페이지 등 큰 미리보기 */
  density?: ProfileAvatarPickerDensity;
};

export function ProfileAvatarPicker({ value, onChange, hint, density = "compact" }: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  /** SSR과 첫 클라이언트 페인트에서 `value`/프로필 로드 타이밍 차이로 미리보기 URL이 달라질 수 있어, 마운트 후에만 이미지 src를 렌더링 */
  const [previewReady, setPreviewReady] = useState(false);

  const [parts, setParts] = useState<CharacterPartsV1>(() =>
    createDefaultCharacterParts(DEFAULT_BEST_REVIEW_AVATAR_SEED),
  );

  useEffect(() => {
    setPreviewReady(true);
  }, []);

  useEffect(() => {
    if (value?.kind === "preset") {
      setParts(createDefaultCharacterParts(value.seed));
    } else if (value?.kind === "custom") {
      setParts(value.parts);
    }
  }, [value]);

  const pixelPreview = useMemo(
    () => getProfileAvatarPixelPreview(value, DEFAULT_BEST_REVIEW_AVATAR_SEED),
    [value],
  );

  const pixelWellCls =
    pixelPreview.type === "pixel" && pixelPreview.palette === "stardust"
      ? "absolute inset-0 flex items-center justify-center overflow-hidden rounded-full bg-[#e8ecf7] ring-1 ring-[#3d4558]/18 [html[data-theme='dark']_&]:bg-[#1a1f2e] [html[data-theme='dark']_&]:ring-white/12"
      : "absolute inset-0 flex items-center justify-center overflow-hidden rounded-full bg-[#f3e8f0] ring-1 ring-[#4a3f55]/15 [html[data-theme='dark']_&]:bg-[#241c2a] [html[data-theme='dark']_&]:ring-white/10";

  const applyCustom = useCallback(
    (next: CharacterPartsV1) => {
      setParts(next);
      onChange({ kind: "custom", parts: next });
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

  const customizerDisabled = value?.kind === "upload";

  const randomize = useCallback(() => {
    const pick = <T extends string>(arr: readonly T[]) =>
      arr[Math.floor(Math.random() * arr.length)]!;
    const genders: CharacterGender[] = ["feminine", "masculine"];
    const shapes: CharacterFaceShape[] = [0, 1, 2];
    const next: CharacterPartsV1 = {
      v: 1,
      seed: randomCharacterSeed(),
      gender: pick(genders),
      hair: pick(NOTIONISTS_HAIR),
      eyes: pick(NOTIONISTS_EYES),
      nose: pick(NOTIONISTS_NOSE),
      lips: pick(NOTIONISTS_LIPS),
      brows: pick(NOTIONISTS_BROWS),
      body: pick(NOTIONISTS_BODY),
      faceShape: shapes[Math.floor(Math.random() * shapes.length)]!,
    };
    applyCustom(next);
  }, [applyCustom]);

  const isComfortable = density === "comfortable";

  if (isComfortable) {
    return (
      <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-6 sm:gap-y-4">
        <div className="relative mx-auto shrink-0 sm:mx-0">
          <div className={`relative h-32 w-32 overflow-hidden rounded-full bg-black/30 [html[data-theme='light']_&]:bg-white sm:h-36 sm:w-36 ${AVATAR_FRAME}`}
          >
            {!previewReady ? (
              <div
                className="h-full w-full animate-pulse bg-zinc-600/35 [html[data-theme='light']_&]:bg-zinc-300/50"
                aria-hidden
              />
            ) : pixelPreview.type === "upload" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pixelPreview.src}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className={pixelWellCls}>
                <div className="h-[132%] w-[132%] min-h-[8rem] min-w-[8rem] shrink-0 sm:min-h-[9rem] sm:min-w-[9rem]">
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

        <div className="min-w-0 w-full">
          <p className="text-center text-[14px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-left">
            프로필 이미지
          </p>
          {hint ? (
            <p className="mt-1 text-center text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-left">
              {hint}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap justify-center gap-2.5 sm:justify-start">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`${PILL} px-3.5 py-2.5 text-[13px] font-bold`}
            >
              <ImagePlus className="h-4 w-4 text-zinc-300 [html[data-theme='light']_&]:text-zinc-600" aria-hidden />
              이미지 올리기
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

        <div
          className={`mt-0 w-full ${PANEL_SHELL} p-3 sm:col-span-2 sm:p-4 ${
            customizerDisabled ? "opacity-50" : ""
          }`}
        >
          <div className="flex flex-col gap-2.5">
            <div className="flex min-h-[36px] items-center justify-between gap-2">
              <p className="shrink-0 text-[12px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                캐릭터 꾸미기
              </p>
              <button
                type="button"
                disabled={customizerDisabled}
                onClick={randomize}
                className={`${PILL} shrink-0 gap-1 px-2.5 py-1 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <Dices className="h-3.5 w-3.5" aria-hidden />
                랜덤
              </button>
            </div>
            <div className="flex justify-center sm:justify-start">
              <GenderHeaderToggle
                density={density}
                disabled={customizerDisabled}
                value={parts.gender}
                onChange={(gender) => applyCustom({ ...parts, gender })}
              />
            </div>
          </div>

          {customizerDisabled ? (
            <p className="mt-2 text-[11px] leading-snug text-zinc-500">
              직접 올린 사진을 쓰는 중에는 캐릭터 조합이 꺼져 있어요. 프리셋이나 조합을 쓰려면 위에서 사진 선택을 해제해 주세요.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-x-3 sm:gap-y-2">
              <CycleRow
                density={density}
                label="헤어"
                current={parts.hair}
                list={NOTIONISTS_HAIR}
                onChange={(hair) => applyCustom({ ...parts, hair })}
              />
              <CycleRow
                density={density}
                label="눈"
                current={parts.eyes}
                list={NOTIONISTS_EYES}
                onChange={(eyes) => applyCustom({ ...parts, eyes })}
              />
              <CycleRow
                density={density}
                label="코"
                current={parts.nose}
                list={NOTIONISTS_NOSE}
                onChange={(nose) => applyCustom({ ...parts, nose })}
              />
              <CycleRow
                density={density}
                label="입"
                current={parts.lips}
                list={NOTIONISTS_LIPS}
                onChange={(lips) => applyCustom({ ...parts, lips })}
              />
              <CycleRow
                density={density}
                label="눈썹"
                current={parts.brows}
                list={NOTIONISTS_BROWS}
                onChange={(brows) => applyCustom({ ...parts, brows })}
              />
              <CycleRow
                density={density}
                label="옷"
                current={parts.body}
                list={NOTIONISTS_BODY}
                onChange={(body) => applyCustom({ ...parts, body })}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4"
    >
      <div className="relative mx-auto shrink-0 sm:mx-0">
        <div
          className={`relative h-24 w-24 overflow-hidden rounded-full bg-black/30 [html[data-theme='light']_&]:bg-white sm:h-28 sm:w-28 ${AVATAR_FRAME}`}
        >
          {!previewReady ? (
            <div
              className="h-full w-full animate-pulse bg-zinc-600/35 [html[data-theme='light']_&]:bg-zinc-300/50"
              aria-hidden
            />
          ) : pixelPreview.type === "upload" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pixelPreview.src}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className={pixelWellCls}>
              <div className="h-[130%] w-[130%] min-h-[7.5rem] min-w-[7.5rem] shrink-0 sm:min-h-[8.75rem] sm:min-w-[8.75rem]">
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

      <div className="min-w-0 w-full flex-1">
        <p
          className="text-center text-[13px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-left"
        >
          프로필 이미지
        </p>
        {hint ? (
          <p className="mt-1 text-center text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-left">
            {hint}
          </p>
        ) : null}
        <div
          className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start"
        >
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`${PILL} gap-1.5 px-3 py-2 text-[12px] font-bold`}
          >
            <ImagePlus className="h-4 w-4 text-zinc-300 [html[data-theme='light']_&]:text-zinc-600" aria-hidden />
            이미지 올리기
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

        <div
          className={`mt-4 w-full ${PANEL_SHELL} p-2.5 sm:p-3 ${customizerDisabled ? "opacity-50" : ""}`}
        >
          <div className="flex min-h-[30px] items-center gap-2">
            <p className="shrink-0 text-[11px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
              캐릭터 꾸미기
            </p>
            <div className="flex min-w-0 flex-1 justify-center px-0.5">
              <GenderHeaderToggle
                density={density}
                disabled={customizerDisabled}
                value={parts.gender}
                onChange={(gender) => applyCustom({ ...parts, gender })}
              />
            </div>
            <button
              type="button"
              disabled={customizerDisabled}
              onClick={randomize}
              className={`${PILL} shrink-0 gap-1 px-2 py-0.5 text-[10px] font-bold disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <Dices className="h-3 w-3" aria-hidden />
              랜덤
            </button>
          </div>

          {customizerDisabled ? (
            <p className={`mt-2 leading-snug text-zinc-500 ${isComfortable ? "text-[11px]" : "text-[10px]"}`}>
              직접 올린 사진을 쓰는 중에는 캐릭터 조합이 꺼져 있어요. 프리셋이나 조합을 쓰려면 위에서 사진 선택을 해제해 주세요.
            </p>
          ) : (
            <div
              className="mt-2 grid grid-cols-2 gap-1 sm:gap-x-2 sm:gap-y-1"
            >
              <CycleRow
                density={density}
                label="헤어"
                current={parts.hair}
                list={NOTIONISTS_HAIR}
                onChange={(hair) => applyCustom({ ...parts, hair })}
              />
              <CycleRow
                density={density}
                label="눈"
                current={parts.eyes}
                list={NOTIONISTS_EYES}
                onChange={(eyes) => applyCustom({ ...parts, eyes })}
              />
              <CycleRow
                density={density}
                label="코"
                current={parts.nose}
                list={NOTIONISTS_NOSE}
                onChange={(nose) => applyCustom({ ...parts, nose })}
              />
              <CycleRow
                density={density}
                label="입"
                current={parts.lips}
                list={NOTIONISTS_LIPS}
                onChange={(lips) => applyCustom({ ...parts, lips })}
              />
              <CycleRow
                density={density}
                label="눈썹"
                current={parts.brows}
                list={NOTIONISTS_BROWS}
                onChange={(brows) => applyCustom({ ...parts, brows })}
              />
              <CycleRow
                density={density}
                label="옷"
                current={parts.body}
                list={NOTIONISTS_BODY}
                onChange={(body) => applyCustom({ ...parts, body })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CycleRow<T extends string>({
  density,
  label,
  current,
  list,
  onChange,
}: {
  density: ProfileAvatarPickerDensity;
  label: string;
  current: T;
  list: readonly T[];
  onChange: (next: T) => void;
}) {
  const idx = Math.max(0, list.indexOf(current));
  const isComfortable = density === "comfortable";
  return (
    <div
      className={
        isComfortable
          ? "grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-1 rounded-lg border border-white bg-black/25 px-1.5 py-1.5 sm:grid-cols-[2.4rem_minmax(0,1fr)_2.4rem] sm:px-2 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/80"
          : "flex min-w-0 items-center gap-0.5 rounded-lg border border-white bg-black/25 px-1 py-0.5 sm:gap-1 sm:px-1.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/80"
      }
    >
      <button
        type="button"
        onClick={() => onChange(cycleInList(list, current, -1))}
        className={
          isComfortable
            ? "flex h-8 w-full min-w-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-zinc-300 transition hover:border-white/35 hover:bg-white/[0.08] hover:text-zinc-100 sm:h-9 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-zinc-400"
            : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-zinc-300 transition hover:border-white/35 hover:bg-white/[0.08] hover:text-zinc-100 sm:h-7 sm:w-7 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-zinc-400"
        }
        aria-label={`${label} 이전`}
      >
        <ChevronLeft
          className={isComfortable ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-3 w-3 sm:h-3.5 sm:w-3.5"}
        />
      </button>
      {isComfortable ? (
        <div className="min-w-0 px-1 text-center">
          <p className="truncate text-[11px] font-extrabold leading-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {label}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold tabular-nums leading-tight text-zinc-500">
            {idx + 1}/{list.length}
          </p>
        </div>
      ) : (
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[9px] font-bold leading-tight text-zinc-200 [html[data-theme='light']_&]:text-zinc-900 sm:text-[10px]">
            {label}{" "}
            <span className="font-semibold tabular-nums text-zinc-500">
              {idx + 1}/{list.length}
            </span>
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange(cycleInList(list, current, 1))}
        className={
          isComfortable
            ? "flex h-8 w-full min-w-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-zinc-300 transition hover:border-white/35 hover:bg-white/[0.08] hover:text-zinc-100 sm:h-9 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-zinc-400"
            : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-zinc-300 transition hover:border-white/35 hover:bg-white/[0.08] hover:text-zinc-100 sm:h-7 sm:w-7 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-zinc-400"
        }
        aria-label={`${label} 다음`}
      >
        <ChevronRight
          className={isComfortable ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-3 w-3 sm:h-3.5 sm:w-3.5"}
        />
      </button>
    </div>
  );
}

/** 헤더 한 줄: 캐릭터 꾸미기 ↔ 가운데 정렬 */
function GenderHeaderToggle({
  density,
  value,
  onChange,
  disabled,
}: {
  density: ProfileAvatarPickerDensity;
  value: CharacterGender;
  onChange: (g: CharacterGender) => void;
  disabled?: boolean;
}) {
  const isComfortable = density === "comfortable";
  const opts: { id: CharacterGender; label: string }[] = [
    { id: "feminine", label: "여성" },
    { id: "masculine", label: "남성" },
  ];
  return (
    <div
      className={
        isComfortable
          ? "inline-flex max-w-full gap-0.5 overflow-hidden rounded-full border border-white/12 bg-black/25 p-1 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/80"
          : "inline-flex max-w-full gap-0.5 overflow-hidden rounded-full border border-white/12 bg-black/25 p-0.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/80"
      }
      role="group"
      aria-label="성별"
    >
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.id)}
          className={`rounded-full font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            isComfortable
              ? `min-w-[3rem] px-2.5 py-1.5 text-[11px] sm:min-w-[3.5rem] sm:text-[12px] ${
                  value === o.id
                    ? "border border-white/20 bg-white/[0.14] text-zinc-100 ring-1 ring-white/20 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-200 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:ring-zinc-300/60"
                    : "border border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900"
                }`
              : `min-w-[2.75rem] border px-2 py-1 text-[10px] sm:min-w-[3.25rem] ${
                  value === o.id
                    ? "border-white/20 bg-white/[0.14] text-zinc-100 ring-1 ring-white/20 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-200 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:ring-zinc-300/60"
                    : "border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200 [html[data-theme='light']_&]:border-transparent [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900"
                }`
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

