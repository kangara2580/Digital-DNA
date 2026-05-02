"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStoredFaceProfile } from "@/hooks/useStoredFaceProfile";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

const TRIPLE_LABELS = [
  { key: "front" as const, title: "정면" },
  { key: "left" as const, title: "좌측" },
  { key: "right" as const, title: "우측" },
];

const CROP_FRAMES: { label: string; position: string }[] = [
  { label: "정면", position: "object-center" },
  { label: "좌측", position: "object-[25%_center]" },
  { label: "우측", position: "object-[75%_center]" },
];

const AI_STEPS = [
  "얼굴 영역 검출 중…",
  "정면·측면 각도 추정 중…",
  "3면 뷰 합성 렌더링 중…",
];

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

function titleByKey(key: keyof TripleDraft): string {
  if (key === "front") return "정면";
  if (key === "left") return "좌측";
  return "우측";
}

export function FaceProfileUploadSection() {
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
  const singleInputRef = useRef<HTMLInputElement>(null);

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
    (key: keyof TripleDraft) => tripleDraft[key] ?? (profile?.kind === "triple" ? profile[key] : null),
    [tripleDraft, profile],
  );

  const onTripleFile = useCallback(
    (key: keyof TripleDraft, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;
      if (file.size > MAX_SOURCE_BYTES) {
        alert("원본 이미지가 너무 큽니다. 20MB 이하 파일을 선택해 주세요.");
        return;
      }
      setUploadStatus(`${titleByKey(key)} 이미지 처리 중...`);
      void compressImageToDataUrl(file)
        .then((dataUrl) => {
          setTripleDraft((prev) => {
            const next = { ...prev, [key]: dataUrl };
            if (next.front && next.left && next.right) {
              setProfile({ kind: "triple", front: next.front, left: next.left, right: next.right });
              setSinglePending(null);
              setUploadStatus("3면 이미지 등록이 완료되었습니다.");
            } else {
              setUploadStatus(`${titleByKey(key)} 이미지가 업로드되었습니다.`);
            }
            return next;
          });
        })
        .catch(() => {
          setUploadStatus("이미지 업로드에 실패했습니다. 다른 파일로 다시 시도해 주세요.");
          alert("이미지 처리 중 문제가 발생했어요. 다른 이미지를 선택해 주세요.");
        });
    },
    [setProfile],
  );

  const onSingleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > MAX_SOURCE_BYTES) {
      alert("원본 이미지가 너무 큽니다. 20MB 이하 파일을 선택해 주세요.");
      return;
    }
    void compressImageToDataUrl(file)
      .then((dataUrl) => {
        setSinglePending(dataUrl);
      })
      .catch(() => {
        alert("이미지 처리 중 문제가 발생했어요. 다른 이미지를 선택해 주세요.");
      });
  }, []);

  const clearTripleSlot = useCallback(
    (key: keyof TripleDraft) => {
      setTripleDraft((prev) => ({ ...prev, [key]: null }));
      if (profile?.kind === "triple") {
        setProfile(null);
      }
      setUploadStatus(`${titleByKey(key)} 이미지 선택이 취소되었습니다.`);
    },
    [profile, setProfile],
  );

  const runAiGeneration = useCallback(async () => {
    if (!singlePending) return;
    setAiRunning(true);
    setAiStepIndex(0);
    const stepMs = reduceMotion ? 0 : 850;
    for (let i = 0; i < AI_STEPS.length; i++) {
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

  const tripleReady =
    (tripleDraft.front && tripleDraft.left && tripleDraft.right) || profile?.kind === "triple";

  const showAiCrop = profile?.kind === "ai";

  const nothingStarted =
    !profile &&
    !tripleDraft.front &&
    !tripleDraft.left &&
    !tripleDraft.right &&
    !singlePending;

  return (
    <section
      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="my-face-heading"
    >
      <h2 id="my-face-heading" className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
        프로필 · 3면
      </h2>

      <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 sm:px-5">
        <p className="text-[15px] font-semibold leading-snug tracking-tight text-zinc-900">
          <span className="text-cyan-600">3면 원본</span>
          {` `}→ 가장 정확
        </p>
        <p className="mt-2 text-[13px] font-medium leading-snug text-zinc-600">
          1장뿐이면 → <span className="font-semibold text-cyan-600">AI로 3면 보완</span>
        </p>
      </div>

      <div className="mt-8 border-t border-zinc-100 pt-8">
        <h3 className="text-[13px] font-semibold tracking-tight text-zinc-900">
          ① 3면 직접 <span className="text-cyan-600">(권장)</span>
        </h3>
        <p className="mt-1 text-[12px] font-semibold text-zinc-600">정면 · 좌 · 우 각 1장 (원본 20MB까지 자동 압축)</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {TRIPLE_LABELS.map(({ key, title }) => (
            <div key={key} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <input
                ref={tripleInputRefs[key]}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onTripleFile(key, e)}
                aria-label={`${title} 프로필 사진 선택`}
              />
              <p className="text-[13px] font-semibold text-zinc-900">{title}</p>
              <button
                type="button"
                onClick={() => tripleInputRefs[key].current?.click()}
                className="mt-3 w-full rounded-lg border border-zinc-200 bg-white py-2 text-[11px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                {slotSrc(key) ? "다시 선택" : "선택"}
              </button>
              {slotSrc(key) ? (
                <button
                  type="button"
                  onClick={() => clearTripleSlot(key)}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-white py-2 text-[11px] font-semibold text-reels-crimson transition hover:bg-zinc-50"
                >
                  취소
                </button>
              ) : null}
              {slotSrc(key) ? (
                <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 aspect-[3/4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slotSrc(key)!}
                    alt={`${title} 업로드 미리보기`}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {uploadStatus ? (
          <p className="mt-3 text-[12px] font-semibold text-cyan-700">
            {uploadStatus}
          </p>
        ) : null}

      </div>

      <div className="mt-10 border-t border-zinc-100 pt-8">
        <h3 className="text-[13px] font-semibold tracking-tight text-zinc-900">
          ② 1장 + <span className="text-cyan-600">AI 3면</span>
        </h3>
        <p className="mt-1 text-[12px] font-semibold text-zinc-600">정면 1장 올리고 → 생성 (원본 20MB까지 자동 압축)</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={singleInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onSingleFile}
            aria-label="정면 사진 1장 선택"
          />
          <button
            type="button"
            onClick={() => singleInputRef.current?.click()}
            disabled={aiRunning}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            사진 1장 선택
          </button>
          {singlePending && (
            <button
              type="button"
              onClick={runAiGeneration}
              disabled={aiRunning}
              className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-[13px] font-semibold text-cyan-900 transition hover:border-cyan-300 hover:bg-cyan-100 disabled:opacity-60"
            >
              {aiRunning ? "처리 중…" : "AI로 3면 생성"}
            </button>
          )}
        </div>

        {singlePending && !aiRunning ? (
          <p className="mt-3 text-[11px] font-semibold text-zinc-600">생성 버튼을 누르세요.</p>
        ) : null}

        {aiRunning ? (
          <div
            className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4"
            role="status"
            aria-live="polite"
          >
            <p className="font-mono text-[11px] font-semibold text-cyan-700">{AI_STEPS[aiStepIndex]}</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-reels-crimson/80 to-reels-cyan/90 transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{ width: `${((aiStepIndex + 1) / AI_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        {hydrated && showAiCrop ? (
          <div className="mt-6">
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-600">AI 보완 미리보기</p>
            <ul className="mt-2 grid grid-cols-3 gap-2 sm:gap-3" role="list">
              {CROP_FRAMES.map(({ label, position }) => (
                <li key={label} className="min-w-0">
                  <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 aspect-[3/4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profile.source}
                      alt=""
                      className={`h-full w-full object-cover ${position}`}
                    />
                    <span className="absolute left-1.5 top-1.5 rounded bg-zinc-900/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      AI
                    </span>
                  </div>
                  <p className="mt-1.5 text-center text-[11px] font-medium text-zinc-600">{label}</p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] font-medium text-zinc-500">
              {new Date(profile.generatedAt).toLocaleString("ko-KR")}
            </p>
          </div>
        ) : null}
      </div>

      {hydrated && !nothingStarted ? (
        <div className="mt-8 flex justify-end gap-2 border-t border-zinc-100 pt-6">
          <p className="mr-auto self-center text-[12px] font-semibold text-zinc-600">
            변경 사항은 자동 저장됩니다.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            전체 등록 해제
          </button>
        </div>
      ) : null}

      {!hydrated ? <p className="mt-6 text-[12px] text-zinc-600">불러오는 중…</p> : null}
      {hydrated && nothingStarted ? (
            <p className="mt-6 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-5 text-center text-[12px] font-semibold text-zinc-600">
          ① 또는 ②로 등록
        </p>
      ) : null}
    </section>
  );
}
