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

type Props = {
  value: ProfileAvatar | null;
  onChange: (next: ProfileAvatar | null) => void;
  /** 회원가입 / 마이페이지 등 짧은 부연 */
  hint?: string;
};

export function ProfileAvatarPicker({ value, onChange, hint }: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const [parts, setParts] = useState<CharacterPartsV1>(() =>
    createDefaultCharacterParts(DEFAULT_BEST_REVIEW_AVATAR_SEED),
  );

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

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
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
          {hint ? (
            <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              {hint}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-[12px] font-bold text-zinc-200 transition hover:border-reels-cyan/40 hover:bg-reels-cyan/10 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
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
        </div>
      </div>

      <div
        className={`rounded-xl border border-reels-cyan/20 bg-gradient-to-br from-black/40 to-black/20 p-2.5 sm:p-3 lg:max-w-[360px] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:from-zinc-100/90 [html[data-theme='light']_&]:to-white ${
          customizerDisabled ? "opacity-50" : ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <p className="text-[11px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            캐릭터 꾸미기
          </p>
          <button
            type="button"
            disabled={customizerDisabled}
            onClick={randomize}
            className="inline-flex items-center gap-1 rounded-full border border-reels-cyan/35 bg-reels-cyan/12 px-2 py-0.5 text-[10px] font-bold text-reels-cyan transition hover:bg-reels-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Dices className="h-3 w-3" aria-hidden />
            랜덤
          </button>
        </div>

        {customizerDisabled ? (
          <p className="mt-2 text-[10px] leading-snug text-zinc-500">
            직접 올린 사진을 쓰는 중에는 캐릭터 조합이 꺼져 있어요. 프리셋이나 조합을 쓰려면 위에서 사진 선택을 해제해 주세요.
          </p>
        ) : (
          <div className="mt-2 space-y-1">
            <GenderRow
              value={parts.gender}
              onChange={(gender) => applyCustom({ ...parts, gender })}
            />
            <CycleRow
              label="헤어"
              current={parts.hair}
              list={NOTIONISTS_HAIR}
              onChange={(hair) => applyCustom({ ...parts, hair })}
            />
            <CycleRow
              label="눈"
              current={parts.eyes}
              list={NOTIONISTS_EYES}
              onChange={(eyes) => applyCustom({ ...parts, eyes })}
            />
            <CycleRow
              label="코"
              current={parts.nose}
              list={NOTIONISTS_NOSE}
              onChange={(nose) => applyCustom({ ...parts, nose })}
            />
            <CycleRow
              label="입"
              current={parts.lips}
              list={NOTIONISTS_LIPS}
              onChange={(lips) => applyCustom({ ...parts, lips })}
            />
            <CycleRow
              label="눈썹"
              current={parts.brows}
              list={NOTIONISTS_BROWS}
              onChange={(brows) => applyCustom({ ...parts, brows })}
            />
            <CycleRow
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

function CycleRow<T extends string>({
  label,
  current,
  list,
  onChange,
}: {
  label: string;
  current: T;
  list: readonly T[];
  onChange: (next: T) => void;
}) {
  const idx = Math.max(0, list.indexOf(current));
  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/25 px-1.5 py-0.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/80">
      <button
        type="button"
        onClick={() => onChange(cycleInList(list, current, -1))}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-300 transition hover:border-reels-cyan/40 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700"
        aria-label={`${label} 이전`}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <p className="text-[10px] font-bold leading-tight text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
          {label}{" "}
          <span className="font-semibold tabular-nums text-zinc-500">
            {idx + 1}/{list.length}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => onChange(cycleInList(list, current, 1))}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-300 transition hover:border-reels-cyan/40 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700"
        aria-label={`${label} 다음`}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function GenderRow({
  value,
  onChange,
}: {
  value: CharacterGender;
  onChange: (g: CharacterGender) => void;
}) {
  const opts: { id: CharacterGender; label: string }[] = [
    { id: "feminine", label: "여성" },
    { id: "masculine", label: "남성" },
  ];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-2 py-1 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/80">
      <span className="w-8 shrink-0 text-[9px] font-bold uppercase tracking-wide text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        성별
      </span>
      <div className="flex min-w-0 flex-1 gap-1">
        {opts.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`flex-1 rounded-md py-1 text-[10px] font-bold transition ${
              value === o.id
                ? "bg-reels-cyan/25 text-reels-cyan ring-1 ring-reels-cyan/40"
                : "border border-white/10 bg-black/30 text-zinc-400 hover:border-reels-cyan/30 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-700"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

