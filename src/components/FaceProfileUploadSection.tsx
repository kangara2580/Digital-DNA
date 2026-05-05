"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStoredFaceProfile } from "@/hooks/useStoredFaceProfile";
import { useTranslation } from "@/hooks/useTranslation";
import { MYPAGE_OUTLINE_BTN_CORE } from "@/lib/mypageOutlineCta";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

const TRIPLE_SLOTS = [
  { key: "front" as const, hintKey: "faceProfile.slotHintFront" },
  { key: "left" as const, hintKey: "faceProfile.slotHintLeft" },
  { key: "right" as const, hintKey: "faceProfile.slotHintRight" },
] as const;

const CROP_FRAMES: { labelKey: string; position: string }[] = [
  { labelKey: "faceProfile.angle.front", position: "object-center" },
  { labelKey: "faceProfile.angle.left", position: "object-[25%_center]" },
  { labelKey: "faceProfile.angle.right", position: "object-[75%_center]" },
];

const AI_STEP_KEYS = [
  "faceProfile.aiStep1",
  "faceProfile.aiStep2",
  "faceProfile.aiStep3",
] as const;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") resolve(r);
      else reject(new Error("read"));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function drawImageToCanvas(
  file: File,
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file);
    try {
      ctx.drawImage(bitmap, 0, 0, width, height);
    } finally {
      bitmap.close();
    }
    return canvas;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode"));
      img.src = objectUrl;
    });
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") resolve(r);
      else reject(new Error("read"));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function compressImageToDataUrl(file: File): Promise<string> {
  if (file.size <= MAX_BYTES) return readFileAsDataUrl(file);

  let sourceWidth = 0;
  let sourceHeight = 0;
  if ("createImageBitmap" in window) {
    const probe = await createImageBitmap(file);
    sourceWidth = probe.width;
    sourceHeight = probe.height;
    probe.close();
  } else {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("decode"));
        img.src = objectUrl;
      });
      sourceWidth = img.naturalWidth;
      sourceHeight = img.naturalHeight;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  const maxSide = 2048;
  const longer = Math.max(sourceWidth, sourceHeight);
  const scale = longer > maxSide ? maxSide / longer : 1;
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = await drawImageToCanvas(file, width, height);

  const mimeType = "image/jpeg";
  const qualities = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5];

  for (const q of qualities) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mimeType, q),
    );
    if (!blob) continue;
    if (blob.size <= MAX_BYTES) return blobToDataUrl(blob);
  }

  const fallback = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, 0.46),
  );
  if (!fallback) throw new Error("compress");
  return blobToDataUrl(fallback);
}

type TripleDraft = { front: string | null; left: string | null; right: string | null };

const emptyTriple = (): TripleDraft => ({ front: null, left: null, right: null });

/** 찜 빈 화면·마이페이지와 동일: 알약형 · 핑크 테두리 · 투명 배경 */
const outlineCtaMd = `${MYPAGE_OUTLINE_BTN_CORE} px-5 py-2.5 text-[15px]`;
/** 사진 1장 / 3장 한 번에 — 터치 영역 넓힌 동일 단계 */
const outlineCtaComfortable = `${MYPAGE_OUTLINE_BTN_CORE} px-6 py-3.5 text-[17px]`;
/** 보조 픽 버튼 공통 스타일(테두리·배경·호버) — 크기는 각 버튼에서 지정 */
const faceProfileNeutralPickBtn =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-100 transition hover:border-white/25 hover:bg-white/10 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-50";
const outlineDisabled =
  "disabled:pointer-events-none disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:bg-transparent";

export function FaceProfileUploadSection() {
  const { t } = useTranslation();
  const { profile, setProfile, hydrated } = useStoredFaceProfile();
  const reduceMotion = useReducedMotion() ?? false;

  const [tripleDraft, setTripleDraft] = useState<TripleDraft>(emptyTriple);

  const [singlePending, setSinglePending] = useState<string | null>(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiStepIndex, setAiStepIndex] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const tripleInputRefs = {
    front: useRef<HTMLInputElement>(null),
    left: useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null),
  };
  const tripleBatchInputRef = useRef<HTMLInputElement>(null);
  const singleInputRef = useRef<HTMLInputElement>(null);

  const aiStepLabels = useMemo(() => AI_STEP_KEYS.map((k) => t(k)), [t]);

  useEffect(() => {
    if (profile?.kind === "triple") {
      setTripleDraft({
        front: profile.front,
        left: profile.left,
        right: profile.right,
      });
    } else if (profile?.kind === "ai") {
      setTripleDraft(emptyTriple());
    }
  }, [profile]);

  const slotSrc = useCallback(
    (key: keyof TripleDraft) =>
      tripleDraft[key] ?? (profile?.kind === "triple" ? profile[key] : null),
    [tripleDraft, profile],
  );

  const angleLabel = useCallback(
    (key: keyof TripleDraft) => t(`faceProfile.angle.${key}`),
    [t],
  );

  const onTripleFile = useCallback(
    (key: keyof TripleDraft, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;
      if (file.size > MAX_SOURCE_BYTES) {
        alert(t("faceProfile.alertFileTooBig"));
        return;
      }
      setUploadStatus(t("faceProfile.statusProcessing", { angle: angleLabel(key) }));
      void compressImageToDataUrl(file)
        .then((dataUrl) => {
          setTripleDraft((prev) => {
            const next = { ...prev, [key]: dataUrl };
            if (next.front && next.left && next.right) {
              setProfile({
                kind: "triple",
                front: next.front,
                left: next.left,
                right: next.right,
              });
              setSinglePending(null);
              setUploadStatus(t("faceProfile.statusTripleDone"));
            } else {
              setUploadStatus(t("faceProfile.statusSlotDone", { angle: angleLabel(key) }));
            }
            return next;
          });
        })
        .catch(() => {
          setUploadStatus(t("faceProfile.statusUploadFail"));
          alert(t("faceProfile.alertProcessFail"));
        });
    },
    [angleLabel, setProfile, t],
  );

  const onTripleBatchFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      e.target.value = "";
      if (files.length < 3) {
        alert(t("faceProfile.alertBatchCount"));
        return;
      }
      const ordered = files.slice(0, 3);
      for (const f of ordered) {
        if (f.size > MAX_SOURCE_BYTES) {
          alert(t("faceProfile.alertFileTooBig"));
          return;
        }
      }
      setUploadStatus(t("faceProfile.statusBatchProcessing"));
      void (async () => {
        try {
          const front = await compressImageToDataUrl(ordered[0]!);
          const left = await compressImageToDataUrl(ordered[1]!);
          const right = await compressImageToDataUrl(ordered[2]!);
          const next = { front, left, right };
          setTripleDraft(next);
          setProfile({ kind: "triple", ...next });
          setSinglePending(null);
          setUploadStatus(t("faceProfile.statusTripleDone"));
        } catch {
          setUploadStatus(t("faceProfile.statusUploadFail"));
          alert(t("faceProfile.alertProcessFail"));
        }
      })();
    },
    [setProfile, t],
  );

  const onSingleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;
      if (file.size > MAX_SOURCE_BYTES) {
        alert(t("faceProfile.alertFileTooBig"));
        return;
      }
      void compressImageToDataUrl(file)
        .then((dataUrl) => {
          setSinglePending(dataUrl);
        })
        .catch(() => {
          alert(t("faceProfile.alertProcessFail"));
        });
    },
    [t],
  );

  const clearTripleSlot = useCallback(
    (key: keyof TripleDraft) => {
      setTripleDraft((prev) => ({ ...prev, [key]: null }));
      if (profile?.kind === "triple") {
        setProfile(null);
      }
      setUploadStatus(t("faceProfile.statusCancelled", { angle: angleLabel(key) }));
    },
    [angleLabel, profile, setProfile, t],
  );

  const runAiGeneration = useCallback(async () => {
    if (!singlePending) return;
    setAiRunning(true);
    setAiStepIndex(0);
    const stepMs = reduceMotion ? 0 : 850;
    for (let i = 0; i < AI_STEP_KEYS.length; i++) {
      setAiStepIndex(i);
      if (stepMs > 0) await new Promise((r) => setTimeout(r, stepMs));
    }
    setProfile({
      kind: "ai",
      source: singlePending,
      generatedAt: Date.now(),
    });
    setAiRunning(false);
    setSinglePending(null);
  }, [reduceMotion, setProfile, singlePending]);

  const clearAll = useCallback(() => {
    setProfile(null);
    setTripleDraft(emptyTriple());
    setSinglePending(null);
    setAiRunning(false);
    setUploadStatus("");
  }, [setProfile]);

  const showAiCrop = profile?.kind === "ai";

  const nothingStarted =
    !profile &&
    !tripleDraft.front &&
    !tripleDraft.left &&
    !tripleDraft.right &&
    !singlePending;

  return (
    <section
      className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 shadow-sm sm:p-6 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
      aria-labelledby="my-face-heading"
    >
      <h2
        id="my-face-heading"
        className="text-xl font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900"
      >
        {t("faceProfile.heading")}
      </h2>

      <div className="mt-5 space-y-2 rounded-xl border border-white/10 bg-black/25 px-4 py-3.5 sm:px-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
        <p className="text-[15px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
          {t("faceProfile.bannerTipQuick")}
        </p>
        <p className="text-[14px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {t("faceProfile.bannerTipQuality")}
        </p>
      </div>

      {/* ① 빠른 등록 (AI) — 먼저 노출 */}
      <div className="mt-8 border-t border-white/10 pt-8 [html[data-theme='light']_&]:border-zinc-100">
        <h3 className="text-[15px] font-semibold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
          {t("faceProfile.pathQuickTitle")}
        </h3>
        <p className="mt-1 text-[14px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          {t("faceProfile.pathQuickHint")}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={singleInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onSingleFile}
            aria-label={t("faceProfile.singlePhotoAria")}
          />
          <button
            type="button"
            onClick={() => singleInputRef.current?.click()}
            disabled={aiRunning}
            className={`${faceProfileNeutralPickBtn} px-6 py-3.5 text-[17px] font-semibold disabled:opacity-50`}
          >
            {t("faceProfile.pickOne")}
          </button>
          {singlePending && (
            <button
              type="button"
              onClick={runAiGeneration}
              disabled={aiRunning}
              className={`${outlineCtaMd} ${outlineDisabled}`}
            >
              {aiRunning ? t("faceProfile.generating") : t("faceProfile.generateTriple")}
            </button>
          )}
        </div>

        {singlePending && !aiRunning ? (
          <p className="mt-3 text-[13px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("faceProfile.tapGenerateHint")}
          </p>
        ) : null}

        {aiRunning ? (
          <div
            className="mt-5 rounded-xl border border-white/12 bg-black/30 px-4 py-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50"
            role="status"
            aria-live="polite"
          >
            <p className="font-mono text-[13px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              {aiStepLabels[aiStepIndex] ?? aiStepLabels[0]}
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10 [html[data-theme='light']_&]:bg-zinc-200">
              <div
                className="h-full rounded-full bg-[color:var(--reels-point)]/40 transition-[width] duration-500 ease-out motion-reduce:transition-none [html[data-theme='light']_&]:bg-[color:var(--reels-point)]/35"
                style={{
                  width: `${((aiStepIndex + 1) / AI_STEP_KEYS.length) * 100}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        {hydrated && showAiCrop ? (
          <div className="mt-6">
            <p className="text-[13px] font-bold uppercase tracking-wide text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              {t("faceProfile.aiPreviewLabel")}
            </p>
            <ul className="mt-2 grid grid-cols-3 gap-2 sm:gap-3" role="list">
              {CROP_FRAMES.map(({ labelKey, position }) => (
                <li key={labelKey} className="min-w-0">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/12 bg-black/35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profile.source}
                      alt=""
                      className={`h-full w-full object-cover ${position}`}
                    />
                    <span className="absolute left-1.5 top-1.5 rounded bg-zinc-900/80 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                      AI
                    </span>
                  </div>
                  <p className="mt-1.5 text-center text-[13px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                    {t(labelKey)}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
              {new Date(profile.generatedAt).toLocaleString(
                undefined,
                { dateStyle: "short", timeStyle: "short" },
              )}
            </p>
          </div>
        ) : null}
      </div>

      {/* ② 원본 3장 */}
      <div className="mt-10 border-t border-white/10 pt-8 [html[data-theme='light']_&]:border-zinc-100">
        <h3 className="text-[15px] font-semibold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
          {t("faceProfile.pathTripleTitle")}
        </h3>
        <p className="mt-1 text-[14px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          {t("faceProfile.pathTripleHint")}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={tripleBatchInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={onTripleBatchFiles}
            aria-label={t("faceProfile.pickThreeAria")}
          />
          <button
            type="button"
            onClick={() => tripleBatchInputRef.current?.click()}
            className={outlineCtaComfortable}
          >
            {t("faceProfile.pickThreeAtOnce")}
          </button>
          <span className="text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("faceProfile.pickThreeAtOnceHint")}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {TRIPLE_SLOTS.map(({ key, hintKey }) => (
            <div
              key={key}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50"
            >
              <input
                ref={tripleInputRefs[key]}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onTripleFile(key, e)}
                aria-label={t("faceProfile.pickPhotoAria", {
                  angle: angleLabel(key),
                })}
              />
              <p className="text-[15px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                {t(`faceProfile.angle.${key}`)}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                {t(hintKey)}
              </p>
              <button
                type="button"
                onClick={() => tripleInputRefs[key].current?.click()}
                className={`${faceProfileNeutralPickBtn} mt-3 w-full px-3 py-2 text-[13px] font-medium`}
              >
                {slotSrc(key) ? t("faceProfile.repick") : t("faceProfile.choose")}
              </button>
              {slotSrc(key) ? (
                <button
                  type="button"
                  onClick={() => clearTripleSlot(key)}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-transparent py-2 text-[13px] font-semibold text-[color:var(--reels-point)] transition hover:border-[color:var(--reels-point)]/40 hover:bg-[color:var(--reels-point)]/10 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-[color:var(--reels-point)] [html[data-theme='light']_&]:hover:bg-zinc-50"
                >
                  {t("faceProfile.cancel")}
                </button>
              ) : null}
              {slotSrc(key) ? (
                <div className="mt-3 aspect-[3/4] overflow-hidden rounded-lg border border-white/12 bg-black/35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slotSrc(key)!}
                    alt={t("faceProfile.previewAlt", { angle: angleLabel(key) })}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {uploadStatus ? (
          <p className="mt-3 text-[14px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            {uploadStatus}
          </p>
        ) : null}
      </div>

      {hydrated && !nothingStarted ? (
        <div className="mt-8 flex justify-end gap-2 border-t border-white/10 pt-6 [html[data-theme='light']_&]:border-zinc-100">
          <p className="mr-auto self-center text-[14px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            {t("faceProfile.autoSaved")}
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-[15px] font-medium text-zinc-300 transition hover:border-white/25 hover:bg-white/10 hover:text-zinc-100 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:bg-zinc-50 [html[data-theme='light']_&]:hover:text-zinc-900"
          >
            {t("faceProfile.clearAll")}
          </button>
        </div>
      ) : null}

      {!hydrated ? (
        <p className="mt-6 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {t("settings.loading")}
        </p>
      ) : null}
    </section>
  );
}
