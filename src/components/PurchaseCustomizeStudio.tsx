"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import type { FeedVideo } from "@/data/videos";
import { LOCAL_FACE_SWAP_VIDEO_IDS } from "@/constants/videos";
import { buildFacePickerOptions, type FacePickerOption } from "@/lib/facePickerOptions";
import { markCustomizeDraftSaved } from "@/lib/customizeDraftIndex";
import { getCustomizeDraftStorageKey } from "@/lib/customizeDraftStorage";
import {
  consumeLocalFacePreviewSuccess,
  FREE_LOCAL_FACE_PREVIEW_TRIES,
  getLocalFacePreviewRemaining,
} from "@/lib/facePreviewQuota";
import { isLocalPublicVideo } from "@/lib/localVideoHighlight";
import { sanitizePosterSrc } from "@/lib/videoPoster";
import { useVideoStartPoster } from "@/hooks/useVideoStartPoster";
import { InputSection } from "@/components/InputSection";
import { VideoBackgroundComposite } from "@/components/VideoBackgroundComposite";

const FONT_PRETENDARD = "var(--font-pretendard)";
const FONT_MONTSERRAT = "var(--font-montserrat), Arial, sans-serif";
const FONT_BLACK_HAN_SANS = "var(--font-black-han-sans), sans-serif";
const FONT_SONG_MYUNG = "var(--font-song-myung), serif";
const FONT_NANUM_GOTHIC = "var(--font-nanum-gothic), sans-serif";

type TextOverlay = {
  id: string;
  text: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  topPct: number;
  leftPct: number;
  opacity: number;
  shadow: number;
  strokeWidth: number;
  strokeColor: string;
};

type CustomizeDraft = {
  faceOptionId: string | null;
  backgroundMode?: "video" | "image";
  backgroundPrompt: string;
  trimStart: number;
  trimEnd: number;
  overlays: TextOverlay[];
};

const defaultOverlays = (): TextOverlay[] => [
  {
    id: "o1",
    text: "",
    color: "#ffffff",
    fontFamily: FONT_PRETENDARD,
    fontSize: 22,
    topPct: 50,
    leftPct: 50,
    opacity: 1,
    shadow: 0.65,
    strokeWidth: 0,
    strokeColor: "#000000",
  },
];

const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "Pretendard (현대적·깔끔)", value: FONT_PRETENDARD },
  { label: "Black Han Sans (강렬·임팩트)", value: FONT_BLACK_HAN_SANS },
  { label: "Song Myung (우아·몽환)", value: FONT_SONG_MYUNG },
  { label: "Montserrat (글로벌·세련)", value: FONT_MONTSERRAT },
  { label: "Nanum Gothic (가독성·한글 안정)", value: FONT_NANUM_GOTHIC },
];

function normalizeFontFamily(input: unknown): string {
  if (typeof input !== "string" || !input.trim()) return FONT_PRETENDARD;
  const v = input.trim();
  const lower = v.toLowerCase();
  if (lower === "pretendard") return FONT_PRETENDARD;
  if (lower === "montserrat") return FONT_MONTSERRAT;
  if (lower === "black han sans") return FONT_BLACK_HAN_SANS;
  if (lower === "song myung") return FONT_SONG_MYUNG;
  if (lower === "nanum gothic") return FONT_NANUM_GOTHIC;
  if (lower === "noto sans kr") return '"Noto Sans KR", sans-serif';
  if (lower === "poppins") return "Poppins, sans-serif";
  if (lower === "oswald") return "Oswald, sans-serif";
  if (lower === "bebas neue") return '"Bebas Neue", sans-serif';
  return v;
}

function clampOverlayPosition(v: number, min = 5, max = 95): number {
  return Math.min(max, Math.max(min, v));
}

function loadDraft(videoId: string, options: FacePickerOption[]): CustomizeDraft {
  try {
    const raw = localStorage.getItem(getCustomizeDraftStorageKey(videoId));
    if (!raw) throw new Error("empty");
    const j = JSON.parse(raw) as CustomizeDraft;
    if (!j || typeof j !== "object") throw new Error("bad");
    const faceOk = j.faceOptionId && options.some((o) => o.id === j.faceOptionId);
    const normalizedOverlays =
      Array.isArray(j.overlays) && j.overlays.length
        ? j.overlays.map((o) => ({
            ...o,
            fontFamily: normalizeFontFamily((o as Partial<TextOverlay>).fontFamily),
            topPct:
              typeof (o as Partial<TextOverlay>).topPct === "number"
                ? clampOverlayPosition((o as Partial<TextOverlay>).topPct!)
                : 50,
            leftPct:
              typeof (o as Partial<TextOverlay>).leftPct === "number"
                ? clampOverlayPosition((o as Partial<TextOverlay>).leftPct!)
                : 50,
            opacity:
              typeof (o as Partial<TextOverlay>).opacity === "number"
                ? Math.max(0, Math.min(1, (o as Partial<TextOverlay>).opacity!))
                : 1,
            shadow:
              typeof (o as Partial<TextOverlay>).shadow === "number"
                ? Math.max(0, Math.min(1, (o as Partial<TextOverlay>).shadow!))
                : 0.65,
            strokeWidth:
              typeof (o as Partial<TextOverlay>).strokeWidth === "number"
                ? Math.max(0, Math.min(6, (o as Partial<TextOverlay>).strokeWidth!))
                : 0,
            strokeColor:
              typeof (o as Partial<TextOverlay>).strokeColor === "string"
                ? (o as Partial<TextOverlay>).strokeColor!
                : "#000000",
          }))
        : defaultOverlays();

    const backgroundMode =
      j.backgroundMode === "image" || j.backgroundMode === "video"
        ? j.backgroundMode
        : "video";
    const backgroundPrompt =
      typeof j.backgroundPrompt === "string" ? j.backgroundPrompt : "";

    return {
      faceOptionId: faceOk ? j.faceOptionId : options[0]?.id ?? null,
      backgroundMode,
      backgroundPrompt,
      trimStart: typeof j.trimStart === "number" ? j.trimStart : 0,
      trimEnd: typeof j.trimEnd === "number" ? j.trimEnd : 0,
      overlays: normalizedOverlays,
    };
  } catch {
    return {
      faceOptionId: options[0]?.id ?? null,
      backgroundMode: "video",
      backgroundPrompt: "",
      trimStart: 0,
      trimEnd: 0,
      overlays: defaultOverlays(),
    };
  }
}

function saveDraft(videoId: string, d: CustomizeDraft) {
  try {
    localStorage.setItem(getCustomizeDraftStorageKey(videoId), JSON.stringify(d));
  } catch {
    /* quota */
  }
}

function looksLikeVideoUrl(url: string): boolean {
  const path = url.split("?")[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|mkv)$/.test(path);
}

/**
 * Replicate/HTTP 등에서 온 기술 메시지를 사용자용 한국어로만 바꿉니다.
 * (상태 코드, 도메인, 영문 JSON 노출 방지)
 */
function userFacingAiErrorMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    raw.includes("402") ||
    lower.includes("insufficient credit") ||
    lower.includes("payment required")
  ) {
    return "이용 가능한 크레딧이 부족합니다. 충전 후 다시 시도해 주세요.";
  }
  if (
    raw.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("throttled") ||
    lower.includes("rate limit") ||
    lower.includes("replicate_rate_limited")
  ) {
    return "현재 생성 요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (
    lower.includes("replicate_token_missing") ||
    lower.includes(".env.local") ||
    lower.includes("replicate api 토큰")
  ) {
    return "AI 기능을 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (
    lower.includes("api.replicate.com") ||
    raw.includes('"detail"') ||
    /status["']?\s*:\s*\d{3}/.test(raw) ||
    raw.length > 200
  ) {
    return "처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
  const trimmed = raw.trim();
  if (
    /[\uac00-\ud7a3]/.test(trimmed) &&
    trimmed.length <= 140 &&
    !trimmed.includes("http") &&
    !/\b402\b|\b429\b|replicate/i.test(trimmed)
  ) {
    return trimmed;
  }
  return "처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

/** 서버 생성 작업 상태 — API 값은 숨기고 한국어 안내만 노출 */
function reelsJobPresentation(status: string): {
  title: string;
  line: string;
  showMeter: boolean;
} {
  switch (status) {
    case "queued":
      return {
        title: "순서를 기다리는 중이에요",
        line: "곧 서버에서 AI 합성이 시작됩니다. (보통 수십 초 안에 진행돼요)",
        showMeter: true,
      };
    case "running":
      return {
        title: "서버에서 열심히 제작 중이에요",
        line: "완료까지 약 20~60초 정도 걸릴 수 있어요. 창을 닫아도 작업은 계속됩니다.",
        showMeter: true,
      };
    case "succeeded":
      return {
        title: "생성이 완료되었어요",
        line: "아래에서 결과를 확인하거나, 마이페이지에서도 다시 열어볼 수 있어요.",
        showMeter: false,
      };
    case "failed":
      return {
        title: "생성에 문제가 생겼어요",
        line: "잠시 후 다시 시도하거나, 임시 저장 내용을 확인해 주세요.",
        showMeter: false,
      };
    default:
      return {
        title: "처리 중이에요",
        line: "잠시만 기다려 주세요.",
        showMeter: true,
      };
  }
}

type RemoteJobBanner = {
  jobId: string;
  status: string;
  progress: number;
  outputVideoUrl?: string;
  error?: string;
};

function ServerGenerationStatusCard({ job }: { job: RemoteJobBanner }) {
  const pres = reelsJobPresentation(job.status);
  const busy = job.status === "queued" || job.status === "running";
  const pct = Math.max(0, Math.min(100, Number(job.progress) || 0));
  const barPct = job.status === "queued" && pct < 4 ? 12 : Math.max(6, pct);

  return (
    <div className="mt-4 rounded-xl border border-reels-cyan/20 bg-gradient-to-br from-black/45 to-black/20 px-4 py-4 text-[13px] text-zinc-300">
      <p className="text-[11px] font-bold uppercase tracking-wide text-reels-cyan/90">AI 생성</p>
      <p className="mt-2 text-[15px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
        {pres.title}
      </p>
      <p className="mt-1.5 leading-relaxed text-[12px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
        {pres.line}
      </p>

      {pres.showMeter ? (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 [html[data-theme='light']_&]:bg-zinc-200/80">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-reels-cyan/85 to-reels-crimson/70 ${
                job.status === "queued" && pct < 5 ? "animate-pulse" : "transition-[width] duration-700"
              }`}
              style={{ width: `${barPct}%` }}
            />
          </div>
        </div>
      ) : null}

      {busy ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-black/35 px-3 py-3 text-[12px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:border-zinc-200/80 [html[data-theme='light']_&]:bg-zinc-50/80 [html[data-theme='light']_&]:text-zinc-600">
          <p>
            생성이 시작되었어요.{" "}
            <strong className="text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
              이 페이지를 나가도 서버 작업은 중단되지 않아요.
            </strong>{" "}
            완료된 영상은{" "}
            <Link
              href="/mypage?tab=drafts"
              className="font-semibold text-reels-cyan underline-offset-2 hover:underline"
            >
              마이페이지 → 임시 저장
            </Link>
            에서 이어서 확인할 수 있어요.
          </p>
          <p className="mt-2">
            기다리는 동안{" "}
            <Link
              href="/explore"
              className="font-semibold text-reels-cyan underline-offset-2 hover:underline"
            >
              탐색 탭
            </Link>
            릴스를 구경해 보세요.
          </p>
        </div>
      ) : null}

      {job.status === "succeeded" && job.outputVideoUrl ? (
        <div className="mt-3">
          <Link
            href={`/generation/result/${encodeURIComponent(job.jobId)}`}
            className="inline-flex rounded-full border border-reels-cyan/40 bg-reels-cyan/15 px-4 py-2 text-[12px] font-bold text-reels-cyan hover:bg-reels-cyan/25"
          >
            결과 보기
          </Link>
        </div>
      ) : null}

      {job.error ? (
        <p className="mt-3 text-[12px] font-medium text-reels-crimson" role="alert">
          {job.error}
        </p>
      ) : null}
    </div>
  );
}

function previewToneFromPrompt(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("neon") || p.includes("네온")) {
    return "linear-gradient(140deg, rgba(0,242,234,0.2), rgba(255,0,85,0.18))";
  }
  if (p.includes("sunset") || p.includes("노을") || p.includes("orange")) {
    return "linear-gradient(140deg, rgba(255,158,44,0.22), rgba(255,76,76,0.14))";
  }
  if (p.includes("night") || p.includes("밤") || p.includes("dark")) {
    return "linear-gradient(140deg, rgba(40,58,120,0.24), rgba(0,0,0,0.2))";
  }
  if (p.includes("forest") || p.includes("숲") || p.includes("green")) {
    return "linear-gradient(140deg, rgba(55,163,91,0.2), rgba(12,44,18,0.16))";
  }
  return "linear-gradient(140deg, rgba(255,255,255,0.12), rgba(0,0,0,0.14))";
}

export function PurchaseCustomizeStudio({ video }: { video: FeedVideo }) {
  const { hasPurchased } = usePurchasedVideos();
  const isLocalFaceSwapDemo = LOCAL_FACE_SWAP_VIDEO_IDS.includes(video.id);
  const owned = hasPurchased(video.id) || isLocalFaceSwapDemo;
  /** 구매 전 로컬 샘플만 — AI 얼굴 미리보기(/api/transform) 무료 체험 횟수 제한 */
  const localFacePreviewQuotaActive = useMemo(
    () => isLocalFaceSwapDemo && !hasPurchased(video.id),
    [hasPurchased, isLocalFaceSwapDemo, video.id],
  );

  const [faceOptions, setFaceOptions] = useState<FacePickerOption[]>([]);
  const [draft, setDraft] = useState<CustomizeDraft | null>(null);
  const [duration, setDuration] = useState(0);
  /** idle: 아직 저장 안 함 · saving: 저장 중 · saved: 완료(문구 유지, 재저장 시 다시 saving → saved) */
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveInFlightRef = useRef(false);
  const [useAdvancedStep, setUseAdvancedStep] = useState(true);
  const [submitRemote, setSubmitRemote] = useState(false);
  const [remoteErr, setRemoteErr] = useState<string | null>(null);
  const [previewBgPrompt, setPreviewBgPrompt] = useState<string | null>(null);
  const [previewBgVideoUrl, setPreviewBgVideoUrl] = useState<string | null>(null);
  /** Flux 등으로 생성된 배경 이미지 URL(이미지 모드 미리보기 표시용) */
  const [previewBgImageUrl, setPreviewBgImageUrl] = useState<string | null>(null);
  /** 동영상 배경: RVM 전경 + 스톡 배경 합성 미리보기 */
  const [previewCompositeFgUrl, setPreviewCompositeFgUrl] = useState<string | null>(null);
  const [previewCompositeBgUrl, setPreviewCompositeBgUrl] = useState<string | null>(null);
  const [previewBgVersion, setPreviewBgVersion] = useState(0);
  const [incomingPreviewUrl, setIncomingPreviewUrl] = useState<string | null>(null);
  const [incomingVisible, setIncomingVisible] = useState(false);
  const [previewTransitionLoading, setPreviewTransitionLoading] = useState(false);
  const [previewCandidates, setPreviewCandidates] = useState<string[]>([]);
  const [previewCandidateIndex, setPreviewCandidateIndex] = useState(0);
  const [textPreviewEnabled, setTextPreviewEnabled] = useState(false);
  const [activeDragOverlayId, setActiveDragOverlayId] = useState<string | null>(null);
  const [facePreviewApplying, setFacePreviewApplying] = useState(false);
  const [backgroundPreviewApplying, setBackgroundPreviewApplying] = useState(false);
  const [facePreviewError, setFacePreviewError] = useState<string | null>(null);
  const [backgroundPreviewError, setBackgroundPreviewError] = useState<string | null>(null);
  const [backgroundPreviewInfo, setBackgroundPreviewInfo] = useState<string | null>(null);
  const [selectedFaceSourceUrl, setSelectedFaceSourceUrl] = useState<string | null>(
    null,
  );
  /** 로컬 샘플 클립 전용 — AI 얼굴 미리보기(/api/transform) 무료 체험 남은 횟수 */
  const [localFacePreviewRemaining, setLocalFacePreviewRemaining] = useState(
    FREE_LOCAL_FACE_PREVIEW_TRIES,
  );

  const [pollJobId, setPollJobId] = useState<string | null>(null);
  const [remoteJob, setRemoteJob] = useState<{
    id: string;
    status: string;
    stage?: string;
    progress: number;
    normalizedBackgroundPrompt?: string;
    outputVideoUrl?: string;
    error?: string;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgPromptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onFocus = () => setFaceOptions(buildFacePickerOptions());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    const opts = buildFacePickerOptions();
    setFaceOptions(opts);
    setDraft(loadDraft(video.id, opts));
    setSaveStatus("idle");
    saveInFlightRef.current = false;
  }, [video.id]);

  useEffect(() => {
    if (!localFacePreviewQuotaActive) return;
    setLocalFacePreviewRemaining(getLocalFacePreviewRemaining());
  }, [localFacePreviewQuotaActive]);

  useEffect(() => {
    if (faceOptions.length === 0 || !draft) return;
    const ok = faceOptions.some((o) => o.id === draft.faceOptionId);
    if (!ok) {
      setDraft((d) => (d ? { ...d, faceOptionId: faceOptions[0].id } : d));
    }
  }, [faceOptions, draft]);

  const selectedFace = useMemo(() => {
    if (!draft) return null;
    return faceOptions.find((o) => o.id === draft.faceOptionId) ?? faceOptions[0] ?? null;
  }, [draft, faceOptions]);

  useEffect(() => {
    setSelectedFaceSourceUrl(selectedFace?.src ?? null);
  }, [selectedFace]);

  const trimStart = draft?.trimStart ?? 0;
  const trimEnd = draft?.trimEnd ?? 0;
  const bgPreviewOn = Boolean(previewBgPrompt);
  const backgroundMode = draft?.backgroundMode ?? "video";
  const previewVideoSrc = previewBgVideoUrl ?? video.src;
  /** 이미지 모드: Flux 결과가 있으면 우선, 없으면 캐러셀에서 고른 이미지 URL */
  const previewBgDisplayImageUrl = useMemo(() => {
    if (backgroundMode !== "image" || !bgPreviewOn) return null;
    if (previewBgImageUrl) return previewBgImageUrl;
    if (previewBgVideoUrl && !looksLikeVideoUrl(previewBgVideoUrl)) {
      return previewBgVideoUrl;
    }
    return null;
  }, [backgroundMode, bgPreviewOn, previewBgImageUrl, previewBgVideoUrl]);
  const needsStartFramePoster =
    !bgPreviewOn &&
    (!video.poster?.trim() || isLocalPublicVideo(video.src));
  const startFramePoster = useVideoStartPoster(
    previewVideoSrc,
    needsStartFramePoster,
    { timeSec: 0.08, maxWidth: 720 },
  );
  const previewPoster = bgPreviewOn
    ? undefined
    : (startFramePoster ?? sanitizePosterSrc(video.poster));
  const randomBooster = useMemo(
    () => ["cinematic", "4k", "dramatic light", "b-roll", "wide shot", "aerial"],
    [],
  );
  const lastAutoAppliedKeywordRef = useRef<string>("");
  const preloadCacheRef = useRef<Set<string>>(new Set());
  const incomingCommitRef = useRef<number | null>(null);
  const prevBackgroundModeRef = useRef<"video" | "image" | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !draft || duration <= 0) return;
    const end = trimEnd > 0 ? trimEnd : duration;
    const start = Math.min(trimStart, end - 0.05);
    const loop = () => {
      if (v.currentTime < start || v.currentTime > end) {
        v.currentTime = start;
      }
    };
    v.addEventListener("timeupdate", loop);
    return () => v.removeEventListener("timeupdate", loop);
  }, [draft, duration, trimStart, trimEnd]);

  // 배경 모드(이미지/동영상) 전환 시, 이전 프리뷰 상태를 초기화해 혼란을 줄입니다.
  useEffect(() => {
    if (!draft) return;
    const current = draft.backgroundMode ?? "video";
    const prev = prevBackgroundModeRef.current;
    prevBackgroundModeRef.current = current;
    if (!prev || prev === current) return;

    setPreviewBgPrompt(null);
    setPreviewBgVideoUrl(null);
    setPreviewBgImageUrl(null);
    setPreviewCompositeFgUrl(null);
    setPreviewCompositeBgUrl(null);
    setIncomingPreviewUrl(null);
    setIncomingVisible(false);
    setPreviewTransitionLoading(false);
    setPreviewCandidates([]);
    setPreviewCandidateIndex(0);
    setFacePreviewError(null);
    setBackgroundPreviewError(null);
    setBackgroundPreviewInfo(null);
    setPreviewBgVersion((v) => v + 1);
    // 모드 전환 직후에는 자동 재적용을 막고, 사용자가 명시적으로 적용하도록 유지
    lastAutoAppliedKeywordRef.current = draft.backgroundPrompt.trim();
  }, [draft]);

  const onVideoCompositeReady = useCallback(() => {
    setPreviewTransitionLoading(false);
  }, []);

  const onVideoCompositeError = useCallback(() => {
    setPreviewTransitionLoading(false);
  }, []);

  const onVideoMeta = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const d = v.duration;
    if (!Number.isFinite(d) || d <= 0) return;
    setDuration(d);
    setDraft((prev) => {
      if (!prev) return prev;
      let nextEnd = prev.trimEnd > 0 ? prev.trimEnd : d;
      if (nextEnd > d) nextEnd = d;
      let nextStart = Math.min(prev.trimStart, nextEnd - 0.1);
      if (nextStart < 0) nextStart = 0;
      return { ...prev, trimStart: nextStart, trimEnd: nextEnd };
    });
  }, []);

  const trackBehavior = useCallback(
    (payload: {
      type: "background_preview_applied" | "font_selected" | "draft_saved";
      keyword?: string;
      mode?: "video" | "image";
      fontFamily?: string;
    }) => {
      void fetch("/api/analytics/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          videoId: video.id,
        }),
        keepalive: true,
      }).catch(() => {
        /* analytics fire-and-forget */
      });
    },
    [video.id],
  );

  const updateDraft = useCallback((patch: Partial<CustomizeDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const persist = useCallback(() => {
    if (!draft || saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setSaveStatus("saving");
    const minSpinnerMs = 320;
    window.setTimeout(() => {
      saveDraft(video.id, draft);
      markCustomizeDraftSaved(video.id);
      trackBehavior({
        type: "draft_saved",
        keyword: draft.backgroundPrompt,
        mode: draft.backgroundMode ?? "video",
      });
      for (const f of new Set(draft.overlays.map((o) => o.fontFamily).filter(Boolean))) {
        trackBehavior({
          type: "font_selected",
          fontFamily: f,
        });
      }
      setSaveStatus("saved");
      saveInFlightRef.current = false;
    }, minSpinnerMs);
  }, [draft, trackBehavior, video.id]);

  const submitServerGeneration = useCallback(async () => {
    if (!draft || !selectedFace) {
      setRemoteErr("얼굴을 선택해 주세요.");
      return;
    }
    setRemoteErr(null);
    setSubmitRemote(true);
    try {
      const res = await fetch("/api/reels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          faceImageUrl: selectedFace.src,
          draft,
        }),
      });
      const data = (await res.json()) as { jobId?: string; error?: string; status?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "request_failed");
      }
      if (data.jobId) {
        setPollJobId(data.jobId);
        setRemoteJob({
          id: data.jobId,
          status: data.status ?? "queued",
          stage: "queued",
          progress: 0,
        });
      }
    } catch (e) {
      setRemoteErr(e instanceof Error ? e.message : "요청 실패");
    } finally {
      setSubmitRemote(false);
    }
  }, [draft, selectedFace, video.id]);

  // 오프스크린 preload: 모드(영상/이미지)에 맞춰 로드
  const preloadVideoUrl = useCallback((url: string) => {
    if (!url || preloadCacheRef.current.has(url)) return;
    if (backgroundMode === "image") {
      const img = new Image();
      const done = () => {
        preloadCacheRef.current.add(url);
      };
      img.onload = done;
      img.onerror = done;
      img.src = url;
      return;
    }
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    const done = () => {
      preloadCacheRef.current.add(url);
      v.removeAttribute("src");
      v.load();
    };
    v.addEventListener("loadeddata", done, { once: true });
    v.addEventListener("error", done, { once: true });
    // 브라우저가 즉시 preload를 시작하도록 강제
    v.load();
  }, [backgroundMode]);

  /** 얼굴 스왑 미리보기만 (배경 Flux/검색 없음) */
  const applyFacePreview = useCallback(async () => {
    if (!draft) return;
    const faceUrl =
      (selectedFace?.src ?? selectedFaceSourceUrl)?.trim() || "";
    if (!faceUrl) {
      setFacePreviewError("얼굴 소스를 먼저 선택해 주세요.");
      return;
    }

    if (localFacePreviewQuotaActive && getLocalFacePreviewRemaining() <= 0) {
      setFacePreviewError(
        "무료 AI 얼굴 미리보기를 모두 사용했습니다. 릴스 상세에서 구매하면 계속 이용할 수 있어요.",
      );
      return;
    }

    setFacePreviewError(null);
    setFacePreviewApplying(true);
    setPreviewTransitionLoading(true);
    try {
      const targetVideoUrl = previewBgVideoUrl ?? video.src;
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceImageUrl: faceUrl,
          targetVideoUrl,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        outputVideoUrl?: string;
        error?: string;
        message?: string;
      };
      if (!res.ok || !data.outputVideoUrl) {
        throw new Error(data.message ?? data.error ?? "transform_failed");
      }
      setPreviewBgPrompt(null);
      setPreviewCandidates([]);
      setPreviewCandidateIndex(0);
      setPreviewBgImageUrl(null);
      setPreviewCompositeFgUrl(null);
      setPreviewCompositeBgUrl(null);
      setIncomingPreviewUrl(data.outputVideoUrl);
      setIncomingVisible(false);
      setPreviewBgVersion((v) => v + 1);
      if (localFacePreviewQuotaActive) {
        setLocalFacePreviewRemaining(consumeLocalFacePreviewSuccess());
      }
      trackBehavior({
        type: "background_preview_applied",
        keyword: "faceswap_only",
        mode: draft.backgroundMode ?? "video",
      });
    } catch (e) {
      setPreviewTransitionLoading(false);
      const raw =
        e instanceof Error ? e.message : "AI 합성에 실패했습니다.";
      setFacePreviewError(userFacingAiErrorMessage(raw));
    } finally {
      setFacePreviewApplying(false);
    }
  }, [
    draft,
    localFacePreviewQuotaActive,
    previewBgVideoUrl,
    selectedFace,
    selectedFaceSourceUrl,
    trackBehavior,
    video.src,
  ]);

  /** 배경 미리보기만 — 이미지: Flux만, 동영상: 스톡 검색만 (얼굴 스왑 없음) */
  const applyBackgroundPreview = useCallback(async (liveKeyword?: string) => {
    if (!draft) return;
    const keyword = (liveKeyword ?? draft.backgroundPrompt).trim();

    setBackgroundPreviewError(null);
    setBackgroundPreviewInfo(null);
    setBackgroundPreviewApplying(true);
    setPreviewTransitionLoading(true);
    try {
      if (backgroundMode === "image") {
        if (!keyword) {
          setBackgroundPreviewError("배경 프롬프트를 입력해 주세요.");
          setPreviewTransitionLoading(false);
          return;
        }
        const res = await fetch("/api/background-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: keyword }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          backgroundOutputUrl?: string | null;
          backgroundWarning?: string | null;
          error?: string;
          message?: string;
        };
        if (!res.ok) {
          throw new Error(data.message ?? data.error ?? "background_failed");
        }
        if (data.backgroundWarning) {
          setBackgroundPreviewInfo(data.backgroundWarning);
        }
        if (!data.backgroundOutputUrl) {
          setBackgroundPreviewError(
            data.backgroundWarning
              ? "현재 생성 요청이 많아 배경 이미지를 만들지 못했습니다. 잠시 후 다시 시도해 주세요."
              : userFacingAiErrorMessage(data.message ?? "배경 이미지를 생성하지 못했습니다."),
          );
          setPreviewTransitionLoading(false);
          return;
        }
        setPreviewBgPrompt(keyword);
        setPreviewCandidates([]);
        setPreviewCandidateIndex(0);
        setPreviewCompositeFgUrl(null);
        setPreviewCompositeBgUrl(null);
        setPreviewBgImageUrl(data.backgroundOutputUrl);
        setIncomingPreviewUrl(null);
        setIncomingVisible(false);
        setPreviewTransitionLoading(false);
        setPreviewBgVersion((v) => v + 1);
        trackBehavior({
          type: "background_preview_applied",
          keyword,
          mode: "image",
        });
        return;
      }

      /* 동영상 배경: 스톡 검색 + 영상 매팅으로 인물 뒤에 배경 합성 */
      if (!keyword) {
        setBackgroundPreviewError("배경 프롬프트를 입력해 주세요.");
        setPreviewTransitionLoading(false);
        return;
      }
      const subjectVideoUrl = previewBgVideoUrl ?? video.src;
      const res = await fetch("/api/preview/video-background-composite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectVideoUrl,
          backgroundKeyword: keyword,
          seed: 0,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        foregroundVideoUrl?: string;
        backgroundVideoUrl?: string;
        backgroundCandidates?: string[];
        error?: string;
        message?: string;
      };
      if (!res.ok || !data.foregroundVideoUrl || !data.backgroundVideoUrl) {
        throw new Error(data.message ?? data.error ?? "video_background_composite_failed");
      }
      const urls = (data.backgroundCandidates ?? []).filter(Boolean);
      setPreviewBgPrompt(keyword);
      setPreviewCandidates(urls.length ? urls : [data.backgroundVideoUrl]);
      setPreviewCandidateIndex(0);
      setPreviewBgImageUrl(null);
      setPreviewBgVideoUrl(null);
      setPreviewCompositeFgUrl(data.foregroundVideoUrl);
      setPreviewCompositeBgUrl(data.backgroundVideoUrl);
      setIncomingPreviewUrl(null);
      setIncomingVisible(false);
      setPreviewBgVersion((v) => v + 1);
      urls.forEach((u) => preloadVideoUrl(u));
      preloadVideoUrl(data.foregroundVideoUrl);
      preloadVideoUrl(data.backgroundVideoUrl);
      trackBehavior({
        type: "background_preview_applied",
        keyword,
        mode: "video",
      });
    } catch (e) {
      setPreviewTransitionLoading(false);
      const raw =
        e instanceof Error ? e.message : "배경 미리보기에 실패했습니다.";
      setBackgroundPreviewError(userFacingAiErrorMessage(raw));
    } finally {
      setBackgroundPreviewApplying(false);
    }
  }, [backgroundMode, draft, preloadVideoUrl, previewBgVideoUrl, trackBehavior, video.src]);

  // 키워드 입력 중 미리 후보를 받아와 백그라운드 preload
  useEffect(() => {
    if (!draft || !useAdvancedStep) return;
    const kw = draft.backgroundPrompt.trim();
    if (kw.length < 2) return;
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/videos?q=${encodeURIComponent(kw)}&mode=${encodeURIComponent(backgroundMode)}&seed=0&limit=80&prefetch=1`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          items?: Array<{ videoUrl?: string; imageUrl?: string }>;
        };
        const urls = (data.items ?? [])
          .map((x) => (backgroundMode === "image" ? x.imageUrl : x.videoUrl))
          .filter((x): x is string => Boolean(x))
          .slice(0, 3);
        urls.forEach(preloadVideoUrl);
      } catch {
        /* ignore prefetch errors */
      }
    }, 220);
    return () => window.clearTimeout(id);
  }, [backgroundMode, draft, draft?.backgroundPrompt, useAdvancedStep, preloadVideoUrl]);

  // 자동 적용은 끄고, 버튼 클릭으로만 적용합니다.

  const showPrevBackground = useCallback(() => {
    if (previewCandidates.length <= 1) return;
    const nextIndex =
      (previewCandidateIndex - 1 + previewCandidates.length) %
      previewCandidates.length;
    const nextUrl = previewCandidates[nextIndex];
    setPreviewCandidateIndex(nextIndex);
    setPreviewTransitionLoading(true);
    setIncomingVisible(false);
    if (backgroundMode === "image") {
      setIncomingPreviewUrl(null);
      setPreviewBgImageUrl(null);
      setPreviewBgVideoUrl(nextUrl);
    } else if (previewCompositeFgUrl) {
      setPreviewCompositeBgUrl(nextUrl);
      setIncomingPreviewUrl(null);
    } else {
      setIncomingPreviewUrl(nextUrl);
    }
    preloadVideoUrl(nextUrl);
  }, [
    backgroundMode,
    previewCandidateIndex,
    previewCandidates,
    preloadVideoUrl,
    previewCompositeFgUrl,
  ]);

  const showNextBackground = useCallback(() => {
    if (previewCandidates.length <= 1) return;
    const nextIndex = (previewCandidateIndex + 1) % previewCandidates.length;
    const nextUrl = previewCandidates[nextIndex];
    setPreviewCandidateIndex(nextIndex);
    setPreviewTransitionLoading(true);
    setIncomingVisible(false);
    if (backgroundMode === "image") {
      setIncomingPreviewUrl(null);
      setPreviewBgImageUrl(null);
      setPreviewBgVideoUrl(nextUrl);
    } else if (previewCompositeFgUrl) {
      setPreviewCompositeBgUrl(nextUrl);
      setIncomingPreviewUrl(null);
    } else {
      setIncomingPreviewUrl(nextUrl);
    }
    preloadVideoUrl(nextUrl);
  }, [
    backgroundMode,
    previewCandidateIndex,
    previewCandidates,
    preloadVideoUrl,
    previewCompositeFgUrl,
  ]);

  useEffect(() => {
    if (!pollJobId) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch(`/api/reels/generate?jobId=${encodeURIComponent(pollJobId)}`);
        const data = (await res.json()) as {
          job?: {
            id: string;
            status: string;
            stage?: string;
            progress: number;
            normalizedBackgroundPrompt?: string;
            outputVideoUrl?: string;
            error?: string;
          };
        };
        if (cancelled || !data.job) return;
        setRemoteJob(data.job);
        if (data.job.status === "succeeded" || data.job.status === "failed") {
          setPollJobId(null);
        }
      } catch {
        /* ignore */
      }
    };

    void tick();
    const id = window.setInterval(tick, 1200);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pollJobId]);

  const addOverlay = useCallback(() => {
    setDraft((prev) => {
      if (!prev) return prev;
      const id = `o-${Date.now()}`;
      return {
        ...prev,
        overlays: [
          ...prev.overlays,
          {
            id,
            text: "새 텍스트",
            color: "#fafafa",
            fontFamily: FONT_PRETENDARD,
            fontSize: 18,
            topPct: 50,
            leftPct: 50,
            opacity: 1,
            shadow: 0.65,
            strokeWidth: 0,
            strokeColor: "#000000",
          },
        ],
      };
    });
  }, []);

  const patchOverlay = useCallback((id: string, patch: Partial<TextOverlay>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        overlays: prev.overlays.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      };
    });
  }, []);

  const removeOverlay = useCallback((id: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, overlays: prev.overlays.filter((o) => o.id !== id) };
    });
  }, []);

  const nudgeOverlay = useCallback((id: string, dx: number, dy: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        overlays: prev.overlays.map((o) =>
          o.id === id
            ? {
                ...o,
                leftPct: clampOverlayPosition((o.leftPct ?? 50) + dx),
                topPct: clampOverlayPosition((o.topPct ?? 50) + dy),
              }
            : o,
        ),
      };
    });
  }, []);

  if (!owned) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-black/30 px-6 py-14 text-center">
        <p className="text-[15px] font-semibold text-zinc-200">모션 권한 구매 후 이용할 수 있어요.</p>
        <p className="mt-2 text-[13px] text-zinc-500">릴스 구매 후 얼굴·배경·편집 설정을 저장할 수 있습니다.</p>
        <Link
          href={`/video/${video.id}`}
          className="mt-6 inline-flex rounded-full border border-reels-cyan/40 bg-reels-cyan/10 px-6 py-3 text-[14px] font-extrabold text-reels-cyan hover:bg-reels-cyan/18"
        >
          릴스 상세로 돌아가기
        </Link>
      </div>
    );
  }

  if (!draft) {
    return (
      <p className="py-16 text-center text-[14px] text-zinc-500">불러오는 중…</p>
    );
  }

  const dMax = duration > 0 ? duration : 100;
  const t0 = Math.min(trimStart, dMax - 0.1);
  const t1 = Math.max(Math.min(trimEnd > 0 ? trimEnd : dMax, dMax), t0 + 0.1);

  return (
    <div className="space-y-10">
      {isLocalFaceSwapDemo ? (
        <div className="rounded-xl border border-reels-cyan/25 bg-reels-cyan/10 px-4 py-3 text-[13px] leading-relaxed text-zinc-200">
          {hasPurchased(video.id) ? (
            <p>
              <span className="text-zinc-400">&gt;</span> AI 프리뷰: 제한 없이 이용 가능.{" "}
              <span className="text-zinc-400">(등록한 얼굴은 목록 최상단에 노출됩니다.)</span>
            </p>
          ) : localFacePreviewRemaining > 0 ? (
            <p>
              <span className="text-zinc-400">&gt;</span> AI 프리뷰: 무료{" "}
              <span className="font-extrabold text-reels-cyan/95">
                {localFacePreviewRemaining}회
              </span>{" "}
              가능.{" "}
              <span className="text-zinc-400">(등록한 얼굴은 목록 최상단에 노출됩니다.)</span>
            </p>
          ) : (
            <p>
              <span className="text-zinc-400">&gt;</span> AI 프리뷰: 무료 체험을 모두 사용했습니다.{" "}
              <Link
                href={`/video/${video.id}`}
                className="font-semibold text-reels-cyan/95 underline-offset-2 hover:underline"
              >
                릴스 상세
              </Link>
              에서 구매하면 계속 이용할 수 있습니다.{" "}
              <span className="text-zinc-400">(등록한 얼굴은 목록 최상단에 노출됩니다.)</span>
            </p>
          )}
        </div>
      ) : null}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] p-1">
          <button
            type="button"
            onClick={() => setUseAdvancedStep(false)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
              !useAdvancedStep
                ? "bg-reels-cyan/20 text-reels-cyan"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            퀵 생성 (Quick)
          </button>
          <button
            type="button"
            onClick={() => setUseAdvancedStep(true)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
              useAdvancedStep
                ? "bg-reels-cyan/20 text-reels-cyan"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            커스텀 편집 (Custom)
          </button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-12">
        <div className="min-w-0 lg:sticky lg:top-[calc(var(--header-height,220px)+0.75rem)] lg:self-start">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">미리보기</p>
          <div className="relative mx-auto mt-3 max-w-[280px]">
            <div
              className={`relative overflow-hidden rounded-xl border border-white/10 ${
                needsStartFramePoster && !startFramePoster && !bgPreviewOn
                  ? "bg-gradient-to-b from-zinc-900 via-zinc-950 to-black"
                  : "bg-black"
              } ${
                video.orientation === "portrait" ? "aspect-[9/16]" : "aspect-video w-full max-w-md"
              }`}
            >
              {backgroundMode === "video" &&
              bgPreviewOn &&
              previewCompositeFgUrl &&
              previewCompositeBgUrl ? (
                <VideoBackgroundComposite
                  key={`${previewCompositeFgUrl}::${previewCompositeBgUrl}::${previewBgVersion}`}
                  foregroundSrc={previewCompositeFgUrl}
                  backgroundSrc={previewCompositeBgUrl}
                  onReady={onVideoCompositeReady}
                  onError={onVideoCompositeError}
                />
              ) : backgroundMode === "image" && bgPreviewOn && previewBgDisplayImageUrl ? (
                <>
                  {/* 이미지 모드: Flux/캐러셀 이미지 URL만 img로 표시(영상 URL을 img에 넣지 않음) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={`${previewBgDisplayImageUrl}::${previewBgVersion}`}
                    src={previewBgDisplayImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onLoad={() => setPreviewTransitionLoading(false)}
                    onError={() => {
                      setPreviewTransitionLoading(false);
                      // 일시적인 로딩/코덱 이슈에서 사용자 혼란을 줄이기 위해 경고 문구는 노출하지 않음
                    }}
                  />
                </>
              ) : (
                <>
                  <video
                    key={`${previewVideoSrc}::${previewBgVersion}`}
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    poster={previewPoster}
                    src={previewVideoSrc}
                    playsInline
                    muted={bgPreviewOn}
                    autoPlay={bgPreviewOn}
                    loop={bgPreviewOn}
                    controls
                    preload={bgPreviewOn ? "metadata" : "auto"}
                    onLoadedMetadata={onVideoMeta}
                    onLoadedData={(e) => {
                      console.log("[BG PREVIEW] video loaded:", e.currentTarget.currentSrc);
                      if (bgPreviewOn) {
                        setPreviewTransitionLoading(false);
                        // 사용자가 재생 버튼을 누르지 않아도 즉시 재생되도록 강제 시도
                        const p = e.currentTarget.play();
                        if (p && typeof p.catch === "function") {
                          p.catch(() => {
                            /* autoplay 정책으로 막히면 무시 */
                          });
                        }
                      }
                    }}
                    onError={(e) => {
                      console.log("[BG PREVIEW] video error:", e.currentTarget.currentSrc);
                      // 일시적인 로딩/코덱 이슈에서 사용자 혼란을 줄이기 위해 경고 문구는 노출하지 않음
                      setPreviewTransitionLoading(false);
                    }}
                    onPlay={(e) => {
                      const v = e.currentTarget;
                      const start = Math.min(draft.trimStart, (duration || v.duration) - 0.1);
                      if (v.currentTime < start || v.currentTime > (draft.trimEnd || v.duration)) {
                        v.currentTime = Math.max(0, start);
                      }
                    }}
                  />
                  {incomingPreviewUrl ? (
                    <video
                      key={`${incomingPreviewUrl}::incoming`}
                      className={`absolute inset-0 z-[6] h-full w-full object-cover transition-opacity duration-500 ease-out ${
                        incomingVisible ? "opacity-100" : "opacity-0"
                      }`}
                      src={incomingPreviewUrl}
                      playsInline
                      muted
                      autoPlay
                      loop
                      preload="auto"
                      onLoadedData={(e) => {
                        const loadedSrc = e.currentTarget.currentSrc;
                        console.log("[BG PREVIEW] incoming loaded:", loadedSrc);
                        setIncomingVisible(true);
                        if (incomingCommitRef.current) {
                          window.clearTimeout(incomingCommitRef.current);
                        }
                        incomingCommitRef.current = window.setTimeout(() => {
                          setPreviewBgVideoUrl(incomingPreviewUrl);
                          setPreviewBgVersion((v) => v + 1);
                          setIncomingPreviewUrl(null);
                          setIncomingVisible(false);
                          setPreviewTransitionLoading(false);
                        }, 380);
                      }}
                      onError={() => {
                        setIncomingPreviewUrl(null);
                        setIncomingVisible(false);
                        setPreviewTransitionLoading(false);
                      }}
                    />
                  ) : null}
                </>
              )}
              {textPreviewEnabled
                ? draft.overlays.map((o) => (
                    <div
                      key={o.id}
                      className="pointer-events-none absolute z-[10] max-w-[88%] text-center font-extrabold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                      style={{
                        top: `${o.topPct}%`,
                        left: `${o.leftPct ?? 50}%`,
                        transform: "translate(-50%, -50%)",
                        color: o.color,
                        fontFamily: o.fontFamily,
                        fontSize: `${o.fontSize}px`,
                        opacity: o.opacity ?? 1,
                        WebkitTextStroke:
                          (o.strokeWidth ?? 0) > 0
                            ? `${o.strokeWidth}px ${o.strokeColor ?? "#000000"}`
                            : undefined,
                        textShadow: `0 2px 8px rgba(0,0,0,${0.85 * (o.shadow ?? 0.65)})`,
                      }}
                    >
                      {o.text}
                    </div>
                  ))
                : null}
              {bgPreviewOn ? (
                <>
                  <div
                    className="pointer-events-none absolute inset-0 z-[8] transition-opacity duration-300"
                    style={{ background: previewToneFromPrompt(previewBgPrompt ?? "") }}
                    aria-hidden
                  />
                  {previewTransitionLoading ? (
                    <div className="pointer-events-none absolute inset-0 z-[13] flex items-center justify-center bg-black/25">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 text-[11px] font-semibold text-zinc-100">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-reels-cyan" />
                        로딩 중...
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
            {bgPreviewOn && previewCandidates.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={showPrevBackground}
                  onMouseEnter={() => {
                    if (previewCandidates.length <= 1) return;
                    const idx =
                      (previewCandidateIndex - 1 + previewCandidates.length) %
                      previewCandidates.length;
                    preloadVideoUrl(previewCandidates[idx]);
                  }}
                  className="absolute -left-12 top-1/2 z-[14] -translate-y-1/2 pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-zinc-100 hover:bg-black/75"
                  aria-label="이전 배경 영상 보기"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={showNextBackground}
                  onMouseEnter={() => {
                    if (previewCandidates.length <= 1) return;
                    const idx = (previewCandidateIndex + 1) % previewCandidates.length;
                    preloadVideoUrl(previewCandidates[idx]);
                  }}
                  className="absolute -right-12 top-1/2 z-[14] -translate-y-1/2 pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-zinc-100 hover:bg-black/75"
                  aria-label="다음 배경 영상 보기"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>
          {selectedFace ? (
            <div className="mx-auto mt-4 flex max-w-[280px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedFace.src} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">선택한 얼굴</p>
                <p className="truncate text-[12px] font-semibold text-zinc-200">{selectedFace.label}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 space-y-8">
          <section className="reels-glass-card rounded-xl p-4 sm:p-5">
            <h2 className="text-[13px] font-extrabold text-zinc-100">얼굴 소스</h2>
            <p className="mt-1 text-[12px] text-zinc-500">
              <Link href="/mypage" className="text-reels-cyan/90 underline-offset-2 hover:underline">
                마이페이지
              </Link>
              에서 등록한 프로필이 있으면 맨 앞에 표시됩니다.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {faceOptions.map((o) => {
                const on = draft.faceOptionId === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setSelectedFaceSourceUrl(o.src);
                      updateDraft({ faceOptionId: o.id });
                    }}
                    className={`relative rounded-full p-0.5 ring-2 transition-shadow ${
                      on ? "ring-reels-cyan shadow-[0_0_14px_-4px_rgba(0,242,234,0.45)]" : "ring-transparent hover:ring-white/15"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.src} alt="" className="h-14 w-14 rounded-full object-cover" />
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
              얼굴만 고르면 영상이 바로 바뀌지 않습니다. 「선택 얼굴로 미리보기」는 얼굴 스왑만 실행합니다. 배경은 아래 「배경 AI 프롬프트」에서
              별도로 미리 적용할 수 있습니다.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={
                  facePreviewApplying ||
                  !selectedFace ||
                  (localFacePreviewQuotaActive && localFacePreviewRemaining <= 0)
                }
                onClick={() => void applyFacePreview()}
                className="rounded-lg border border-reels-cyan/35 bg-reels-cyan/10 px-3 py-1.5 text-[11px] font-semibold text-reels-cyan hover:bg-reels-cyan/18 disabled:opacity-50"
              >
                {facePreviewApplying
                  ? "합성 중…"
                  : localFacePreviewQuotaActive && localFacePreviewRemaining <= 0
                    ? "무료 체험 횟수 소진"
                    : "선택 얼굴로 미리보기"}
              </button>
            </div>
            {facePreviewError ? (
              <p className="mt-2 text-[11px] font-medium text-reels-crimson">{facePreviewError}</p>
            ) : null}
          </section>

          {useAdvancedStep ? (
            <>
              <section className="reels-glass-card rounded-xl p-4 sm:p-5">
            <h2 className="text-[13px] font-extrabold text-zinc-100">배경 AI 프롬프트</h2>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => updateDraft({ backgroundMode: "image" })}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  backgroundMode === "image"
                    ? "bg-reels-cyan/20 text-reels-cyan"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                이미지 배경
              </button>
              <button
                type="button"
                onClick={() => updateDraft({ backgroundMode: "video" })}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  backgroundMode === "video"
                    ? "bg-reels-cyan/20 text-reels-cyan"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                동영상 배경
              </button>
            </div>
            <p className="mt-1 text-[12px] text-zinc-500">
              원하는 장소·분위기를 짧고 명확하게 적어 주세요. (예: “저녁 네온 골목, 비, 시네마틱”)
            </p>
            <InputSection
              ref={bgPromptRef}
              value={draft.backgroundPrompt}
              onChange={(value) => updateDraft({ backgroundPrompt: value })}
              rows={3}
              placeholder="예: 골목"
            />
            <p className="mt-2 text-[11px] text-zinc-600">
              Tip: 장면 요소는 2~4개로 간단하게 쓰면 인물과 배경이 더 잘 어울립니다.
            </p>
            {backgroundMode === "video" ? (
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                동영상 배경은 왼쪽에 재생 중인 클립에서 사람을 분리한 뒤, 검색된 배경 영상을 뒤에 깔아 미리보기합니다. AI 처리에 시간이 걸릴 수
                있습니다.
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void applyBackgroundPreview(bgPromptRef.current?.value)}
                disabled={backgroundPreviewApplying}
                className="rounded-lg border border-reels-cyan/35 bg-reels-cyan/10 px-3 py-1.5 text-[11px] font-semibold text-reels-cyan hover:bg-reels-cyan/18 disabled:opacity-50"
              >
                {backgroundPreviewApplying ? "AI 적용 중..." : "미리 적용하기"}
              </button>
              {bgPreviewOn ? (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewBgPrompt(null);
                    setPreviewBgVideoUrl(null);
                    setPreviewBgImageUrl(null);
                    setPreviewCompositeFgUrl(null);
                    setPreviewCompositeBgUrl(null);
                    setIncomingPreviewUrl(null);
                    setIncomingVisible(false);
                    setPreviewTransitionLoading(false);
                    setPreviewCandidates([]);
                    setPreviewCandidateIndex(0);
                    setPreviewBgVersion((v) => v + 1);
                    setBackgroundPreviewError(null);
                    setBackgroundPreviewInfo(null);
                  }}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-medium text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                >
                  미리보기 해제
                </button>
              ) : null}
              <p className="text-[11px] text-zinc-500">
                마음에 들지 않으면 해제하고 그대로 사용하셔도 됩니다.
              </p>
            </div>
            {backgroundPreviewError ? (
              <p className="mt-3 text-[11px] font-medium leading-relaxed text-reels-crimson">
                {backgroundPreviewError}
              </p>
            ) : null}
            {backgroundPreviewInfo ? (
              <p className="mt-2 text-[11px] font-medium leading-relaxed text-amber-200/95">
                {backgroundPreviewInfo}
              </p>
            ) : null}
              </section>

              <section className="reels-glass-card rounded-xl p-4 sm:p-5">
            <h2 className="text-[13px] font-extrabold text-zinc-100">구간 자르기</h2>
            <p className="mt-1 text-[12px] text-zinc-500">
              재생 구간을 지정하면 미리보기에서 그 범위만 반복됩니다.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400">시작 (초)</label>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, t1 - 0.1)}
                  step={0.05}
                  value={t0}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    updateDraft({ trimStart: v, trimEnd: Math.max(v + 0.1, t1) });
                  }}
                  className="mt-1 w-full accent-reels-cyan"
                />
                <p className="text-[11px] tabular-nums text-zinc-500">{t0.toFixed(2)}s</p>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400">끝 (초)</label>
                <input
                  type="range"
                  min={t0 + 0.1}
                  max={dMax}
                  step={0.05}
                  value={t1}
                  onChange={(e) => updateDraft({ trimEnd: Number(e.target.value) })}
                  className="mt-1 w-full accent-reels-cyan"
                />
                <p className="text-[11px] tabular-nums text-zinc-500">{t1.toFixed(2)}s</p>
              </div>
            </div>
              </section>

              <section className="reels-glass-card rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-extrabold text-zinc-100">텍스트 오버레이</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTextPreviewEnabled((v) => !v)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                    textPreviewEnabled
                      ? "border-reels-cyan/40 bg-reels-cyan/12 text-reels-cyan"
                      : "border-white/15 text-zinc-400 hover:border-reels-cyan/35 hover:text-zinc-200"
                  }`}
                >
                  {textPreviewEnabled ? "글씨 미리보기 해제" : "글씨 미리보기 적용"}
                </button>
                <button
                  type="button"
                  onClick={addOverlay}
                  className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-zinc-400 hover:border-reels-cyan/35 hover:text-zinc-200"
                >
                  + 추가
                </button>
              </div>
            </div>
            <p className="mt-1 text-[12px] text-zinc-500">글씨체·색상·크기와 위치를 게임 패드처럼 조절합니다.</p>
            <ul className="mt-4 space-y-4">
              {draft.overlays.map((o) => (
                <li key={o.id} className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <input
                    value={o.text}
                    onChange={(e) => patchOverlay(o.id, { text: e.target.value })}
                    className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[13px] text-zinc-100"
                    placeholder="문구 입력"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-[11px] text-zinc-500">
                      색
                      <input
                        type="color"
                        value={o.color}
                        onChange={(e) => patchOverlay(o.id, { color: e.target.value })}
                        className="h-8 w-10 cursor-pointer rounded border border-white/15 bg-transparent"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-zinc-500">
                      글씨체
                      <select
                        value={o.fontFamily}
                        onChange={(e) => {
                          patchOverlay(o.id, { fontFamily: e.target.value });
                          trackBehavior({
                            type: "font_selected",
                            fontFamily: e.target.value,
                          });
                        }}
                        className="rounded border border-white/15 bg-black/40 px-2 py-1 text-[11px] text-zinc-200"
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-1 items-center gap-2 text-[11px] text-zinc-500">
                      크기 {o.fontSize}px
                      <input
                        type="range"
                        min={10}
                        max={36}
                        value={o.fontSize}
                        onChange={(e) => patchOverlay(o.id, { fontSize: Number(e.target.value) })}
                        className="min-w-[100px] flex-1 accent-reels-cyan"
                      />
                    </label>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label className="flex flex-1 items-center gap-2 text-[11px] text-zinc-500">
                      불투명도 {Math.round((o.opacity ?? 1) * 100)}%
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round((o.opacity ?? 1) * 100)}
                        onChange={(e) => patchOverlay(o.id, { opacity: Number(e.target.value) / 100 })}
                        className="min-w-[100px] flex-1 accent-reels-cyan"
                      />
                    </label>
                    <label className="flex flex-1 items-center gap-2 text-[11px] text-zinc-500">
                      그림자 {Math.round((o.shadow ?? 0.65) * 100)}%
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round((o.shadow ?? 0.65) * 100)}
                        onChange={(e) => patchOverlay(o.id, { shadow: Number(e.target.value) / 100 })}
                        className="min-w-[100px] flex-1 accent-reels-cyan"
                      />
                    </label>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-[11px] text-zinc-500">
                      테두리 색
                      <input
                        type="color"
                        value={o.strokeColor ?? "#000000"}
                        onChange={(e) => patchOverlay(o.id, { strokeColor: e.target.value })}
                        className="h-8 w-10 cursor-pointer rounded border border-white/15 bg-transparent"
                      />
                    </label>
                    <label className="flex flex-1 items-center gap-2 text-[11px] text-zinc-500">
                      테두리 두께 {o.strokeWidth ?? 0}px
                      <input
                        type="range"
                        min={0}
                        max={6}
                        step={1}
                        value={o.strokeWidth ?? 0}
                        onChange={(e) => patchOverlay(o.id, { strokeWidth: Number(e.target.value) })}
                        className="min-w-[100px] flex-1 accent-reels-cyan"
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex flex-col gap-3 rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span>위치 패드 (드래그 + 1단위 미세 이동)</span>
                      <span className="tabular-nums">
                        X {Math.round(o.leftPct ?? 50)}% / Y {Math.round(o.topPct ?? 50)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        className={`relative h-28 w-28 rounded-full border border-white/15 bg-black/45 ${
                          activeDragOverlayId === o.id ? "ring-2 ring-reels-cyan/45" : ""
                        }`}
                        onPointerDown={(e) => {
                          const el = e.currentTarget;
                          el.setPointerCapture?.(e.pointerId);
                          setActiveDragOverlayId(o.id);
                          const r = el.getBoundingClientRect();
                          const cx = r.left + r.width / 2;
                          const cy = r.top + r.height / 2;
                          const dx = (e.clientX - cx) / (r.width / 2);
                          const dy = (e.clientY - cy) / (r.height / 2);
                          patchOverlay(o.id, {
                            leftPct: clampOverlayPosition(50 + dx * 45),
                            topPct: clampOverlayPosition(50 + dy * 45),
                          });
                        }}
                        onPointerMove={(e) => {
                          if (activeDragOverlayId !== o.id) return;
                          const el = e.currentTarget;
                          const r = el.getBoundingClientRect();
                          const cx = r.left + r.width / 2;
                          const cy = r.top + r.height / 2;
                          const dx = (e.clientX - cx) / (r.width / 2);
                          const dy = (e.clientY - cy) / (r.height / 2);
                          patchOverlay(o.id, {
                            leftPct: clampOverlayPosition(50 + dx * 45),
                            topPct: clampOverlayPosition(50 + dy * 45),
                          });
                        }}
                        onPointerUp={(e) => {
                          e.currentTarget.releasePointerCapture?.(e.pointerId);
                          setActiveDragOverlayId((id) => (id === o.id ? null : id));
                        }}
                        onPointerCancel={() => setActiveDragOverlayId((id) => (id === o.id ? null : id))}
                      >
                        <div className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 text-center text-[12px] text-zinc-400">↑</div>
                        <div className="absolute bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 text-center text-[12px] text-zinc-400">↓</div>
                        <div className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-center text-[12px] text-zinc-400">←</div>
                        <div className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-center text-[12px] text-zinc-400">→</div>
                        <div
                          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-reels-cyan/70 bg-reels-cyan/35 shadow-[0_0_10px_rgba(0,242,234,0.45)]"
                          style={{
                            left: `${o.leftPct ?? 50}%`,
                            top: `${o.topPct ?? 50}%`,
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <button type="button" onClick={() => nudgeOverlay(o.id, -1, -1)} className="rounded border border-white/15 px-2 py-1 text-[11px] text-zinc-300 hover:border-reels-cyan/35">↖</button>
                        <button type="button" onClick={() => nudgeOverlay(o.id, 0, -1)} className="rounded border border-white/15 px-2 py-1 text-[11px] text-zinc-300 hover:border-reels-cyan/35">↑</button>
                        <button type="button" onClick={() => nudgeOverlay(o.id, 1, -1)} className="rounded border border-white/15 px-2 py-1 text-[11px] text-zinc-300 hover:border-reels-cyan/35">↗</button>
                        <button type="button" onClick={() => nudgeOverlay(o.id, -1, 0)} className="rounded border border-white/15 px-2 py-1 text-[11px] text-zinc-300 hover:border-reels-cyan/35">←</button>
                        <button
                          type="button"
                          onClick={() => patchOverlay(o.id, { leftPct: 50, topPct: 50 })}
                          className="rounded border border-white/15 px-2 py-1 text-[11px] text-zinc-500 hover:border-reels-cyan/35"
                        >
                          •
                        </button>
                        <button type="button" onClick={() => nudgeOverlay(o.id, 1, 0)} className="rounded border border-white/15 px-2 py-1 text-[11px] text-zinc-300 hover:border-reels-cyan/35">→</button>
                        <button type="button" onClick={() => nudgeOverlay(o.id, -1, 1)} className="rounded border border-white/15 px-2 py-1 text-[11px] text-zinc-300 hover:border-reels-cyan/35">↙</button>
                        <button type="button" onClick={() => nudgeOverlay(o.id, 0, 1)} className="rounded border border-white/15 px-2 py-1 text-[11px] text-zinc-300 hover:border-reels-cyan/35">↓</button>
                        <button type="button" onClick={() => nudgeOverlay(o.id, 1, 1)} className="rounded border border-white/15 px-2 py-1 text-[11px] text-zinc-300 hover:border-reels-cyan/35">↘</button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOverlay(o.id)}
                    disabled={draft.overlays.length <= 1}
                    className="mt-2 text-[11px] font-medium text-zinc-600 hover:text-reels-crimson disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {draft.overlays.length <= 1 ? "기본 1개 유지" : "삭제"}
                  </button>
                </li>
              ))}
            </ul>
              </section>
            </>
          ) : (
            <div className="reels-glass-card rounded-xl p-4 sm:p-5">
              <p className="text-[13px] font-extrabold text-zinc-100">2단계 커스텀 편집</p>
              <p className="mt-1 text-[12px] text-zinc-500">
                지금은 건너뛰고 퀵 생성합니다. 필요하면 위 버튼에서 언제든 다시 켤 수 있어요.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={persist}
              disabled={saveStatus === "saving"}
              className="rounded-full bg-reels-cyan/20 px-6 py-3 text-[14px] font-extrabold text-reels-cyan ring-1 ring-reels-cyan/40 hover:bg-reels-cyan/28 disabled:cursor-not-allowed disabled:opacity-60"
            >
              임시 저장
            </button>
            {saveStatus === "saving" ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-reels-cyan">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                저장 중…
              </span>
            ) : saveStatus === "saved" ? (
              <span className="text-[12px] font-semibold text-reels-cyan">마이페이지에 임시 저장됨</span>
            ) : null}
            <button
              type="button"
              disabled={submitRemote || !selectedFace}
              onClick={submitServerGeneration}
              className="rounded-full border border-reels-crimson/40 bg-reels-crimson/15 px-5 py-3 text-[13px] font-extrabold text-reels-crimson hover:bg-reels-crimson/25 disabled:opacity-50"
            >
              {submitRemote ? "요청 중…" : "서버 생성 요청"}
            </button>
            <span className="text-[12px] font-semibold text-zinc-500">
              {useAdvancedStep
                ? "커스텀 편집 후 서버 생성 요청을 누르세요."
                : "퀵 생성 모드입니다. 바로 서버 생성 요청을 누르세요."}
            </span>
          </div>
          {!remoteJob ? (
            <p className="mt-3 max-w-xl text-[11px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              서버 생성은 백그라운드에서 진행돼요. 시작한 뒤에는 이 화면을 나가도 작업은 이어지며, 결과는{" "}
              <Link href="/mypage?tab=drafts" className="font-semibold text-reels-cyan/90 underline-offset-2 hover:underline">
                마이페이지 → 임시 저장
              </Link>
              에서 다시 열어볼 수 있어요.
            </p>
          ) : null}

          {remoteErr ? (
            <p className="mt-3 text-[12px] font-medium text-reels-crimson">{remoteErr}</p>
          ) : null}
          {remoteJob ? (
            <ServerGenerationStatusCard
              job={{
                jobId: remoteJob.id,
                status: remoteJob.status,
                progress: remoteJob.progress,
                outputVideoUrl: remoteJob.outputVideoUrl,
                error: remoteJob.error,
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
