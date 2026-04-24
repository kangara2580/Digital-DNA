"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { useAuthSession } from "@/hooks/useAuthSession";
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
import { safePlayVideo } from "@/lib/safeVideoPlay";
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

/** 임시 저장 시 미리보기 UI 상태를 함께 저장 — 이어서 편집 시 API 재호출 없이 복원 */
type PersistedPreviewV1 = {
  v: 1;
  useAdvancedStep: boolean;
  previewBgPrompt: string | null;
  previewBgVideoUrl: string | null;
  previewBgImageUrl: string | null;
  previewCompositeFgUrl: string | null;
  previewCompositeBgUrl: string | null;
  previewCandidates: string[];
  previewCandidateIndex: number;
  textPreviewEnabled: boolean;
};

function parsePersistedPreview(raw: unknown): PersistedPreviewV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<PersistedPreviewV1>;
  if (o.v !== 1) return null;
  const candidates = Array.isArray(o.previewCandidates)
    ? o.previewCandidates.filter((x): x is string => typeof x === "string")
    : [];
  const idx =
    typeof o.previewCandidateIndex === "number" && Number.isFinite(o.previewCandidateIndex)
      ? Math.max(0, Math.floor(o.previewCandidateIndex))
      : 0;
  return {
    v: 1,
    useAdvancedStep: o.useAdvancedStep !== false,
    previewBgPrompt: typeof o.previewBgPrompt === "string" ? o.previewBgPrompt : null,
    previewBgVideoUrl: typeof o.previewBgVideoUrl === "string" ? o.previewBgVideoUrl : null,
    previewBgImageUrl: typeof o.previewBgImageUrl === "string" ? o.previewBgImageUrl : null,
    previewCompositeFgUrl:
      typeof o.previewCompositeFgUrl === "string" ? o.previewCompositeFgUrl : null,
    previewCompositeBgUrl:
      typeof o.previewCompositeBgUrl === "string" ? o.previewCompositeBgUrl : null,
    previewCandidates: candidates,
    previewCandidateIndex: idx,
    textPreviewEnabled: o.textPreviewEnabled === true,
  };
}

function boolish(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "active";
}

/**
 * Supabase 메타데이터의 여러 필드명을 허용해 구독 활성 여부를 판정.
 * 실제 빌링 연동 시 단일 필드로 정리 예정.
 */
function hasAiSubscription(user: User | null): boolean {
  if (!user) return false;
  const metas: Array<Record<string, unknown> | undefined> = [
    user.user_metadata as Record<string, unknown> | undefined,
    user.app_metadata as Record<string, unknown> | undefined,
  ];

  for (const meta of metas) {
    if (!meta) continue;
    if (boolish(meta.aiSubscriptionActive) || boolish(meta.subscriptionActive)) return true;
    if (boolish(meta.isSubscribed) || boolish(meta.subscribed)) return true;
    const status = String(meta.subscriptionStatus ?? "").toLowerCase();
    if (status === "active" || status === "trialing") return true;
    const plan = String(meta.plan ?? meta.subscriptionPlan ?? "").toLowerCase();
    if (plan.includes("pro") || plan.includes("premium") || plan.includes("plus")) return true;
  }
  return false;
}

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

function loadDraft(
  videoId: string,
  options: FacePickerOption[],
): { draft: CustomizeDraft; persistedPreview: PersistedPreviewV1 | null } {
  try {
    const raw = localStorage.getItem(getCustomizeDraftStorageKey(videoId));
    if (!raw) throw new Error("empty");
    const j = JSON.parse(raw) as Record<string, unknown>;
    if (!j || typeof j !== "object") throw new Error("bad");
    const persistedPreview = parsePersistedPreview(j.persistedPreview);
    const faceOk =
      typeof j.faceOptionId === "string" &&
      j.faceOptionId &&
      options.some((o) => o.id === j.faceOptionId);
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
      draft: {
        faceOptionId: faceOk ? (j.faceOptionId as string) : options[0]?.id ?? null,
        backgroundMode,
        backgroundPrompt,
        trimStart: typeof j.trimStart === "number" ? j.trimStart : 0,
        trimEnd: typeof j.trimEnd === "number" ? j.trimEnd : 0,
        overlays: normalizedOverlays,
      },
      persistedPreview,
    };
  } catch {
    return {
      draft: {
        faceOptionId: options[0]?.id ?? null,
        backgroundMode: "video",
        backgroundPrompt: "",
        trimStart: 0,
        trimEnd: 0,
        overlays: defaultOverlays(),
      },
      persistedPreview: null,
    };
  }
}

function saveDraft(videoId: string, d: CustomizeDraft, persistedPreview: PersistedPreviewV1) {
  try {
    const blob = { ...d, persistedPreview };
    localStorage.setItem(getCustomizeDraftStorageKey(videoId), JSON.stringify(blob));
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

const quickBuyButtonClass =
  "inline-flex shrink-0 items-center justify-center rounded-full border border-reels-crimson/45 bg-reels-crimson/15 px-4 py-2.5 text-[12px] font-extrabold text-reels-crimson shadow-[0_0_20px_-8px_rgba(255,0,85,0.4)] transition hover:bg-reels-crimson/25 md:self-auto";

export function PurchaseCustomizeStudio({
  video,
  heroTitle,
}: {
  video: FeedVideo;
  /** 창작 스튜디오 등 상단 제목 — 있으면 제목 행 오른쪽에 바로구매 버튼 배치 */
  heroTitle?: string;
}) {
  const { hasPurchased } = usePurchasedVideos();
  const { user } = useAuthSession();
  const subscriptionActive = useMemo(() => hasAiSubscription(user), [user]);
  const aiPreviewQuotaActive = false; // !subscriptionActive; (오류 우회를 위해 전면 무료 해제)
  const isLocalFaceSwapDemo = LOCAL_FACE_SWAP_VIDEO_IDS.includes(video.id);
  const owned = hasPurchased(video.id) || isLocalFaceSwapDemo;

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
  const [isAvatarConfirmed, setIsAvatarConfirmed] = useState(false);
  const [isBackgroundConfirmed, setIsBackgroundConfirmed] = useState(false);
  
  const [customUploadModalVisible, setCustomUploadModalVisible] = useState(false);
  const [customUploadSourceUrl, setCustomUploadSourceUrl] = useState<string | null>(null);
  const [customUploadAngles, setCustomUploadAngles] = useState<string[]>([]);
  const [isGeneratingAngles, setIsGeneratingAngles] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; index: number; type?: '3way' | 'full' } | null>(null);
  const [isFusionApplying, setIsFusionApplying] = useState(false);
  const [fusionResultUrl, setFusionResultUrl] = useState<string | null>(null);
  const [outfitPrompt, setOutfitPrompt] = useState<string>("");
  const [isGeneratingOutfit, setIsGeneratingOutfit] = useState(false);

  /** 비구독 사용자용 AI 미리보기 무료 체험 남은 횟수 */
  const [localFacePreviewRemaining, setLocalFacePreviewRemaining] = useState(
    FREE_LOCAL_FACE_PREVIEW_TRIES,
  );

  const [pollJobId, setPollJobId] = useState<string | null>(null);
  const [isKlingGenerating, setIsKlingGenerating] = useState(false);
  const [klingHistory, setKlingHistory] = useState<any[]>([]);
  
  useEffect(() => {
     fetch("/api/kling/history")
        .then(r => r.json())
        .then(data => {
            const finishedVideos = data.filter((t: any) => t.status === "succeed" && t.videoUrl);
            setKlingHistory(finishedVideos);
        })
        .catch(console.error);
  }, []);

  const [klingJob, setKlingJob] = useState<{
    id: string;
    status: string;
    progress: number;
    outputVideoUrl?: string;
    error?: string;
  } | null>(null);
  const [klingPromptText, setKlingPromptText] = useState("Full-body motion transfer video. The specific character from [TARGET_IMAGE] performs the exact choreography, gestures, and fluid physical movements captured in the [REFERENCE_MOTION_VIDEO]. CRITICAL INSTRUCTION: You must COMPLETELY REMOVE and IGNORE any TikTok watermarks, UI overlays, text, or logos present in the reference video! The final output must look like pristine, raw camera footage. It is critical to maintain 100% character consistency: the person must have the identical face, hair style, and complete outfit as shown in [TARGET_IMAGE]. The lighting, background environment, and cinematic camera perspective of [TARGET_IMAGE] must be strictly preserved. Ensure the motion is natural and realistic without any warping.");
  const [characterOrientation, setCharacterOrientation] = useState<"image"|"video">("image");
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
  const lastAutoAppliedKeywordRef = useRef<string>("");
  const prevBackgroundModeRef = useRef<"video" | "image" | null>(null);

  useEffect(() => {
    const onFocus = () => setFaceOptions(buildFacePickerOptions());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    const opts = buildFacePickerOptions();
    setFaceOptions(opts);
    const loaded = loadDraft(video.id, opts);
    setDraft(loaded.draft);
    const p = loaded.persistedPreview;
    const mode = loaded.draft.backgroundMode ?? "video";
    prevBackgroundModeRef.current = mode;
    lastAutoAppliedKeywordRef.current = loaded.draft.backgroundPrompt.trim();

    if (p) {
      setUseAdvancedStep(true);
      setPreviewBgPrompt(p.previewBgPrompt);
      setPreviewBgVideoUrl(p.previewBgVideoUrl);
      setPreviewBgImageUrl(p.previewBgImageUrl);
      setPreviewCompositeFgUrl(p.previewCompositeFgUrl);
      setPreviewCompositeBgUrl(p.previewCompositeBgUrl);
      setPreviewCandidates(p.previewCandidates);
      setPreviewCandidateIndex(
        p.previewCandidates.length > 0
          ? Math.min(p.previewCandidateIndex, p.previewCandidates.length - 1)
          : 0,
      );
      setTextPreviewEnabled(p.textPreviewEnabled);
    } else {
      setUseAdvancedStep(true);
      setPreviewBgPrompt(null);
      setPreviewBgVideoUrl(null);
      setPreviewBgImageUrl(null);
      setPreviewCompositeFgUrl(null);
      setPreviewCompositeBgUrl(null);
      setPreviewCandidates([]);
      setPreviewCandidateIndex(0);
      setTextPreviewEnabled(false);
    }
    setIncomingPreviewUrl(null);
    setIncomingVisible(false);
    setPreviewTransitionLoading(false);
    setPreviewBgVersion((v) => v + 1);
    setFacePreviewError(null);
    setBackgroundPreviewError(null);
    setBackgroundPreviewInfo(null);
    setFacePreviewApplying(false);
    setBackgroundPreviewApplying(false);
    setSaveStatus("idle");
    setCustomUploadModalVisible(false);
    saveInFlightRef.current = false;
  }, [video.id]);

  useEffect(() => {
    if (!aiPreviewQuotaActive) return;
    setLocalFacePreviewRemaining(getLocalFacePreviewRemaining());
  }, [aiPreviewQuotaActive]);

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
  const backgroundMode = draft?.backgroundMode ?? "image";
  const previewVideoSrc = previewBgVideoUrl ?? video.src;
  /** 이미지 모드: Flux 결과가 있으면 우선, 없으면 캐러셀에서 고른 이미지 URL */
  const previewBgDisplayImageUrl = useMemo(() => {
    if (!bgPreviewOn) return null;
    if (previewBgImageUrl) return previewBgImageUrl;
    if (previewBgVideoUrl && !looksLikeVideoUrl(previewBgVideoUrl)) {
      return previewBgVideoUrl;
    }
    return null;
  }, [bgPreviewOn, previewBgImageUrl, previewBgVideoUrl]);
  const needsStartFramePoster = isLocalFaceSwapDemo || !video.poster?.trim();
  const startFramePoster = useVideoStartPoster(
    previewVideoSrc,
    needsStartFramePoster,
    { timeSec: 0.08, maxWidth: 720 },
  );
  const previewPoster = bgPreviewOn
    ? undefined
    : (startFramePoster ?? sanitizePosterSrc(video.poster));
  const preloadCacheRef = useRef<Set<string>>(new Set());
  const incomingCommitRef = useRef<number | null>(null);

  const handleNavEnlarged = useCallback((dir: 1 | -1, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!enlargedImage) return;
    
    if (enlargedImage.type === '3way') {
       if (customUploadAngles.length === 0) return;
       const nextIdx = (enlargedImage.index + dir + customUploadAngles.length) % customUploadAngles.length;
       setEnlargedImage({ url: customUploadAngles[nextIdx], index: nextIdx, type: '3way' });
    } else if (enlargedImage.type === 'full') {
       const list = [startFramePoster ?? sanitizePosterSrc(video.poster) ?? "", ...previewCandidates];
       if (list.length === 0) return;
       const nextIdx = (enlargedImage.index + dir + list.length) % list.length;
       setEnlargedImage({ url: list[nextIdx], index: nextIdx, type: 'full' });
    }
  }, [enlargedImage, customUploadAngles, previewCandidates, startFramePoster, video.poster]);

  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
        if (!enlargedImage) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNavEnlarged(1);
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') handleNavEnlarged(-1);
        if (e.key === 'Escape') setEnlargedImage(null);
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enlargedImage, handleNavEnlarged]);

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
      const persistedPreview: PersistedPreviewV1 = {
        v: 1,
        useAdvancedStep,
        previewBgPrompt,
        previewBgVideoUrl,
        previewBgImageUrl,
        previewCompositeFgUrl,
        previewCompositeBgUrl,
        previewCandidates,
        previewCandidateIndex,
        textPreviewEnabled,
      };
      saveDraft(video.id, draft, persistedPreview);
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
  }, [
    draft,
    trackBehavior,
    video.id,
    useAdvancedStep,
    previewBgPrompt,
    previewBgVideoUrl,
    previewBgImageUrl,
    previewCompositeFgUrl,
    previewCompositeBgUrl,
    previewCandidates,
    previewCandidateIndex,
    textPreviewEnabled,
  ]);

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

    if (aiPreviewQuotaActive && getLocalFacePreviewRemaining() <= 0) {
      setFacePreviewError(
        "무료 체험 1회를 모두 사용했습니다. AI 얼굴/배경은 구독 후 이용할 수 있어요.",
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
      if (aiPreviewQuotaActive) {
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
    aiPreviewQuotaActive,
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

    if (aiPreviewQuotaActive && getLocalFacePreviewRemaining() <= 0) {
      setBackgroundPreviewError(
        "무료 체험 1회를 모두 사용했습니다. AI 얼굴/배경은 구독 후 이용할 수 있어요.",
      );
      return;
    }

    setBackgroundPreviewError(null);
    setBackgroundPreviewInfo(null);
    setBackgroundPreviewApplying(true);
    setPreviewTransitionLoading(true);
    try {
      if (true) {
        if (!keyword) {
          setBackgroundPreviewError("배경 프롬프트를 입력해 주세요.");
          setPreviewTransitionLoading(false);
          return;
        }

        const sourceImage = startFramePoster || sanitizePosterSrc(video.poster) || "";

        const res = await fetch("/api/background-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: keyword, sourceImageUrl: sourceImage, orientation: video.orientation }),
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
        
        // 새로운 이미지를 리스트에 추가 (누적)
        setPreviewCandidates(prev => {
           if (!data.backgroundOutputUrl) return prev;
           return [...prev, data.backgroundOutputUrl];
        });
        
        setPreviewCompositeFgUrl(null);
        setPreviewCompositeBgUrl(null);
        setPreviewBgImageUrl(data.backgroundOutputUrl);
        setIncomingPreviewUrl(null);
        setIncomingVisible(false);
        setPreviewTransitionLoading(false);
        setPreviewBgVersion((v) => v + 1);
        if (aiPreviewQuotaActive) {
          setLocalFacePreviewRemaining(consumeLocalFacePreviewSuccess());
        }
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
      const imageUrl = (selectedFace?.src ?? selectedFaceSourceUrl)?.trim() || "";
      
      if (!imageUrl) {
        setBackgroundPreviewError("배경 영상으로 생성하기 전 얼굴 이미지를 먼저 선택해 주세요.");
        setPreviewTransitionLoading(false);
        return;
      }

      const res = await fetch("/api/kling/motion-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          videoUrl: subjectVideoUrl,
          prompt: keyword,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error ?? data.message ?? "kling_api_failed");
      }
      
      if (data.code !== 0) {
        throw new Error(data.message ?? "Kling API Error");
      }
      
      const taskId = data.data?.task_id || data.data?.task_info?.external_task_id || "unknown";
      setBackgroundPreviewInfo(`Kling 비디오 생성이 요청되었습니다! (Task: ${taskId})`);
      
      setPreviewBgPrompt(keyword);
      setPreviewTransitionLoading(false);
      if (aiPreviewQuotaActive) {
        setLocalFacePreviewRemaining(consumeLocalFacePreviewSuccess());
      }
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
  }, [
    aiPreviewQuotaActive,
    backgroundMode,
    draft,
    preloadVideoUrl,
    previewBgVideoUrl,
    trackBehavior,
    video.src,
  ]);

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
      {heroTitle ? (
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
          <div className="min-w-0 flex-1 pr-0 md:max-w-[min(100%,42rem)] md:pr-4">
            <h1 className="text-[clamp(1.35rem,4vw,1.875rem)] font-extrabold leading-tight tracking-tight text-zinc-100 sm:text-3xl">
              {heroTitle}
            </h1>
            <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-zinc-500 sm:text-[13px]">
              커스텀 편집으로 얼굴·배경을 만져 본 뒤, 생성만 이어가려면 오른쪽 <span className="font-semibold text-zinc-400">바로구매</span>를 누르세요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUseAdvancedStep(false)}
            className={`${quickBuyButtonClass} w-full max-w-xs self-stretch md:w-auto md:max-w-none md:flex-none md:self-start`}
          >
            바로구매
          </button>
        </header>
      ) : null}

      <div className="rounded-xl border border-reels-cyan/25 bg-reels-cyan/10 px-4 py-3 text-[13px] leading-relaxed text-zinc-200">
        {subscriptionActive ? (
          <p>
            <span className="text-zinc-400">&gt;</span> 구독 활성 상태: AI 얼굴/배경 기능을 사용할 수 있어요.{" "}
            <span className="text-zinc-400">(등록한 얼굴은 목록 최상단에 노출됩니다.)</span>
          </p>
        ) : localFacePreviewRemaining > 0 ? (
          <p>
            <span className="text-zinc-400">&gt;</span> AI 무료 체험{" "}
            <span className="font-extrabold text-reels-cyan/95">{localFacePreviewRemaining}회</span> 제공 후, 계속 사용하려면{" "}
            <Link href="/subscribe" className="font-semibold text-reels-cyan/95 underline-offset-2 hover:underline">
              구독
            </Link>
            이 필요합니다.
          </p>
        ) : (
          <p>
            <span className="text-zinc-400">&gt;</span> AI 무료 체험을 모두 사용했습니다.{" "}
            <Link href="/subscribe" className="font-semibold text-reels-cyan/95 underline-offset-2 hover:underline">
              구독
            </Link>
            후 AI 얼굴/배경 기능을 이용할 수 있습니다.
          </p>
        )}
      </div>
      {!heroTitle ? (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
          <p className="min-w-0 max-w-xl flex-1 text-[12px] leading-relaxed text-zinc-500 sm:text-[13px]">
            먼저 커스텀 편집으로 얼굴·배경을 만져 보세요. 바로 생성만 이어가려면 오른쪽{" "}
            <span className="font-semibold text-zinc-400">바로구매</span>를 누르면 됩니다.
          </p>
          <button
            type="button"
            onClick={() => setUseAdvancedStep(false)}
            className={`${quickBuyButtonClass} w-full max-w-xs self-stretch md:w-auto md:max-w-none md:flex-none md:self-auto`}
          >
            바로구매
          </button>
        </div>
      ) : null}

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
                      if (bgPreviewOn) {
                        setPreviewTransitionLoading(false);
                        // 사용자가 재생 버튼을 누르지 않아도 즉시 재생되도록 강제 시도
                        safePlayVideo(e.currentTarget);
                      }
                    }}
                    onError={(e) => {
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
          {useAdvancedStep && selectedFace ? (
            <div className="mx-auto mt-4 w-full max-w-[280px] rounded-xl border border-white/10 bg-white/[0.04] p-3 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedFace.src} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover border border-white/20" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">선택한 얼굴</p>
                  <p className="truncate text-[12px] font-semibold text-zinc-200">{selectedFace.label}</p>
                </div>
              </div>
              {selectedFace.aiAngles && selectedFace.aiAngles.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <p className="mb-2 text-[10px] font-bold text-zinc-400">AI 생성 3면도 (C.U)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedFace.aiAngles.map((angle, j) => (
                      <div key={j} className="relative w-full aspect-square overflow-hidden rounded-md border border-white/10 bg-black/50">
                        <img 
                          src={angle} 
                          alt="" 
                          className="absolute top-0 h-full max-w-none cursor-zoom-in transition hover:opacity-80" 
                          style={{ width: '300%', left: `-${j * 100}%`, objectFit: 'cover' }}
                          onClick={() => setEnlargedImage({ url: angle, index: j })} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 space-y-8">
          {useAdvancedStep ? (
          <section className="reels-glass-card rounded-xl p-4 sm:p-5 relative overflow-hidden">
            <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-zinc-100">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-reels-cyan text-[11px] font-black text-black">1</span>
              아바타 선택 (변환할 얼굴 소스)
            </h2>
            
            {isAvatarConfirmed ? (
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="relative group rounded-xl overflow-hidden shadow-lg border-2 border-reels-cyan">
                  <img src={selectedFaceSourceUrl ?? ""} alt="Confirmed Avatar" className="w-[120px] h-[120px] object-cover" />
                  <div className="absolute top-1 right-1 bg-reels-cyan text-black px-1.5 py-0.5 rounded text-[10px] font-bold">확정됨</div>
                  
                  {/* Hover Edit Overlay */}
                  <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setIsAvatarConfirmed(false)}
                      className="bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md border border-white/30"
                    >
                      변경하기
                    </button>
                  </div>
                </div>
                <p className="text-[12px] font-medium text-reels-cyan">아바타가 선택되었습니다.</p>
              </div>
            ) : (
            <>
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
                {/* 추가된 커스텀 업로드 + 버튼 */}
                <label className="relative flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-white/20 bg-white/5 transition-colors hover:border-reels-cyan/60 hover:bg-white/10">
                  <span className="text-2xl font-light text-zinc-400">+</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const dataUrl = event.target?.result as string;
                        if (dataUrl) {
                          setCustomUploadSourceUrl(dataUrl);
                          setCustomUploadAngles([]);
                          setCustomUploadModalVisible(true);
                        }
                      };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }}
                  />
                </label>
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
                    (aiPreviewQuotaActive && localFacePreviewRemaining <= 0)
                  }
                  onClick={() => void applyFacePreview()}
                  className="rounded-lg border border-reels-cyan/35 bg-reels-cyan/10 px-3 py-1.5 text-[11px] font-semibold text-reels-cyan hover:bg-reels-cyan/18 disabled:opacity-50"
                >
                  {facePreviewApplying
                    ? "합성 중…"
                    : aiPreviewQuotaActive && localFacePreviewRemaining <= 0
                      ? "무료 1회 소진 (구독 필요)"
                      : "선택 얼굴로 미리보기"}
                </button>
              </div>
              
              {/* 확정 버튼 */}
              {selectedFaceSourceUrl && (
                 <div className="mt-4 flex justify-end">
                    <button
                       onClick={() => {
                          setIsAvatarConfirmed(true);
                       }}
                       className="bg-reels-cyan text-black px-4 py-2 rounded-lg text-[12px] font-bold hover:bg-reels-cyan/90 transition-colors shadow-[0_0_15px_-3px_rgba(0,242,234,0.4)]"
                    >
                       이 아바타로 확정
                    </button>
                 </div>
              )}
              {facePreviewError ? (
                <p className="mt-2 text-[11px] font-medium text-reels-crimson">{facePreviewError}</p>
              ) : null}
            </>
            )}
          </section>
          ) : null}

          {useAdvancedStep ? (
            <>
              <section className="reels-glass-card rounded-xl p-4 sm:p-5 relative overflow-hidden">
            <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-zinc-100">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-reels-cyan text-[11px] font-black text-black">2</span>
              시공간 이동 (배경 변경)
            </h2>
            
            {isBackgroundConfirmed ? (
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="relative group rounded-xl overflow-hidden shadow-lg border-2 border-reels-cyan">
                  <img 
                    src={bgPreviewOn ? (previewBgImageUrl ?? previewBgVideoUrl ?? previewVideoSrc) : (startFramePoster ?? sanitizePosterSrc(video.poster) ?? "")} 
                    alt="Confirmed Background" 
                    className="w-[100px] h-[140px] sm:w-[140px] sm:h-[196px] object-cover" 
                  />
                  <div className="absolute top-1 right-1 bg-reels-cyan text-black px-1.5 py-0.5 rounded text-[10px] font-bold">확정됨</div>
                  
                  {/* Hover Edit Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEnlargedImage({ url: bgPreviewOn ? (previewBgImageUrl ?? previewBgVideoUrl ?? previewVideoSrc) : (startFramePoster ?? sanitizePosterSrc(video.poster) ?? ""), index: 0, type: 'full' })}
                      className="bg-reels-cyan/90 hover:bg-reels-cyan text-black text-[12px] font-bold px-4 py-2 rounded-full shadow-[0_0_15px_-3px_rgba(0,242,234,0.5)] transition-colors w-[80%]"
                    >
                      🔍 크게보기
                    </button>
                    <button 
                      onClick={() => setIsBackgroundConfirmed(false)}
                      className="bg-white/20 hover:bg-white/30 text-white text-[12px] font-bold px-4 py-2 rounded-full backdrop-blur-md border border-white/30 transition-colors w-[80%]"
                    >
                      🔄 변경하기
                    </button>
                  </div>
                </div>
                <p className="text-[12px] font-medium text-reels-cyan">({bgPreviewOn ? previewBgPrompt ?? "새로운 시공간" : "원본 시공간"}) 배경이 확정되었습니다.</p>
              </div>
            ) : (
            <>
            <div className="mt-5 flex flex-col sm:flex-row items-start gap-4">
              {/* 원본 영상(스타트 프레임) 직관적 표시 */}
              <div className="shrink-0 w-[100px] h-[140px] rounded-lg overflow-hidden border border-white/20 relative shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={startFramePoster ?? sanitizePosterSrc(video.poster) ?? ""} alt="Origin" className="absolute inset-0 w-full h-full object-cover bg-zinc-900" />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1.5 text-center text-[10px] text-zinc-200 font-bold tracking-wide backdrop-blur-sm">원본 스타트프레임</div>
              </div>
              
              <div className="flex-1 w-full flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] text-zinc-400">
                    원본의 배경을 지우고 어떤 시공간으로 보낼까요? (예: "밤의 네온 골목")
                  </p>
                  <button 
                     onClick={() => {
                        // 무한대의 조합을 생성하는 완전 랜덤 조합 알고리즘
                        const locations = ["subway station", "neon street alley", "boutique cafe", "luxury penthouse", "cyberpunk market", "abandoned warehouse", "modern art museum", "futuristic spaceport", "botanical greenhouse", "train cabin", "rooftop overlooking city", "zen temple garden", "neon lit arcade room", "royal palace hall", "underground speakeasy", "beachside cabana", "neon basketball court", "high-end fashion runway", "underwater research lab", "Victorian library"];
                        const times = ["at dusk", "at dawn", "at midnight", "at golden hour", "in bright daylight", "in deep night", "under twilight", "at sunset"];
                        const lighting = ["with cinematic rim lighting", "with neon glowing accents", "with warm ambient lighting", "with dappled sunlight filtering through", "with dramatic moody shadows", "with volumetric fog lighting", "with high contrast chiaroscuro", "with soft pastel glowing light", "with harsh cyberpunk strobe lights"];
                        const details = ["rain-slicked pavement", "complex glowing signs", "floating dust particles", "intricate architectural details", "lush exotic plants", "steampunk mechanical gears", "geometric glass reflections", "vintage interior design elements", "holographic billboards", "fog rolling over the ground", "falling cherry blossom petals", "scattered glowing debris"];
                        
                        const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
                        
                        let d1 = rand(details);
                        let d2 = rand(details);
                        while(d1 === d2) d2 = rand(details);
                        
                        const randomScenario = `A highly detailed, photorealistic ${rand(locations)} ${rand(times)}, ${rand(lighting)}. The scene features ${d1} and ${d2}. Cinematic composition, vivid colors, 8k resolution.`;
                        
                        void applyBackgroundPreview(randomScenario);
                     }}
                     className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-white/10 hover:bg-white/15 text-reels-cyan rounded-full transition-colors border border-reels-cyan/20"
                  >
                     ✨ 자동생성 (무작위)
                  </button>
                </div>
            <InputSection
              ref={bgPromptRef}
              value={draft.backgroundPrompt}
              onChange={(value) => updateDraft({ backgroundPrompt: value })}
              rows={3}
              placeholder="예: 골목"
            />
            <p className="mt-2 text-[11px] text-zinc-600">
              Tip: 장면 요소는 2~4개로 간단하게 쓰면 인물이 새 배경빛(Re-lighting)에 완벽하게 동화됩니다.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void applyBackgroundPreview(bgPromptRef.current?.value)}
                disabled={
                  backgroundPreviewApplying ||
                  (aiPreviewQuotaActive && localFacePreviewRemaining <= 0)
                }
                className="w-full sm:w-auto rounded-lg border border-reels-cyan/35 bg-reels-cyan/10 px-6 py-2.5 text-[13px] font-semibold text-reels-cyan hover:bg-reels-cyan/18 disabled:opacity-50"
              >
                {backgroundPreviewApplying
                  ? "AI 배경 생성 중..."
                  : aiPreviewQuotaActive && localFacePreviewRemaining <= 0
                    ? "무료 1회 소진 (구독 필요)"
                    : "생성하기"}
              </button>
                <p className="text-[11px] text-zinc-500">
                  Tip: 마음에 드는 이미지는 아래 갤러리에 저장됩니다. 자유롭게 비교해보세요.
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

            {/* 시공간 이동 결과물 갤러리 */}
            {bgPreviewOn || previewCandidates.length > 0 ? (
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-[12px] font-bold text-zinc-300 mb-3 flex items-center gap-2">
                  <span>🎨 생성된 시공간 갤러리</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-zinc-400 font-normal">탭하여 선택</span>
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                  {/* 옵션 1: 원본 반환 */}
                  <div className="snap-start shrink-0 cursor-pointer" onClick={() => {
                        setPreviewBgPrompt(null);
                        setPreviewBgVideoUrl(null);
                        setPreviewBgImageUrl(null);
                        setPreviewCompositeFgUrl(null);
                        setPreviewCompositeBgUrl(null);
                  }}>
                    <div className={`w-[80px] h-[110px] rounded-lg overflow-hidden border-2 relative transition ${!bgPreviewOn ? 'border-reels-cyan' : 'border-transparent hover:border-white/20'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={startFramePoster ?? sanitizePosterSrc(video.poster) ?? ""} className="absolute inset-0 w-full h-full object-cover" alt="original" />
                      
                      {/* Enlarge Button */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEnlargedImage({ url: startFramePoster ?? sanitizePosterSrc(video.poster) ?? "", index: 0, type: 'full' }); }}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                      >
                         <span className="bg-reels-cyan text-black px-2 py-1 rounded-full text-[10px] font-bold">🔍 확대</span>
                      </button>

                      {!bgPreviewOn && <div className="absolute top-1 right-1 bg-reels-cyan text-black px-1 rounded text-[9px] font-bold">선택됨</div>}
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center text-[10px] py-1">원본</div>
                    </div>
                  </div>

                  {/* 생성된 결과물 로딩 중.. */}
                  {backgroundPreviewApplying && (
                    <div className="snap-start shrink-0 w-[80px] h-[110px] rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center bg-white/5 opacity-50 pulse">
                       <span className="text-[10px] text-zinc-400 font-medium text-center px-2">시공간<br/>렌더링 중...</span>
                    </div>
                  )}

                  {/* 옵션 2: NanoBanana2 생성본 (누적 리스트) */}
                  {previewCandidates.map((imgUrl, idx) => {
                     const isSelected = bgPreviewOn && previewBgImageUrl === imgUrl;
                     return (
                        <div key={idx} className="snap-start shrink-0 cursor-pointer" onClick={() => {
                           setPreviewBgImageUrl(imgUrl);
                           setPreviewBgPrompt(draft?.backgroundPrompt || "선택된 시공간");
                        }}>
                          <div className={`w-[80px] h-[110px] rounded-lg overflow-hidden border-2 relative transition ${isSelected ? 'border-reels-cyan shadow-[0_0_12px_rgba(0,242,234,0.3)]' : 'border-transparent hover:border-white/20'}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imgUrl} className="absolute inset-0 w-full h-full object-cover" alt="generated" />
                            
                            {/* Enlarge Button */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEnlargedImage({ url: imgUrl, index: 0, type: 'full' }); }}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                            >
                               <span className="bg-reels-cyan text-black px-2 py-1 rounded-full text-[10px] font-bold">🔍 확대</span>
                            </button>
                            {isSelected && <div className="absolute top-1 right-1 bg-reels-cyan text-black px-1 rounded text-[9px] font-bold">선택됨</div>}
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center text-[10px] py-1 text-reels-cyan font-bold whitespace-nowrap overflow-hidden text-ellipsis">시공간 {idx + 1}</div>
                          </div>
                        </div>
                     );
                  })}
                </div>
              </div>
            ) : null}
            </div>
            </div>
            
            {/* 확정 버튼 (Step 2) */}
            <div className="mt-4 flex justify-end w-full border-t border-white/5 pt-4">
               <button
                  onClick={() => setIsBackgroundConfirmed(true)}
                  className="bg-reels-cyan text-black px-4 py-2 rounded-lg text-[12px] font-bold hover:bg-reels-cyan/90 transition-colors shadow-[0_0_15px_-3px_rgba(0,242,234,0.4)]"
               >
                  이 시공간으로 확정
               </button>
            </div>
            </>
            )}
              </section>

              <section className={`reels-glass-card rounded-xl p-4 sm:p-5 relative overflow-hidden transition-all duration-500 ${isAvatarConfirmed && isBackgroundConfirmed && !fusionResultUrl ? 'border-reels-cyan shadow-[0_0_20px_rgba(0,242,234,0.15)] ring-1 ring-reels-cyan' : 'border-white/10'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-reels-cyan/5 to-transparent pointer-events-none" />
                <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-zinc-100 mb-3">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-colors ${isAvatarConfirmed && isBackgroundConfirmed ? 'bg-reels-cyan text-black' : 'bg-white/10 text-zinc-500'}`}>3</span>
                  <span className={isAvatarConfirmed && isBackgroundConfirmed ? 'text-zinc-100' : 'text-zinc-500'}>DNA & 의상 융합 (최종 스타트 프레임 생성)</span>
                </h2>
                
                {!(isAvatarConfirmed && isBackgroundConfirmed) ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center opacity-50">
                     <p className="text-[12px] font-medium text-zinc-400">Step 1과 Step 2의 선택을 모두 확정해야 진행할 수 있습니다.</p>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col items-center">
                    {!fusionResultUrl ? (
                       <>
                         <div className="flex items-center justify-center gap-4 sm:gap-6 w-full mb-6 relative">
                            {/* Input 1: Avatar */}
                            <div className="flex flex-col items-center gap-2 z-10 w-1/3">
                               <div className="relative w-[70px] h-[70px] rounded-full p-1 bg-gradient-to-br from-reels-cyan to-reels-crimson shadow-lg shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={selectedFaceSourceUrl || ""} className="w-full h-full object-cover rounded-full bg-black" alt="Confirm Avatar" />
                               </div>
                               <span className="text-[10px] font-bold text-zinc-300 whitespace-nowrap">내 디지털 DNA</span>
                            </div>

                            {/* + icon */}
                            <span className="text-2xl text-zinc-500 font-light z-10 mx-[-10px]">+</span>

                            {/* Input 2: Background */}
                            <div className="flex flex-col items-center gap-2 z-10 w-1/3">
                               <div className="relative w-[60px] h-[80px] rounded-lg p-0.5 bg-gradient-to-br from-reels-cyan to-blue-500 shadow-lg shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={bgPreviewOn ? (previewBgImageUrl ?? previewVideoSrc) : (startFramePoster ?? sanitizePosterSrc(video.poster) ?? "")} className="w-full h-full object-cover rounded-md bg-black" alt="Confirm Background" />
                               </div>
                               <span className="text-[10px] font-bold text-zinc-300 text-center">배경 및 기본 포즈</span>
                            </div>

                            {/* + icon */}
                            <span className="text-2xl text-zinc-500 font-light z-10 mx-[-10px]">+</span>
                            
                            {/* Input 3: Outfit */}
                            <div className="flex flex-col items-center gap-2 z-10 w-1/3">
                               <div className="relative w-[60px] h-[60px] rounded-full p-0.5 border-2 border-dashed border-reels-cyan flex justify-center items-center shrink-0 bg-white/5">
                                  <span className="text-[20px]">👕</span>
                               </div>
                               <span className="text-[10px] font-bold text-zinc-300 text-center">나만의 커스텀 의상</span>
                            </div>

                            {/* Connecting Line */}
                            <div className="absolute top-[35px] w-3/4 border-t border-dashed border-white/20 -z-0"></div>
                         </div>

                         {/* Outfit Customization UI */}
                         <div className="w-full max-w-sm mb-6 bg-[#1A1A1A] border border-white/10 rounded-xl p-4 shadow-lg relative z-10">
                            <div className="flex justify-between items-center mb-2">
                               <label className="text-[12px] font-bold text-zinc-200 flex items-center gap-2">
                                   희망하는 의상 묘사
                                   <span className="text-[9px] bg-reels-cyan/20 text-reels-cyan px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">New</span>
                               </label>
                               <button 
                                 onClick={() => {
                                    setIsGeneratingOutfit(true);
                                    // Simulated Auto Generation (In real app, call LLM endpoint)
                                    setTimeout(() => {
                                       const suggestions = [
                                          "trendy cyberpunk techwear with neon glowing accents, highly detailed",
                                          "elegant black formal suit with white shirt and designer tie",
                                          "casual streetwear, oversized vintage hoodie, baggy cargo pants, stylish sneakers",
                                          "k-pop stage outfit, shiny leather jacket, metallic accessories, dynamic look"
                                       ];
                                       setOutfitPrompt(suggestions[Math.floor(Math.random() * suggestions.length)]);
                                       setIsGeneratingOutfit(false);
                                    }, 800);
                                 }}
                                 disabled={isGeneratingOutfit}
                                 className="text-[11px] font-bold text-reels-cyan hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50"
                               >
                                 ✨ AI 자동 의상 추천
                               </button>
                            </div>
                            <textarea 
                              value={outfitPrompt} 
                              onChange={(e) => setOutfitPrompt(e.target.value)} 
                              placeholder="(선택 사항) 원하는 의상을 영어로 입력해주세요. 예: casual jeans and white t-shirt. 입력하지 않으면 원본 댄서의 의상을 유지합니다." 
                              className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-[12px] text-zinc-300 focus:outline-none focus:border-reels-cyan transition-colors min-h-[70px] resize-none"
                            />
                         </div>

                         <button 
                           onClick={async () => {
                              if (!selectedFaceSourceUrl) return;
                              const bgUrl = bgPreviewOn ? (previewBgImageUrl ?? previewVideoSrc) : (startFramePoster ?? sanitizePosterSrc(video.poster) ?? "");
                              if (!bgUrl) return;
                              
                              setIsFusionApplying(true);
                              try {
                                  // Pass outfitPrompt to backend
                                  const res = await fetch("/api/fuse-dna", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                          avatarUrl: selectedFaceSourceUrl,
                                          backgroundUrl: bgUrl,
                                          outfitPrompt: outfitPrompt,
                                          backgroundPrompt: draft?.backgroundPrompt,
                                          orientation: video.orientation || "portrait"
                                      })
                                  });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.error || "Failed");
                                  setFusionResultUrl(data.fusionOutputUrl);
                              } catch (e) {
                                  alert("DNA 융합 실패: " + String(e));
                              } finally {
                                  setIsFusionApplying(false);
                              }
                           }}
                           disabled={isFusionApplying}
                           className="w-full sm:w-[90%] mx-auto py-3.5 bg-gradient-to-r from-reels-cyan to-[#0a84ff] rounded-xl font-extrabold text-black text-[14px] shadow-[0_0_24px_rgba(0,242,234,0.35)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 z-10 relative"
                         >
                            {isFusionApplying ? (
                               <>
                                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                 의상 적용 및 DNA 융합 중...
                               </>
                            ) : (
                               <>🧬 내 얼굴 + 추천 의상으로 프레임 융합 시작</>
                            )}
                         </button>
                         <p className="mt-3 text-[11px] text-zinc-500 text-center relative z-10 px-4">원본 댄서의 자세(Pose)를 복제한 후, 대표님의 얼굴과 원하는 의상을 합성하여 완벽한 모션 시작 프레임을 창조해 냅니다.</p>
                       </>
                    ) : (
                       <div className="w-full flex justify-center py-2 animate-fade-in">
                          <div className="relative group rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,242,234,0.3)] border-2 border-reels-cyan">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={fusionResultUrl} alt="Fusion Result" className="w-[140px] sm:w-[200px] aspect-[9/16] object-cover bg-black" />
                             
                             <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 pb-4 text-center">
                                <p className="text-[12px] font-extrabold text-reels-cyan uppercase tracking-wider">DNA Fusion Complete</p>
                             </div>

                             {/* Hover Overlay Buttons */}
                             <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <button 
                                  onClick={() => setEnlargedImage({ url: fusionResultUrl, index: 0, type: 'full' })}
                                  className="w-[85%] bg-reels-cyan text-black px-4 py-2.5 rounded-lg text-[12px] font-extrabold shadow-lg hover:bg-white transition-colors flex items-center justify-center gap-2"
                                >
                                   🔍 크게 보기
                                </button>
                                <button 
                                  onClick={() => setFusionResultUrl(null)}
                                  className="w-[85%] bg-white/20 text-white border border-white/30 px-4 py-2.5 rounded-lg text-[12px] font-bold shadow-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
                                >
                                   🔄 프롬프트 다시 수정하기
                                </button>
                             </div>
                          </div>
                       </div>
                    )}
                  </div>
                )}
              </section>

              <section className="reels-glass-card rounded-xl p-4 sm:p-5 relative overflow-hidden">
                <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-zinc-100 mb-5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-reels-cyan text-[11px] font-black text-black">4</span>
                  KLING AI 모션 렌더링
                </h2>
                
                <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                  {/* Left Box: Video */}
                  <div className="rounded-xl border border-white/10 bg-[#1A1A1A] overflow-hidden flex flex-col relative w-[150px] sm:w-[200px] shrink-0 aspect-[9/16] shadow-2xl">
                     <div className="absolute inset-0 z-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <video src={video.src} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent p-3 pt-4">
                           <p className="text-[10px] sm:text-[11px] font-bold tracking-wide text-zinc-300 drop-shadow-md leading-tight">Original Motion<br/><span className="text-zinc-500 font-medium">(Mimic Reference)</span></p>
                        </div>
                     </div>
                     <div className="px-3 py-3 bg-[#131313]/90 backdrop-blur-md z-10 flex flex-col gap-1.5 absolute bottom-0 w-full border-t border-white/10">
                        <div className="flex items-center gap-1.5">
                           <div className="w-3 h-3 rounded-full border border-reels-cyan flex items-center justify-center shrink-0">
                             <div className="w-1.5 h-1.5 rounded-full bg-reels-cyan"></div>
                           </div>
                           <span className="text-[10px] text-zinc-300 font-bold tracking-tight">원본 댄스 모션</span>
                        </div>
                     </div>
                  </div>

                  {/* Right Box: Image */}
                  <div className="rounded-xl border border-white/10 bg-[#1A1A1A] overflow-hidden flex flex-col relative w-[150px] sm:w-[200px] shrink-0 aspect-[9/16] shadow-2xl">
                     {fusionResultUrl ? (
                         <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={fusionResultUrl} alt="Target Character Image" className="w-full h-full object-contain pb-8" />
                            <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent p-3 pt-4">
                               <p className="text-[10px] sm:text-[11px] font-bold tracking-wide text-zinc-300 drop-shadow-md leading-tight">Target Frame<br/><span className="text-zinc-500 font-medium">(DNA Fusion)</span></p>
                            </div>
                         </div>
                     ) : (
                         <div className="flex flex-col items-center justify-center flex-1 w-full relative z-10 p-6 pt-8 pb-12">
                            <div className="mb-3 text-zinc-400 border border-white/10 rounded-lg p-2 border-dashed">
                               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            </div>
                            <p className="text-[11px] sm:text-[13px] font-semibold tracking-wide text-zinc-400 text-center">Step 3<br/>표면 융합 대기</p>
                         </div>
                     )}
                     <div className="absolute inset-0 z-0 opacity-5 pointer-events-none bg-dots-grid bg-[length:16px_16px]"></div>
                     <div className="px-3 py-3 bg-[#131313]/90 backdrop-blur-md z-10 flex flex-col gap-1.5 absolute bottom-0 w-full border-t border-white/10">
                        <div className="flex items-center gap-1.5">
                           <div className="w-3 h-3 rounded-full border border-reels-cyan flex items-center justify-center shrink-0">
                             <div className="w-1.5 h-1.5 rounded-full bg-reels-cyan"></div>
                           </div>
                           <span className="text-[10px] text-zinc-300 font-bold tracking-tight">최종 합성 이미지</span>
                        </div>
                     </div>
                  </div>
                </div>

                <p className="mt-5 text-[11.5px] text-zinc-500 leading-relaxed max-w-full break-keep relative z-10">
                  When Character Orientation matches the video, complex motions perform better; when it matches the image, camera movements are better supported. Please upload according to the <span className="underline cursor-pointer hover:text-zinc-300 transition-colors">Upload Guidelines</span>. For more skills, refer to the <span className="underline cursor-pointer hover:text-zinc-300 transition-colors">User Guide</span>.
                </p>

                <div className="mt-5 relative z-10">
                   <div className="flex items-center justify-between mb-2">
                       <p className="text-[12px] font-bold text-zinc-300">동작 프롬프트 (가이드)</p>
                       <div className="flex bg-[#111] border border-white/10 rounded-lg p-0.5 relative z-10">
                           <button 
                             onClick={() => setCharacterOrientation("image")}
                             className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${characterOrientation === "image" ? "bg-reels-cyan text-black shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}
                           >
                             📷 이미지 기준 (자연스러운 배경)
                           </button>
                           <button 
                             onClick={() => setCharacterOrientation("video")}
                             className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${characterOrientation === "video" ? "bg-reels-cyan text-black shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}
                           >
                             💃 댄스 모션 기준 (격렬한 춤)
                           </button>
                       </div>
                   </div>
                   <textarea id="klingPrompt" value={klingPromptText} onChange={(e) => setKlingPromptText(e.target.value)} placeholder="동작을 약간 가이드할 프롬프트를 입력하세요 (선택 사항)" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-[12px] text-zinc-200 focus:outline-none focus:border-reels-cyan transition-colors min-h-[120px] resize-none leading-relaxed"></textarea>
                </div>
                
                
                {klingJob ? (
                     <div className="mt-4 p-4 border border-reels-cyan/30 bg-reels-cyan/5 rounded-xl text-center">
                        <p className="text-[13px] font-bold text-reels-cyan mb-1">🚀 렌더링 파이프라인 가동 중</p>
                        <p className="text-[11px] text-zinc-400">아래 Step 5 섹션에서 실사진척도를 확인하세요.</p>
                     </div>
                ) : (
                   <button 
                     onClick={async () => {
                        if (!fusionResultUrl) {
                           alert("Step 3에서 먼저 DNA 융합 마법을 시작하여 이미지를 생성해주세요.");
                           return;
                        }
                        setIsKlingGenerating(true);
                        try {
                           const res = await fetch("/api/kling/motion-control", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                 imageUrl: fusionResultUrl,
                                 videoUrl: video.src,
                                 prompt: klingPromptText + ", one person only, solo dancer, exactly one character",
                                 characterOrientation: characterOrientation
                              })
                           });
                           const data = await res.json();
                           if (!res.ok) throw new Error(data.error || "KLING API 에러");
                           
                           const taskId = data.data?.task_id;
                           if (taskId) {
                               setKlingJob({ id: taskId, status: "queued", progress: 0 });
                               
                               // Start long-polling loop
                               const pollTask = async () => {
                                  try {
                                     const statusRes = await fetch(`/api/kling/task/${taskId}`);
                                     const statusData = await statusRes.json();
                                     console.log("Kling Polling:", statusData);
                                     
                                     const taskStatus = statusData?.data?.task_status; // 10 submitted, 50 processing, 99 succeed, 100 failed
                                     
                                     if (taskStatus === 99) {
                                         const finalVideoUrl = statusData?.data?.task_result?.videos?.[0]?.url;
                                         setKlingJob(prev => prev ? { ...prev, status: "succeeded", progress: 100, outputVideoUrl: finalVideoUrl } : null);
                                         setIsKlingGenerating(false);
                                     } else if (taskStatus === 100 || statusData.code !== 0) {
                                         setKlingJob(prev => prev ? { ...prev, status: "failed", error: statusData.message || "생성 실패" } : null);
                                         setIsKlingGenerating(false);
                                     } else {
                                         let prog = 10;
                                         if (taskStatus === 50) prog = 40 + Math.floor(Math.random() * 50); // Simulate progress
                                         setKlingJob(prev => prev ? { ...prev, progress: prog } : null);
                                         setTimeout(pollTask, 5000); // Poll every 5s
                                     }
                                  } catch (err) {
                                     setKlingJob(prev => prev ? { ...prev, status: "failed", error: "폴링 에러" } : null);
                                     setIsKlingGenerating(false);
                                  }
                               };
                               setTimeout(pollTask, 5000);
                           } else {
                               alert("Task ID 수신 실패");
                               setIsKlingGenerating(false);
                           }
                        } catch (err) {
                           alert("오류 발생: " + String(err));
                           setIsKlingGenerating(false);
                        }
                     }}
                     disabled={!fusionResultUrl || isKlingGenerating}
                     className="mt-4 w-full py-3.5 bg-white text-black rounded-lg font-bold text-[15px] hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                      {isKlingGenerating ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Task 전송 중...
                          </>
                      ) : (
                          <>🚀 KLING 모션 렌더링 시작</>
                      )}
                   </button>
                )}
              </section>

              {/* Step 5: Final Result UI */}
              {(klingJob || isKlingGenerating) && (
                  <section className="reels-glass-card rounded-xl p-4 sm:p-5 relative overflow-hidden ring-2 ring-reels-cyan shadow-[0_0_30px_rgba(0,242,234,0.15)] animate-fade-in-up mt-6">
                    <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-zinc-100 mb-5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-reels-cyan text-[11px] font-black text-black shadow-[0_0_10px_rgba(0,242,234,0.5)]">5</span>
                      최종 릴스 완성 및 다운로드
                    </h2>

                    {klingJob && klingJob.status !== "succeeded" && klingJob.status !== "failed" && (
                         <div className="mt-2 rounded-xl border border-reels-cyan/30 bg-reels-cyan/5 p-5 sm:p-6 shadow-inner">
                           <div className="flex flex-col items-center justify-center gap-3 mb-6">
                              <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-reels-cyan rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-reels-cyan">{klingJob.progress}%</div>
                              </div>
                              <h3 className="text-[14px] font-bold text-zinc-100 flex items-center gap-2">
                                 AI 슈퍼컴퓨터가 프레임을 합성 중입니다...
                              </h3>
                              <p className="text-[11px] text-zinc-400 text-center max-w-xs">
                                 고화질 렌더링에는 보통 5분에서 10분이 소요됩니다. 창을 닫아도 백그라운드에서 작업이 계속됩니다.
                              </p>
                           </div>
                           
                           <div className="h-3 w-full bg-[#111] rounded-full overflow-hidden border border-white/10 relative shadow-inner">
                             <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#0a84ff] via-reels-cyan to-[#0a84ff] bg-[length:200%_100%] transition-all duration-1000 ease-in-out origin-left animate-[gradient_2s_linear_infinite]" style={{ transform: `scaleX(${klingJob.progress / 100})` }}>
                             </div>
                           </div>
                         </div>
                    )}

                    {klingJob && klingJob.status === "succeeded" && klingJob.outputVideoUrl && (
                        <div className="mt-4 flex flex-col items-center animate-fade-in">
                            <div className="w-full flex justify-between items-end mb-4 px-1">
                                <div>
                                    <h3 className="text-[16px] font-extrabold text-reels-cyan">✨ 영상 생성의 마법이 끝났습니다!</h3>
                                    <p className="text-[11px] text-zinc-400 mt-1">생성된 릴스는 마이페이지 생명연구소에 자동 저장됩니다.</p>
                                </div>
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded flex items-center gap-1 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                    SUCCESS
                                </span>
                            </div>

                            <div className="w-[80%] max-w-[280px] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/10 relative group">
                                <video src={klingJob.outputVideoUrl} controls autoPlay loop playsInline className="w-full h-full object-cover aspect-[9/16]" />
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-bold tracking-wider">9:16 REELS</span>
                                </div>
                            </div>
                            
                            <div className="w-[80%] max-w-[280px] mt-5 space-y-3">
                                <a href={klingJob.outputVideoUrl} download target="_blank" rel="noreferrer" className="w-full py-4 bg-gradient-to-r from-reels-cyan to-[#0a84ff] text-black rounded-xl text-[14px] font-extrabold shadow-[0_0_20px_rgba(0,242,234,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    MP4 원본 다운로드
                                </a>
                                <button
                                    onClick={() => {
                                        if(confirm("기존 영상을 닫고, 현재 설정으로 영상을 다시 렌더링하시겠습니까?")) {
                                            setKlingJob(null);
                                        }
                                    }}
                                    className="w-full py-3 bg-[#1A1A1A] border border-white/10 text-zinc-300 rounded-xl text-[12px] font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                    프롬프트 수정 후 다시 만들기
                                </button>
                            </div>
                        </div>
                    )}

                    {klingJob && klingJob.status === "failed" && (
                         <div className="mt-4 rounded-xl border border-reels-crimson/30 bg-reels-crimson/5 p-5 text-center">
                            <div className="w-12 h-12 bg-reels-crimson/20 rounded-full flex items-center justify-center mx-auto mb-3 text-reels-crimson text-xl">⚠️</div>
                            <h3 className="text-[14px] font-bold text-zinc-100 mb-2">렌더링 중 문제가 발생했습니다</h3>
                            <p className="text-[12px] text-zinc-400 mb-4">{klingJob.error || "서버 통신 지연"}</p>
                            <button
                                onClick={() => setKlingJob(null)}
                                className="px-5 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-[12px] font-bold hover:bg-white/20 transition-colors"
                            >
                                다시 시도하기
                            </button>
                         </div>
                    )}
                  </section>
              )}

              {/* Step 6: History Gallery (Black Box) */}
              {klingHistory.length > 0 && (
                  <section className="reels-glass-card rounded-xl p-4 sm:p-5 relative overflow-hidden mt-6 border border-reels-cyan/30 shadow-[0_0_30px_rgba(0,242,234,0.1)]">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-reels-cyan rounded-full mix-blend-screen filter blur-[50px] opacity-20"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-reels-crimson rounded-full mix-blend-screen filter blur-[50px] opacity-10"></div>
                    
                    <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-zinc-100 mb-5 relative z-10">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-zinc-800 text-[10px] font-black text-white border border-zinc-600">📜</span>
                      이전 렌더링 완성본 목록 (내 릴스 보관함)
                    </h2>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
                        {klingHistory.map((hist, idx) => (
                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black aspect-[9/16] shadow-lg">
                                <video 
                                   src={hist.videoUrl} 
                                   className="w-full h-full object-cover" 
                                   controls 
                                   playsInline 
                                   muted 
                                />
                                <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pointer-events-none transition-opacity opacity-0 group-hover:opacity-100">
                                    <div className="max-w-[70%]">
                                        <p className="text-[9px] font-semibold text-white/50">{new Date(hist.time).toLocaleString()}</p>
                                    </div>
                                    <a 
                                      href={hist.videoUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="bg-reels-cyan/90 backdrop-blur text-black px-2 py-1 rounded text-[10px] font-bold z-10 pointer-events-auto hover:bg-white transition-colors shadow-lg"
                                    >
                                      크게 보기
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                  </section>
              )}

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
              <p className="text-[13px] font-extrabold text-zinc-100">커스텀 편집</p>
              <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                AI로 얼굴·배경을 바꾸고, 원하는 톤으로 다듬을 수 있어요. 생성만 빠르게 하려면 상단의 바로구매를 쓰면 됩니다.
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
                : "바로구매 모드입니다. 바로 서버 생성 요청을 누르세요."}
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

      {/* 3면도 생성 모달 (Refactored AI Multi-Shot Grid) */}
      {customUploadModalVisible && customUploadSourceUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 px-4 py-8 backdrop-blur-md">
          <div className="w-full max-w-5xl h-auto max-h-[90vh] rounded-xl bg-[#18191c] border border-white/5 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 shrink-0 bg-[#1e1f22]">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCustomUploadModalVisible(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-[17px] font-bold text-zinc-100">AI Multi-Shot</h3>
              </div>
              <button 
                onClick={() => setCustomUploadModalVisible(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            {/* Body */}
            <div className="flex flex-col md:flex-row gap-6 p-6 flex-1 overflow-y-auto">
              {/* Left: Main Reference */}
              <div className="flex-shrink-0 w-full md:w-[240px] flex flex-col gap-3">
                <div className="text-[14px] text-zinc-400">Main Reference</div>
                <div className="w-full aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={customUploadSourceUrl} alt="원본 피사체" className="w-full h-full object-cover" />
                </div>
              </div>
              
              {/* Right: Select favorite multi-shots */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <div className="text-[14px] text-zinc-400">Select your favorite multi-shots</div>
                  <div className="flex items-center gap-3">
                    {customUploadAngles.length > 0 && (
                      <button 
                        onClick={async () => {
                          setCustomUploadAngles([]);
                          setIsGeneratingAngles(true);
                          try {
                            const res = await fetch("/api/generate-angles", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ imageUrl: customUploadSourceUrl })
                            });
                            const data = await res.json();
                            if (data.success && data.resultAngles) {
                              setCustomUploadAngles(data.resultAngles);
                            } else {
                              alert("AI 생성 실패: " + (data.error || "알 수 없는 오류"));
                            }
                          } catch (err) {
                            console.error(err);
                            alert("네트워크 통신 오류가 발생했습니다.");
                          } finally {
                            setIsGeneratingAngles(false);
                          }
                        }}
                        className="text-[13px] text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
                        Generate Again
                      </button>
                    )}
                    <span className="text-[11px] text-zinc-400 bg-white/5 py-1 px-2.5 rounded-md border border-white/5">
                      Daily Free Use 3/3
                    </span>
                  </div>
                </div>

                <div className="flex-1 rounded-2xl bg-[#1e1f22] border border-white/5 p-4 sm:p-6 overflow-y-auto">
                  {/* Idle State - Before Generation */}
                  {customUploadAngles.length === 0 && !isGeneratingAngles && (
                    <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center">
                       <button 
                        onClick={async () => {
                          setIsGeneratingAngles(true);
                          setCustomUploadAngles([]);
                          try {
                            const res = await fetch("/api/generate-angles", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ imageUrl: customUploadSourceUrl })
                            });
                            const data = await res.json();
                            if (data.success && data.resultAngles) {
                              setCustomUploadAngles(data.resultAngles);
                            } else {
                              alert("AI 생성 실패: " + (data.error || "알 수 없는 오류"));
                            }
                          } catch (err) {
                            console.error(err);
                            alert("네트워크 통신 오류가 발생했습니다.");
                          } finally {
                            setIsGeneratingAngles(false);
                          }
                        }}
                        className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-colors"
                       >
                         Start AI Generation
                       </button>
                    </div>
                  )}

                  {/* Loading State */}
                  {isGeneratingAngles && (
                     <div className="w-full flex flex-col gap-6">
                        {/* Mock Skeleton Row */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-[#16171a] rounded-xl p-4 sm:p-5 border border-white/5">
                           <div className="flex-1 grid grid-cols-3 gap-3 w-full">
                              {[1, 2, 3].map(col => (
                                <div key={col} className="aspect-[3/4] rounded-xl bg-[#1c1d21] flex items-center justify-center">
                                   <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin"></div>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Generated Results View */}
                  {customUploadAngles.length > 0 && !isGeneratingAngles && (
                     <div className="w-full flex flex-col gap-4">
                        <div className="flex-1 grid grid-cols-3 gap-3 w-full">
                            {customUploadAngles.map((url, i) => (
                              <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/5 bg-black">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img 
                                     src={url} 
                                     alt={`Generated Angle ${i}`} 
                                     className="absolute top-0 h-full max-w-none cursor-zoom-in transition hover:opacity-80" 
                                     style={{ width: '300%', left: `-${i * 100}%`, objectFit: 'cover' }}
                                     onClick={() => setEnlargedImage({ url: url, index: i })} 
                                  />
                              </div>
                            ))}
                        </div>
                     </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-white/5 p-5 shrink-0 bg-[#1e1f22]">
              <button 
                onClick={() => setCustomUploadModalVisible(false)}
                className="rounded-lg border border-white/10 px-6 py-2.5 text-[14px] font-medium text-zinc-300 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const newId = `custom-${Date.now()}`;
                  setFaceOptions((prev) => [
                    ...prev,
                    { id: newId, label: '내 프로필 (AI 3면도)', src: customUploadSourceUrl!, aiAngles: customUploadAngles }
                  ]);
                  setSelectedFaceSourceUrl(customUploadSourceUrl);
                  updateDraft({ faceOptionId: newId });
                  setCustomUploadModalVisible(false);
                  
                  // 마이페이지에 영구 저장되도록 localStorage에 기록
                  if (customUploadSourceUrl) {
                     localStorage.setItem("reels-mypage-face-profile-v2", JSON.stringify({
                        kind: "ai",
                        source: customUploadSourceUrl,
                        generatedAt: Date.now()
                     }));
                  }
                }}
                className="rounded-lg bg-[#2e3138] disabled:opacity-50 px-6 py-2.5 text-[14px] font-semibold text-zinc-100 hover:bg-[#3f434c] transition-colors"
                disabled={customUploadAngles.length === 0 || isGeneratingAngles}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-zoom-out"
          onClick={() => setEnlargedImage(null)}
        >
          {/* Nav Buttons (only show if there's more than 1 item) */}
          {((enlargedImage.type === '3way' && customUploadAngles.length > 1) || (enlargedImage.type === 'full' && previewCandidates.length > 0)) && (
            <>
              <button 
                onClick={(e) => handleNavEnlarged(-1, e)}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all border border-white/10 z-10 hidden sm:block"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                onClick={(e) => handleNavEnlarged(1, e)}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all border border-white/10 z-10 hidden sm:block"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}

          {enlargedImage.type === 'full' ? (
             <div 
                className="relative w-full max-w-[90vw] md:max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
                onClick={(e) => e.stopPropagation()}
             >
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={enlargedImage.url} alt="Enlarged Full" className="w-auto h-auto max-w-full max-h-[85vh] object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-lg cursor-default" />
                 
                 {/* Info badge */}
                 <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
                    <span className="text-white text-[13px] font-medium tracking-wide">
                       {enlargedImage.index === 0 ? '원본 이미지' : `시공간 ${enlargedImage.index}`}
                    </span>
                 </div>
                 
                 {/* Mobile Swipe Tip */}
                 <div className="md:hidden absolute bottom-[-40px] text-white/50 text-[12px] font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    <span>키보드 방향키 또는 버튼으로 넘기기</span>
                 </div>
             </div>
          ) : (
             <div 
                className="relative w-[30vh] max-w-[80vw] aspect-[3/4] overflow-hidden rounded-xl shadow-2xl bg-black md:w-[45vh]"
                onClick={(e) => e.stopPropagation()}
             >
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img 
                 src={enlargedImage.url} 
                 alt="Enlarged" 
                 className="absolute top-0 h-full max-w-none drop-shadow-2xl"
                 style={{ width: '300%', left: `-${enlargedImage.index * 100}%`, objectFit: 'cover' }}
               />
             </div>
          )}
        </div>
      )}
    </div>
  );
}
