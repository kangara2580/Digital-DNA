"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStoredFaceProfile } from "@/hooks/useStoredFaceProfile";

const MAX_BYTES = 5 * 1024 * 1024;

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

type TripleDraft = { front: string | null; left: string | null; right: string | null };

const emptyTriple = (): TripleDraft => ({ front: null, left: null, right: null });

export function FaceProfileUploadSection() {
  const { profile, setProfile, hydrated } = useStoredFaceProfile();
  const reduceMotion = useReducedMotion() ?? false;

  const [tripleDraft, setTripleDraft] = useState<TripleDraft>(emptyTriple);

  const [singlePending, setSinglePending] = useState<string | null>(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiStepIndex, setAiStepIndex] = useState(0);

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
      if (file.size > MAX_BYTES) {
        alert("5MB 이하 이미지를 선택해 주세요.");
        return;
      }
      void readFileAsDataUrl(file).then((dataUrl) => {
        setTripleDraft((prev) => {
          const next = { ...prev, [key]: dataUrl };
          if (next.front && next.left && next.right) {
            setProfile({ kind: "triple", front: next.front, left: next.left, right: next.right });
            setSinglePending(null);
          }
          return next;
        });
      });
    },
    [setProfile],
  );

  const onSingleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > MAX_BYTES) {
      alert("5MB 이하 이미지를 선택해 주세요.");
      return;
    }
    void readFileAsDataUrl(file).then((dataUrl) => {
      setSinglePending(dataUrl);
    });
  }, []);

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
  }, [setProfile]);

  const tripleReady =
    (tripleDraft.front && tripleDraft.left && tripleDraft.right) || profile?.kind === "triple";

  const showTripleGrid =
    profile?.kind === "triple"
      ? ([profile.front, profile.left, profile.right] as const)
      : tripleDraft.front && tripleDraft.left && tripleDraft.right
        ? ([tripleDraft.front, tripleDraft.left, tripleDraft.right] as const)
        : null;

  const showAiCrop = profile?.kind === "ai";

  const nothingStarted =
    !profile &&
    !tripleDraft.front &&
    !tripleDraft.left &&
    !tripleDraft.right &&
    !singlePending;

  return (
    <section
      className="mt-10 reels-glass-card rounded-2xl p-5 sm:p-6"
      aria-labelledby="my-face-heading"
    >
      <h2 id="my-face-heading" className="text-lg font-extrabold tracking-tight text-zinc-100 sm:text-xl">
        프로필 · 3면
      </h2>

      <div className="mt-4 rounded-xl border border-reels-cyan/25 bg-reels-cyan/[0.06] px-4 py-3.5 sm:px-5">
        <p className="text-[15px] font-extrabold leading-snug tracking-tight text-zinc-50">
          <span className="text-reels-cyan">3면 원본</span>
          {` `}→ 가장 정확
        </p>
        <p className="mt-2 text-[13px] font-bold leading-snug text-zinc-400">
          1장뿐이면 → <span className="text-reels-cyan">AI로 3면 보완</span>
        </p>
      </div>

      <div className="mt-8 border-t border-white/10 pt-8">
        <h3 className="text-[13px] font-extrabold tracking-tight text-zinc-100">
          ① 3면 직접 <span className="text-reels-cyan/90">(권장)</span>
        </h3>
        <p className="mt-1 text-[12px] font-semibold text-zinc-500">정면 · 좌 · 우 각 1장</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {TRIPLE_LABELS.map(({ key, title }) => (
            <div key={key} className="rounded-xl border border-white/10 bg-black/25 p-3">
              <input
                ref={tripleInputRefs[key]}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onTripleFile(key, e)}
                aria-label={`${title} 프로필 사진 선택`}
              />
              <p className="text-[13px] font-extrabold text-zinc-100">{title}</p>
              <button
                type="button"
                onClick={() => tripleInputRefs[key].current?.click()}
                className="mt-3 w-full rounded-lg border border-white/15 py-2 text-[11px] font-medium text-zinc-400 transition hover:border-reels-cyan/35 hover:text-zinc-200"
              >
                {slotSrc(key) ? "다시 선택" : "선택"}
              </button>
            </div>
          ))}
        </div>

        {hydrated && showTripleGrid ? (
          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">직접 등록 미리보기</p>
            <ul className="mt-2 grid grid-cols-3 gap-2 sm:gap-3" role="list">
              {showTripleGrid.map((src, i) => (
                <li key={TRIPLE_LABELS[i].key} className="min-w-0">
                  <div className="relative overflow-hidden rounded-xl border border-white/12 bg-black/40 aspect-[3/4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover object-center" />
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-reels-cyan">
                      직접
                    </span>
                  </div>
                  <p className="mt-1.5 text-center text-[11px] font-medium text-zinc-500">
                    {TRIPLE_LABELS[i].title}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-10 border-t border-white/10 pt-8">
        <h3 className="text-[13px] font-extrabold tracking-tight text-zinc-100">
          ② 1장 + <span className="text-reels-cyan/90">AI 3면</span>
        </h3>
        <p className="mt-1 text-[12px] font-semibold text-zinc-500">정면 1장 올리고 → 생성</p>

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
            className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-[13px] font-semibold text-zinc-200 transition hover:border-reels-cyan/35 hover:text-white disabled:opacity-50"
          >
            사진 1장 선택
          </button>
          {singlePending && (
            <button
              type="button"
              onClick={runAiGeneration}
              disabled={aiRunning}
              className="rounded-xl border border-reels-cyan/40 bg-reels-cyan/15 px-4 py-2.5 text-[13px] font-semibold text-reels-cyan transition hover:bg-reels-cyan/25 disabled:opacity-60"
            >
              {aiRunning ? "처리 중…" : "AI로 3면 생성"}
            </button>
          )}
        </div>

        {singlePending && !aiRunning ? (
          <p className="mt-3 text-[11px] font-semibold text-zinc-500">생성 버튼을 누르세요.</p>
        ) : null}

        {aiRunning ? (
          <div
            className="mt-5 rounded-xl border border-reels-cyan/30 bg-black/40 px-4 py-4"
            role="status"
            aria-live="polite"
          >
            <p className="font-mono text-[11px] font-semibold text-reels-cyan">{AI_STEPS[aiStepIndex]}</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-reels-crimson/80 to-reels-cyan/90 transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{ width: `${((aiStepIndex + 1) / AI_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        {hydrated && showAiCrop ? (
          <div className="mt-6">
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">AI 보완 미리보기</p>
            <ul className="mt-2 grid grid-cols-3 gap-2 sm:gap-3" role="list">
              {CROP_FRAMES.map(({ label, position }) => (
                <li key={label} className="min-w-0">
                  <div className="relative overflow-hidden rounded-xl border border-reels-cyan/20 bg-black/40 aspect-[3/4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profile.source}
                      alt=""
                      className={`h-full w-full object-cover ${position}`}
                    />
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-reels-cyan">
                      AI
                    </span>
                  </div>
                  <p className="mt-1.5 text-center text-[11px] font-medium text-zinc-500">{label}</p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] font-medium text-zinc-600">
              {new Date(profile.generatedAt).toLocaleString("ko-KR")}
            </p>
          </div>
        ) : null}
      </div>

      {hydrated && !nothingStarted ? (
        <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={clearAll}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-[13px] font-medium text-zinc-400 transition hover:border-white/25 hover:text-zinc-200"
          >
            전체 등록 해제
          </button>
        </div>
      ) : null}

      {!hydrated ? <p className="mt-6 text-[12px] text-zinc-600">불러오는 중…</p> : null}
      {hydrated && nothingStarted ? (
        <p className="mt-6 rounded-lg border border-dashed border-white/10 bg-black/20 px-3 py-5 text-center text-[12px] font-semibold text-zinc-500">
          ① 또는 ②로 등록
        </p>
      ) : null}
    </section>
  );
}
