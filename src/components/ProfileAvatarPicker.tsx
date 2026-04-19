"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Dices, ImagePlus, Sparkles } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
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
  getProfileAvatarDisplayUrl,
  PROFILE_AVATAR_UPLOAD_MAX_CHARS,
} from "@/lib/profileAvatarStorage";

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

  const previewUrl = useMemo(
    () => getProfileAvatarDisplayUrl(value, DEFAULT_BEST_REVIEW_AVATAR_SEED),
    [value],
  );

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

  return (
    <div
      className={
        isComfortable
          ? "flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6"
          : "flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4"
      }
    >
      <div className="relative mx-auto shrink-0 sm:mx-0">
        <div
          className={
            isComfortable
              ? "relative h-32 w-32 overflow-hidden rounded-full border-2 border-reels-cyan/35 bg-black/30 shadow-lg ring-4 ring-reels-cyan/10 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:ring-reels-cyan/15 sm:h-36 sm:w-36"
              : "relative h-24 w-24 overflow-hidden rounded-full border-2 border-reels-cyan/35 bg-black/30 shadow-lg ring-4 ring-reels-cyan/10 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:ring-reels-cyan/15 sm:h-28 sm:w-28"
          }
        >
          {!previewReady ? (
            <div
              className="h-full w-full animate-pulse bg-zinc-600/35 [html[data-theme='light']_&]:bg-zinc-300/50"
              aria-hidden
            />
          ) : value?.kind === "upload" ? (
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
        <span
          className={
            isComfortable
              ? "pointer-events-none absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-reels-cyan/25 text-reels-cyan shadow-md backdrop-blur-sm sm:h-11 sm:w-11"
              : "pointer-events-none absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-reels-cyan/25 text-reels-cyan shadow-md backdrop-blur-sm"
          }
        >
          <Sparkles className={isComfortable ? "h-5 w-5 sm:h-[22px] sm:w-[22px]" : "h-4 w-4"} aria-hidden />
        </span>
      </div>

      <div className="min-w-0 w-full flex-1">
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
          <p className="mt-1 text-center text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-left">
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
                ? "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[13px] font-bold text-zinc-200 transition hover:border-reels-cyan/40 hover:bg-reels-cyan/10 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
                : "inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-[12px] font-bold text-zinc-200 transition hover:border-reels-cyan/40 hover:bg-reels-cyan/10 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
            }
          >
            <ImagePlus className="h-4 w-4 text-reels-cyan" aria-hidden />
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
          className={`mt-4 w-full rounded-xl border border-reels-cyan/20 bg-gradient-to-br from-black/40 to-black/20 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:from-zinc-100/90 [html[data-theme='light']_&]:to-white ${
            isComfortable ? "p-3 sm:p-4" : "p-2.5 sm:p-3"
          } ${customizerDisabled ? "opacity-50" : ""}`}
        >
          <div className={isComfortable ? "flex min-h-[36px] items-center gap-2" : "flex min-h-[30px] items-center gap-2"}>
            <p
              className={
                isComfortable
                  ? "shrink-0 text-[12px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
                  : "shrink-0 text-[11px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
              }
            >
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
              className={
                isComfortable
                  ? "inline-flex shrink-0 items-center gap-1 rounded-full border border-reels-cyan/35 bg-reels-cyan/12 px-2.5 py-1 text-[11px] font-bold text-reels-cyan transition hover:bg-reels-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
                  : "inline-flex shrink-0 items-center gap-1 rounded-full border border-reels-cyan/35 bg-reels-cyan/12 px-2 py-0.5 text-[10px] font-bold text-reels-cyan transition hover:bg-reels-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
              }
            >
              <Dices className={isComfortable ? "h-3.5 w-3.5" : "h-3 w-3"} aria-hidden />
              랜덤
            </button>
          </div>

          {customizerDisabled ? (
            <p className={`mt-2 leading-snug text-zinc-500 ${isComfortable ? "text-[11px]" : "text-[10px]"}`}>
              직접 올린 사진을 쓰는 중에는 캐릭터 조합이 꺼져 있어요. 프리셋이나 조합을 쓰려면 위에서 사진 선택을 해제해 주세요.
            </p>
          ) : (
            <div
              className={
                isComfortable
                  ? "mt-3 grid grid-cols-2 gap-2 sm:gap-x-3 sm:gap-y-2"
                  : "mt-2 grid grid-cols-2 gap-1 sm:gap-x-2 sm:gap-y-1"
              }
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
          ? "flex min-w-0 items-center gap-1 rounded-lg border border-white/10 bg-black/25 px-1.5 py-1 sm:gap-1.5 sm:px-2 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/80"
          : "flex min-w-0 items-center gap-0.5 rounded-lg border border-white/10 bg-black/25 px-1 py-0.5 sm:gap-1 sm:px-1.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/80"
      }
    >
      <button
        type="button"
        onClick={() => onChange(cycleInList(list, current, -1))}
        className={
          isComfortable
            ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-300 transition hover:border-reels-cyan/40 hover:text-reels-cyan sm:h-9 sm:w-9 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700"
            : "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-300 transition hover:border-reels-cyan/40 hover:text-reels-cyan sm:h-7 sm:w-7 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700"
        }
        aria-label={`${label} 이전`}
      >
        <ChevronLeft
          className={isComfortable ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-3 w-3 sm:h-3.5 sm:w-3.5"}
        />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <p
          className={
            isComfortable
              ? "truncate text-[10px] font-bold leading-tight text-zinc-200 [html[data-theme='light']_&]:text-zinc-900 sm:text-[11px]"
              : "truncate text-[9px] font-bold leading-tight text-zinc-200 [html[data-theme='light']_&]:text-zinc-900 sm:text-[10px]"
          }
        >
          {label}{" "}
          <span className="font-semibold tabular-nums text-zinc-500">
            {idx + 1}/{list.length}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => onChange(cycleInList(list, current, 1))}
        className={
          isComfortable
            ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-300 transition hover:border-reels-cyan/40 hover:text-reels-cyan sm:h-9 sm:w-9 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700"
            : "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-300 transition hover:border-reels-cyan/40 hover:text-reels-cyan sm:h-7 sm:w-7 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700"
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
          ? "inline-flex max-w-full overflow-hidden rounded-lg border border-white/10 bg-black/25 p-1 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/80"
          : "inline-flex max-w-full overflow-hidden rounded-lg border border-white/10 bg-black/25 p-0.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/80"
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
          className={`rounded-md font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            isComfortable
              ? `min-w-[3rem] px-2.5 py-1.5 text-[11px] sm:min-w-[3.5rem] sm:text-[12px] ${
                  value === o.id
                    ? "bg-reels-cyan/25 text-reels-cyan ring-1 ring-reels-cyan/40"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900"
                }`
              : `min-w-[2.75rem] px-2 py-1 text-[10px] sm:min-w-[3.25rem] ${
                  value === o.id
                    ? "bg-reels-cyan/25 text-reels-cyan ring-1 ring-reels-cyan/40"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900"
                }`
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

