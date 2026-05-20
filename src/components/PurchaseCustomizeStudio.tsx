"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import type { FeedVideo } from "@/data/videos";
import { LOCAL_FACE_SWAP_VIDEO_IDS } from "@/constants/videos";
import { buildFacePickerOptions, type FacePickerOption } from "@/lib/facePickerOptions";
import { useAuthPromptModal } from "@/components/AuthPromptModalProvider";
import { markCustomizeDraftSaved } from "@/lib/customizeDraftIndex";
import {
  fetchRemoteCustomizeDraft,
  persistCustomizeDraft,
  pickNewerCustomizeDraft,
  readLocalCustomizeDraft,
  writeLocalCustomizeDraft,
  type CustomizeDraftBlob,
} from "@/lib/customizeDraftSync";
import { useStoredFaceProfile } from "@/hooks/useStoredFaceProfile";
import { buildPurchaseCompleteNextPath } from "@/lib/safePaymentNextPath";
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
import { TossCheckoutButton } from "@/components/payments/TossCheckoutButton";
import { VideoBackgroundComposite } from "@/components/VideoBackgroundComposite";
import { MYPAGE_OUTLINE_BTN_MD, MYPAGE_OUTLINE_BTN_MD_TRANSPARENT } from "@/lib/mypageOutlineCta";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  needsServerMp4Extraction,
  resolveKlingMotionVideoUrl,
} from "@/lib/klingMotionVideoUrl";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import {
  clonesRemaining,
  getCommerceMeta,
  isLimitedFamily,
} from "@/data/videoCommerce";
import { TrendingVideoStatsFooter } from "@/components/TrendingVideoStatsFooter";
import { SellerIdentityLink } from "@/components/SellerIdentityLink";
import { useVideoDisplayTitle } from "@/hooks/useVideoDisplayTitle";
import { useTranslation } from "@/hooks/useTranslation";
import { translate } from "@/lib/i18n/dictionaries";
import type { SiteLocale } from "@/lib/sitePreferences";

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

/** 빈 문자열이면 null — `<img src>` 에 빈 문자열을 넣지 않음 */
function nonEmptyImageSrc(u: string | null | undefined): string | null {
  if (u == null) return null;
  const t = String(u).trim();
  return t.length > 0 ? t : null;
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

function parseCustomizeDraftBlob(
  j: Record<string, unknown> | null,
  options: FacePickerOption[],
): { draft: CustomizeDraft; persistedPreview: PersistedPreviewV1 | null } {
  try {
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

function buildDraftBlob(
  d: CustomizeDraft,
  persistedPreview: PersistedPreviewV1,
): CustomizeDraftBlob {
  return { ...d, persistedPreview };
}

function looksLikeVideoUrl(url: string): boolean {
  const path = url.split("?")[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|mkv)$/.test(path);
}

/**
 * Replicate/HTTP 등에서 온 기술 메시지를 사용자용 한국어로만 바꿉니다.
 * (상태 코드, 도메인, 영문 JSON 노출 방지)
 */
function userFacingAiErrorMessage(raw: string, locale: SiteLocale): string {
  const lower = raw.toLowerCase();
  if (
    raw.includes("402") ||
    lower.includes("insufficient credit") ||
    lower.includes("payment required")
  ) {
    return translate(locale, "studio.err.credits");
  }
  if (
    raw.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("throttled") ||
    lower.includes("rate limit") ||
    lower.includes("replicate_rate_limited")
  ) {
    return translate(locale, "studio.err.rateLimit");
  }
  if (
    lower.includes("replicate_token_missing") ||
    lower.includes(".env.local") ||
    lower.includes("replicate api 토큰")
  ) {
    return translate(locale, "studio.err.aiUnavailable");
  }
  if (
    lower.includes("api.replicate.com") ||
    raw.includes('"detail"') ||
    /status["']?\s*:\s*\d{3}/.test(raw) ||
    raw.length > 200
  ) {
    return translate(locale, "studio.err.generic");
  }
  const trimmed = raw.trim();
  if (
    locale === "ko" &&
    /[\uac00-\ud7a3]/.test(trimmed) &&
    trimmed.length <= 140 &&
    !trimmed.includes("http") &&
    !/\b402\b|\b429\b|replicate/i.test(trimmed)
  ) {
    return trimmed;
  }
  if (locale === "en" && trimmed.length <= 140 && !trimmed.includes("http")) {
    return trimmed;
  }
  return translate(locale, "studio.err.generic");
}

/** 서버 생성 작업 상태 — API 값은 숨기고 한국어 안내만 노출 */
function reelsJobPresentation(status: string, locale: SiteLocale): {
  title: string;
  line: string;
  showMeter: boolean;
} {
  switch (status) {
    case "queued":
      return {
        title: translate(locale, "studio.job.queued.title"),
        line: translate(locale, "studio.job.queued.line"),
        showMeter: true,
      };
    case "running":
      return {
        title: translate(locale, "studio.job.running.title"),
        line: translate(locale, "studio.job.running.line"),
        showMeter: true,
      };
    case "succeeded":
      return {
        title: translate(locale, "studio.job.succeeded.title"),
        line: translate(locale, "studio.job.succeeded.line"),
        showMeter: false,
      };
    case "failed":
      return {
        title: translate(locale, "studio.job.failed.title"),
        line: translate(locale, "studio.job.failed.line"),
        showMeter: false,
      };
    default:
      return {
        title: translate(locale, "studio.job.default.title"),
        line: translate(locale, "studio.job.default.line"),
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
  const { t, locale } = useTranslation();
  const pres = reelsJobPresentation(job.status, locale as SiteLocale);
  const busy = job.status === "queued" || job.status === "running";
  const pct = Math.max(0, Math.min(100, Number(job.progress) || 0));
  const barPct = job.status === "queued" && pct < 4 ? 12 : Math.max(6, pct);

  return (
    <div className="mt-4 rounded-xl border border-reels-cyan/20 bg-gradient-to-br from-black/45 to-black/20 px-4 py-4 text-[13px] text-zinc-300">
      <p className="text-[11px] font-bold uppercase tracking-wide text-reels-cyan/90">
        {t("generation.badge")}
      </p>
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
            {t("generation.jobBanner.started")}{" "}
            <strong className="text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
              {t("generation.jobBanner.leavePage")}
            </strong>{" "}
            {t("generation.jobBanner.draftsLead")}{" "}
            <Link
              href="/mypage?tab=drafts"
              className="font-semibold text-reels-cyan underline-offset-2 hover:underline"
            >
              {t("generation.jobBanner.draftsLink")}
            </Link>{" "}
            {t("generation.jobBanner.draftsSuffix")}
          </p>
          <p className="mt-2">
            {t("generation.jobBanner.waitLead")}{" "}
            <Link
              href="/explore"
              className="font-semibold text-reels-cyan underline-offset-2 hover:underline"
            >
              {t("generation.jobBanner.exploreLink")}
            </Link>{" "}
            {t("generation.jobBanner.exploreSuffix")}
          </p>
        </div>
      ) : null}

      {job.status === "succeeded" && job.outputVideoUrl ? (
        <div className="mt-3">
          <Link
            href={`/generation/result/${encodeURIComponent(job.jobId)}`}
            className="inline-flex rounded-full border border-reels-cyan/40 bg-reels-cyan/15 px-4 py-2 text-[12px] font-bold text-reels-cyan hover:bg-reels-cyan/25"
          >
            {t("generation.jobBanner.viewResult")}
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
    return "linear-gradient(140deg, rgba(255,45,141,0.2), rgba(255,45,141,0.18))";
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

/** 마이페이지·설정 `MyPageSectionShell` / 탭 카드와 동일한 서피스 */
const STUDIO_SECTION_SURFACE =
  "rounded-2xl border border-white/10 bg-zinc-900/40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm";

/** 섹션 제목 — 설정 탭 `h2` / `MyPageSectionShell` 제목과 동일 톤 */
const STUDIO_SECTION_H2_ROW =
  "flex items-center gap-3 text-xl font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900";
const STUDIO_STEP_BADGE =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white bg-transparent text-[11px] font-semibold text-white [html[data-theme='light']_&]:border-zinc-400 [html[data-theme='light']_&]:bg-zinc-950";

/** 창작 스튜디오 히어로: 캡슐 안 좌·우 모드 — 공통 베이스(배경·호버는 선택/비선택에서 분기) */
const HERO_STUDIO_CAPSULE_BTN_BASE =
  "inline-flex shrink-0 items-center justify-center border-0 py-2.5 px-5 text-[calc(1.625rem_-_3pt)] font-semibold tracking-tight text-zinc-50 transition-[background-color,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/35 sm:px-6 sm:text-[calc(1.875rem_-_3pt)] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:focus-visible:ring-zinc-400/60";

/** 비선택: 투명 + 호버 시 하이라이트 */
const HERO_STUDIO_CAPSULE_BTN_IDLE =
  `${HERO_STUDIO_CAPSULE_BTN_BASE} bg-transparent hover:bg-white/[0.12] [html[data-theme='light']_&]:hover:bg-zinc-200/55`;

/** 선택됨: 호버와 동일 배경 유지(현재 모드 표시) */
const HERO_STUDIO_CAPSULE_BTN_SELECTED =
  `${HERO_STUDIO_CAPSULE_BTN_BASE} bg-white/[0.12] [html[data-theme='light']_&]:bg-zinc-200/55`;

export function PurchaseCustomizeStudio({
  video: initialVideo,
  heroTitle,
}: {
  video: FeedVideo;
  /** 창작 스튜디오 등 상단 제목 — 있으면 제목 바로 오른쪽에 「영상만 구매」 버튼 */
  heroTitle?: string;
}) {
  const [video, setVideo] = useState(initialVideo);
  useEffect(() => {
    setVideo(initialVideo);
  }, [initialVideo]);
  const { hasPurchased } = usePurchasedVideos();
  const { user, supabaseConfigured } = useAuthSession();
  const { openAuthModal } = useAuthPromptModal();
  const { profile: storedFaceProfile, setProfile: setStoredFaceProfile } =
    useStoredFaceProfile();
  const aiPreviewQuotaActive = false; // 구독 게이트 비활성화 시 항상 false
  const isLocalFaceSwapDemo = LOCAL_FACE_SWAP_VIDEO_IDS.includes(video.id);
  const owned = hasPurchased(video.id) || isLocalFaceSwapDemo;
  const { t, locale } = useTranslation();
  const displayTitle = useVideoDisplayTitle();

  const purchaseCommerceMeta = useMemo(
    () =>
      video.listing
        ? { salesCount: video.listing.salesCount, edition: "open" as const }
        : getCommerceMeta(video.id),
    [video],
  );
  const purchaseRankMetrics = useMemo(() => {
    if (video.listing) {
      const views = video.listing.views;
      const sales = video.listing.salesCount;
      const p = video.priceWon ?? 0;
      return {
        cumulativeRevenueWon: p * sales,
        totalViews: Math.max(0, views),
        totalLikes: Math.max(0, Math.floor(views * 0.028)),
        growthPercent: 0,
      };
    }
    return getMetricsForVideoDetail(video.id);
  }, [video]);
  const purchasePriceWon = video.priceWon ?? 0;
  const purchaseRemaining = clonesRemaining(purchaseCommerceMeta);
  const purchaseSoldOut =
    purchaseRemaining === 0 && isLimitedFamily(purchaseCommerceMeta.edition);

  const [faceOptions, setFaceOptions] = useState<FacePickerOption[]>([]);
  const [draft, setDraft] = useState<CustomizeDraft | null>(null);
  const [duration, setDuration] = useState(0);
  /** idle: 아직 저장 안 함 · saving: 저장 중 · saved: 완료(문구 유지, 재저장 시 다시 saving → saved) */
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftHydrating, setDraftHydrating] = useState(true);
  const saveInFlightRef = useRef(false);
  const autoSaveTimerRef = useRef<number | null>(null);
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
  const [backgroundPreviewApplying, setBackgroundPreviewApplying] = useState(false);
  const [backgroundPreviewError, setBackgroundPreviewError] = useState<string | null>(null);
  const [backgroundPreviewInfo, setBackgroundPreviewInfo] = useState<string | null>(null);
  const [facePreviewApplying, setFacePreviewApplying] = useState(false);
  const [facePreviewError, setFacePreviewError] = useState<string | null>(null);
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
            const list = Array.isArray(data)
              ? data
              : Array.isArray((data as { items?: unknown[] })?.items)
                ? (data as { items: unknown[] }).items
                : [];
            const finishedVideos = list.filter(
              (t: { status?: string; videoUrl?: string; outputUrl?: string }) =>
                (t?.status === "succeed" ||
                  t?.status === "succeeded" ||
                  t?.status === "done") &&
                (t?.videoUrl || t?.outputUrl),
            );
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

  const applyLoadedDraft = useCallback(
    (loaded: {
      draft: CustomizeDraft;
      persistedPreview: PersistedPreviewV1 | null;
    }) => {
      setDraft(loaded.draft);
      const p = loaded.persistedPreview;
      const mode = loaded.draft.backgroundMode ?? "video";
      prevBackgroundModeRef.current = mode;
      lastAutoAppliedKeywordRef.current = loaded.draft.backgroundPrompt.trim();

      if (p) {
        if (owned) setUseAdvancedStep(p.useAdvancedStep);
        else setUseAdvancedStep(false);
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
      } else {
        setUseAdvancedStep(owned);
        setPreviewBgPrompt(null);
        setPreviewBgVideoUrl(null);
        setPreviewBgImageUrl(null);
        setPreviewCompositeFgUrl(null);
        setPreviewCompositeBgUrl(null);
        setPreviewCandidates([]);
        setPreviewCandidateIndex(0);
      }
      setIncomingPreviewUrl(null);
      setIncomingVisible(false);
      setPreviewTransitionLoading(false);
      setPreviewBgVersion((v) => v + 1);
      setFacePreviewError(null);
      setFacePreviewApplying(false);
      setBackgroundPreviewError(null);
      setBackgroundPreviewInfo(null);
      setBackgroundPreviewApplying(false);
      setCustomUploadModalVisible(false);
    },
    [owned],
  );

  useEffect(() => {
    if (!owned) setUseAdvancedStep(false);
  }, [owned, video.id]);

  useEffect(() => {
    const onFocus = () => {
      setFaceOptions((prev) => {
        const base = buildFacePickerOptions(storedFaceProfile);
        const customs = prev.filter((o) => o.id.startsWith("custom-"));
        return [...base, ...customs];
      });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [storedFaceProfile]);

  useEffect(() => {
    let cancelled = false;
    setDraftHydrating(true);
    setSaveStatus("idle");
    setSaveError(null);
    saveInFlightRef.current = false;

    const opts = buildFacePickerOptions(storedFaceProfile);
    setFaceOptions(opts);

    const localBlob = readLocalCustomizeDraft(video.id);

    void (async () => {
      let merged = localBlob;
      if (user && supabaseConfigured) {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const remoteBlob = await fetchRemoteCustomizeDraft(
            supabase,
            user.id,
            video.id,
          );
          merged = pickNewerCustomizeDraft(localBlob, remoteBlob);
          if (remoteBlob && merged === remoteBlob && merged) {
            writeLocalCustomizeDraft(video.id, merged);
          }
        }
      }
      if (cancelled) return;
      const parsed = parseCustomizeDraftBlob(merged, opts);
      applyLoadedDraft(parsed);
      setDraftHydrating(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    applyLoadedDraft,
    storedFaceProfile,
    supabaseConfigured,
    user,
    video.id,
  ]);

  useEffect(() => {
    if (useAdvancedStep) return;
    setRemoteJob(null);
    setPollJobId(null);
    setRemoteErr(null);
  }, [useAdvancedStep]);

  useEffect(() => {
    if (!aiPreviewQuotaActive) return;
    setLocalFacePreviewRemaining(getLocalFacePreviewRemaining());
  }, [aiPreviewQuotaActive]);

  useEffect(() => {
    if (!draft) return;
    if (faceOptions.length === 0) {
      if (draft.faceOptionId != null) {
        setDraft((d) => (d ? { ...d, faceOptionId: null } : d));
      }
      return;
    }
    const ok = faceOptions.some((o) => o.id === draft.faceOptionId);
    if (!ok) {
      setDraft((d) => (d ? { ...d, faceOptionId: faceOptions[0]?.id ?? null } : d));
    }
  }, [faceOptions, draft]);

  const selectedFace = useMemo(() => {
    if (!draft) return null;
    return faceOptions.find((o) => o.id === draft.faceOptionId) ?? faceOptions[0] ?? null;
  }, [draft, faceOptions]);

  useEffect(() => {
    setSelectedFaceSourceUrl(selectedFace?.src ?? null);
  }, [selectedFace]);

  const effectiveFaceImageUrl = useMemo(
    () => nonEmptyImageSrc(selectedFace?.src ?? selectedFaceSourceUrl),
    [selectedFace, selectedFaceSourceUrl],
  );

  const trimStart = draft?.trimStart ?? 0;
  const trimEnd = draft?.trimEnd ?? 0;
  const bgPreviewOn = Boolean(previewBgPrompt);
  const backgroundMode = draft?.backgroundMode ?? "image";
  const motionReferenceUrl = useMemo(
    () => resolveKlingMotionVideoUrl(video, previewBgVideoUrl),
    [video, previewBgVideoUrl],
  );
  const previewVideoSrc = motionReferenceUrl;
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
  const originFrameThumbUrl = useMemo(
    () => nonEmptyImageSrc(startFramePoster ?? sanitizePosterSrc(video.poster)),
    [startFramePoster, video.poster],
  );
  const confirmedBackgroundThumbUrl = useMemo(
    () =>
      bgPreviewOn
        ? nonEmptyImageSrc(previewBgImageUrl ?? previewBgVideoUrl ?? previewVideoSrc)
        : originFrameThumbUrl,
    [
      bgPreviewOn,
      previewBgImageUrl,
      previewBgVideoUrl,
      previewVideoSrc,
      originFrameThumbUrl,
    ],
  );
  const fusionBgThumbUrl = useMemo(
    () =>
      bgPreviewOn
        ? nonEmptyImageSrc(previewBgImageUrl ?? previewVideoSrc)
        : originFrameThumbUrl,
    [bgPreviewOn, previewBgImageUrl, previewVideoSrc, originFrameThumbUrl],
  );
  const confirmedAvatarThumbUrl = useMemo(
    () => nonEmptyImageSrc(selectedFaceSourceUrl),
    [selectedFaceSourceUrl],
  );
  const previewPoster = bgPreviewOn
    ? undefined
    : (nonEmptyImageSrc(startFramePoster ?? sanitizePosterSrc(video.poster)) ?? undefined);
  const preloadCacheRef = useRef<Set<string>>(new Set());
  const incomingCommitRef = useRef<number | null>(null);

  useEffect(() => {
    if (!needsServerMp4Extraction(video)) return;
    if (!video.listing?.sellerId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token || cancelled) return;
      try {
        const res = await fetch("/api/video/ensure-processed-mp4", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ videoId: video.id }),
        });
        const data = (await res.json()) as { ok?: boolean; video?: FeedVideo };
        if (cancelled || !data.video) return;
        setVideo(data.video);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    video.id,
    video.listing?.sellerId,
    video.processedVideoUrl,
    video.processedVideoStatus,
    video.src,
  ]);

  useEffect(() => {
    if (video.processedVideoStatus !== "processing") return;
    if (!video.listing?.sellerId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const timer = window.setInterval(() => {
      void (async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        try {
          const res = await fetch("/api/video/ensure-processed-mp4", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ videoId: video.id }),
          });
          const data = (await res.json()) as { video?: FeedVideo };
          if (data.video) setVideo(data.video);
        } catch {
          /* ignore */
        }
      })();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [video.id, video.listing?.sellerId, video.processedVideoStatus]);

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
    setBackgroundPreviewError(null);
    setBackgroundPreviewInfo(null);
    setFacePreviewError(null);
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
    if (!user) {
      openAuthModal();
      return;
    }
    saveInFlightRef.current = true;
    setSaveStatus("saving");
    setSaveError(null);
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
      textPreviewEnabled: false,
    };
    const blob = buildDraftBlob(draft, persistedPreview);
    const supabase =
      supabaseConfigured ? getSupabaseBrowserClient() : null;
    void persistCustomizeDraft(supabase, user.id, video.id, blob).then(
      ({ remoteOk }) => {
        markCustomizeDraftSaved(video.id);
        trackBehavior({
          type: "draft_saved",
          keyword: draft.backgroundPrompt,
          mode: draft.backgroundMode ?? "video",
        });
        if (!remoteOk && supabaseConfigured) {
          setSaveStatus("error");
          setSaveError(
            "이 기기에는 저장됐지만 계정 동기화에 실패했어요. 네트워크 확인 후 다시 저장해 주세요.",
          );
        } else {
          setSaveStatus("saved");
          setSaveError(null);
        }
        saveInFlightRef.current = false;
      },
    );
  }, [
    draft,
    openAuthModal,
    previewBgImageUrl,
    previewBgPrompt,
    previewBgVideoUrl,
    previewCandidateIndex,
    previewCandidates,
    previewCompositeBgUrl,
    previewCompositeFgUrl,
    supabaseConfigured,
    trackBehavior,
    useAdvancedStep,
    user,
    video.id,
  ]);

  useEffect(() => {
    if (!draft || !user || draftHydrating) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = window.setTimeout(() => {
      if (saveInFlightRef.current) return;
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
        textPreviewEnabled: false,
      };
      const blob = buildDraftBlob(draft, persistedPreview);
      const supabase =
        supabaseConfigured ? getSupabaseBrowserClient() : null;
      void persistCustomizeDraft(supabase, user.id, video.id, blob);
    }, 2000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [
    draft,
    draftHydrating,
    previewBgImageUrl,
    previewBgPrompt,
    previewBgVideoUrl,
    previewCandidateIndex,
    previewCandidates,
    previewCompositeBgUrl,
    previewCompositeFgUrl,
    supabaseConfigured,
    useAdvancedStep,
    user,
    video.id,
  ]);

  const submitServerGeneration = useCallback(async () => {
    if (!draft || !effectiveFaceImageUrl) {
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
          faceImageUrl: effectiveFaceImageUrl,
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
  }, [draft, effectiveFaceImageUrl, video.id]);

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

  /** 얼굴 스왑 미리보기만 (배경 Flux/검색 없음) — 결과는 오른쪽 큰 미리보기 영역에 반영 */
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
      const targetVideoUrl = motionReferenceUrl;
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
      setFacePreviewError(userFacingAiErrorMessage(raw, locale as SiteLocale));
    } finally {
      setFacePreviewApplying(false);
    }
  }, [
    aiPreviewQuotaActive,
    draft,
    motionReferenceUrl,
    selectedFace,
    selectedFaceSourceUrl,
    trackBehavior,
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
              : userFacingAiErrorMessage(
                  data.message ?? translate(locale as SiteLocale, "studio.bgGenerateFail"),
                  locale as SiteLocale,
                ),
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
      const subjectVideoUrl = motionReferenceUrl;
      if (!effectiveFaceImageUrl) {
        setBackgroundPreviewError("배경 영상으로 생성하기 전 얼굴 이미지를 먼저 추가해 주세요.");
        setPreviewTransitionLoading(false);
        return;
      }

      const res = await fetch("/api/kling/motion-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: effectiveFaceImageUrl,
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
      setBackgroundPreviewError(userFacingAiErrorMessage(raw, locale as SiteLocale));
    } finally {
      setBackgroundPreviewApplying(false);
    }
  }, [
    aiPreviewQuotaActive,
    backgroundMode,
    draft,
    effectiveFaceImageUrl,
    preloadVideoUrl,
    previewBgVideoUrl,
    trackBehavior,
    motionReferenceUrl,
    startFramePoster,
    video.orientation,
    video.poster,
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

  if (!draft || draftHydrating) {
    return (
      <p className="py-16 text-center text-[14px] text-zinc-500">{t("studio.loading")}</p>
    );
  }

  const purchaseGatePanel = !owned ? (
    <div className="mx-auto mb-6 max-w-lg rounded-2xl border border-white/10 bg-black/30 px-6 py-10 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
      <p className="text-[15px] font-semibold text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
        {t("studio.purchaseGateTitle")}
      </p>
      <p className="mt-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        {t("studio.purchaseGateLead")}
      </p>
      <Link
        href={`/video/${encodeURIComponent(video.id)}`}
        className="mt-6 inline-flex rounded-full border border-reels-cyan/40 bg-reels-cyan/10 px-6 py-3 text-[14px] font-extrabold text-reels-cyan hover:bg-reels-cyan/18"
      >
        {t("studio.backToDetail")}
      </Link>
    </div>
  ) : null;

  return (
    <div className="space-y-8">
      {heroTitle ? (
        <header className="border-b border-white/10 pb-8 [html[data-theme='light']_&]:border-zinc-100">
          <h1 className="min-w-0 max-w-full">
            <div
              role="group"
              aria-label={t("studio.modeAria")}
              className="inline-flex w-max max-w-full min-w-0 items-stretch overflow-hidden rounded-full border-2 border-white/[0.26] bg-zinc-950/35 p-0 [html[data-theme='light']_&]:border-zinc-400/45 [html[data-theme='light']_&]:bg-white/70"
            >
              <button
                type="button"
                onClick={() => {
                  setUseAdvancedStep(true);
                  requestAnimationFrame(() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  });
                }}
                aria-pressed={useAdvancedStep}
                aria-label={
                  useAdvancedStep
                    ? t("studio.scrollTopAria")
                    : t("studio.backToEditAria")
                }
                className={`${
                  useAdvancedStep ? HERO_STUDIO_CAPSULE_BTN_SELECTED : HERO_STUDIO_CAPSULE_BTN_IDLE
                } rounded-none`}
              >
                <span className="whitespace-nowrap text-center">{heroTitle}</span>
              </button>
              <span
                aria-hidden
                className="pointer-events-none w-0.5 shrink-0 self-stretch bg-white/[0.26] [html[data-theme='light']_&]:bg-zinc-400/45"
              />
              <button
                type="button"
                onClick={() => setUseAdvancedStep(false)}
                aria-pressed={!useAdvancedStep}
                aria-label={t("studio.videoOnlyAria")}
                className={`${
                  !useAdvancedStep ? HERO_STUDIO_CAPSULE_BTN_SELECTED : HERO_STUDIO_CAPSULE_BTN_IDLE
                } rounded-none`}
              >
                <span className="whitespace-nowrap text-center">{t("studio.videoOnly")}</span>
              </button>
            </div>
          </h1>
        </header>
      ) : null}

      {!heroTitle ? (
        <div className="flex flex-col gap-4 border-b border-white/10 pb-8 md:flex-row md:items-center md:justify-between md:gap-6 [html[data-theme='light']_&]:border-zinc-100">
          <p className="min-w-0 max-w-xl flex-1 text-[15px] leading-relaxed text-white/55 [html[data-theme='light']_&]:text-zinc-600">
            {t("studio.leadNoHero")}
          </p>
          <button
            type="button"
            onClick={() => setUseAdvancedStep(false)}
            className={`${MYPAGE_OUTLINE_BTN_MD} w-full max-w-xs shrink-0 md:w-auto`}
          >
            {t("studio.videoOnly")}
          </button>
        </div>
      ) : null}

      {video.listing?.sellerId &&
      (video.processedVideoStatus === "processing" ||
        needsServerMp4Extraction(video)) ? (
        <div
          role="status"
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] leading-relaxed text-amber-100 [html[data-theme='light']_&]:border-amber-400/40 [html[data-theme='light']_&]:bg-amber-50 [html[data-theme='light']_&]:text-amber-950"
        >
          <p className="font-semibold">{t("studio.mp4PreparingTitle")}</p>
          <p className="mt-1 opacity-90">{t("studio.mp4PreparingLead")}</p>
        </div>
      ) : null}

      {video.processedVideoStatus === "failed" && video.processedVideoError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-[13px] leading-relaxed text-red-100 break-words [html[data-theme='light']_&]:border-red-300 [html[data-theme='light']_&]:bg-red-50 [html[data-theme='light']_&]:text-red-950"
        >
          <p className="font-semibold">참조 영상 변환에 실패했습니다</p>
          <p className="mt-1 font-mono text-[12px] opacity-90">
            {video.processedVideoError}
          </p>
        </div>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,340px)] lg:items-start lg:gap-12">
        {/* 데스크톱: 미리보기는 오른쪽 열(col 2). 모바일: DOM 순서대로 미리보기가 위에 유지 */}
        <div
          className="min-w-0 w-full scroll-mt-[calc(var(--header-height,4.5rem)+3rem+env(safe-area-inset-top))] max-lg:pt-6 lg:sticky lg:top-[calc(var(--header-height,4.5rem)+3rem+env(safe-area-inset-top))] lg:col-start-2 lg:row-start-1 lg:self-start"
        >
          <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-400">
            미리보기
          </p>
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
                    className="studio-preview-native-video h-full w-full object-contain"
                    poster={previewPoster}
                    src={previewVideoSrc}
                    playsInline
                    muted={bgPreviewOn}
                    autoPlay={bgPreviewOn}
                    loop={bgPreviewOn}
                    controls
                    controlsList="nodownload noplaybackrate noremoteplayback"
                    disablePictureInPicture
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
          {useAdvancedStep &&
          effectiveFaceImageUrl &&
          selectedFace?.aiAngles &&
          selectedFace.aiAngles.length > 0 ? (
            <div className="mx-auto mt-4 w-full max-w-[280px] rounded-xl border border-white/10 bg-white/[0.04] p-3 flex flex-col gap-3">
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
          ) : null}
        </div>

        <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-1">
          {!useAdvancedStep ? (
            <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-2xl border border-white/10 bg-black/45 px-5 py-6 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
              <div className="self-start">
                <SellerIdentityLink
                  creator={video.creator}
                  sellerId={video.listing?.sellerId}
                  size="compact"
                  className="min-w-0 max-w-full"
                />
              </div>
              <h2 className="text-center text-2xl font-extrabold tracking-tight text-zinc-100 sm:text-3xl [html[data-theme='light']_&]:text-zinc-900">
                {displayTitle(video)}
              </h2>
              <div className="mx-auto w-fit">
                <TrendingVideoStatsFooter
                  revenueFullWon
                  metrics={purchaseRankMetrics}
                  salesCount={purchaseCommerceMeta.salesCount}
                  stockRow={
                    purchaseCommerceMeta.edition === "open"
                      ? null
                      : {
                          remaining: purchaseRemaining,
                          soldOut: purchaseSoldOut,
                        }
                  }
                />
              </div>
              {purchasePriceWon > 0 ? (
                <div className="text-center">
                  <span className="font-black tabular-nums tracking-tight text-[length:calc(36px_+_5pt)] text-white [html[data-theme='light']_&]:text-zinc-900">
                    {locale === "en" ? (
                      <>₩{purchasePriceWon.toLocaleString("en-US")}</>
                    ) : (
                      <>
                        {purchasePriceWon.toLocaleString("ko-KR")}
                        <span className="ml-1.5 font-extrabold text-[length:calc(22px_+_5pt)]">
                          {t("video.detail.currencySuffix")}
                        </span>
                      </>
                    )}
                  </span>
                </div>
              ) : null}
              <div className="flex w-full justify-center pt-1">
                <TossCheckoutButton
                  productType="video"
                  videoId={video.id}
                  next={buildPurchaseCompleteNextPath(video.id)}
                  disabled={!user || owned || !purchasePriceWon || purchaseSoldOut}
                  className={`${MYPAGE_OUTLINE_BTN_MD} w-full max-w-sm shrink-0 disabled:pointer-events-none disabled:opacity-45`}
                >
                  바로 구매
                </TossCheckoutButton>
              </div>
            </section>
          ) : null}
          {useAdvancedStep && !owned ? purchaseGatePanel : null}
          {useAdvancedStep && owned ? (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:items-stretch md:gap-3 lg:gap-4">
                <section
                  className={`${STUDIO_SECTION_SURFACE} relative flex min-h-0 h-full min-w-0 flex-col overflow-hidden p-4 sm:p-5`}
                >
            <h2 className={`${STUDIO_SECTION_H2_ROW} min-w-0`}>
              <span className={STUDIO_STEP_BADGE}>1</span>
              <span className="min-w-0 truncate">아바타 선택</span>
            </h2>
            
            <div className="mt-0 flex min-h-0 flex-1 flex-col">
            {isAvatarConfirmed ? (
              <div className="mt-3 flex flex-1 flex-col items-center justify-center gap-2">
                <div className="relative group rounded-xl overflow-hidden shadow-lg border-2 border-[color:var(--reels-point)]">
                  {confirmedAvatarThumbUrl ? (
                    <img
                      src={confirmedAvatarThumbUrl}
                      alt="Confirmed Avatar"
                      className="h-[140px] w-[100px] object-cover sm:h-[196px] sm:w-[140px]"
                    />
                  ) : (
                    <div
                      className="h-[140px] w-[100px] bg-zinc-800 sm:h-[196px] sm:w-[140px]"
                      aria-hidden
                    />
                  )}
                  
                  {/* Hover Edit Overlay — 배경 확정 카드의 「변경하기」와 동일 크기·중앙 정렬 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setIsAvatarConfirmed(false)}
                      className="bg-white/20 hover:bg-white/30 text-white text-[12px] font-bold px-4 py-2 rounded-full backdrop-blur-md border border-white/30 transition-colors w-[80%]"
                    >
                      변경하기
                    </button>
                  </div>
                </div>
                <p className="text-[12px] font-medium text-white [html[data-theme='light']_&]:text-zinc-900">
                  아바타가 선택되었습니다.
                </p>
              </div>
            ) : (
            <>
              <p className="mt-1 text-[11px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-[12px]">
                <span className="font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                  아래{" "}
                  <span className="font-semibold text-reels-cyan">+</span>로 사진을 올린 뒤 AI 3면도를 완료해야
                  아바타를 쓸 수 있어요.
                </span>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {faceOptions.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => updateDraft({ faceOptionId: o.id })}
                      aria-label={o.label}
                      aria-pressed={draft?.faceOptionId === o.id}
                      className={`relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full border-2 transition-colors sm:h-[60px] sm:w-[60px] ${
                        draft?.faceOptionId === o.id
                          ? "border-reels-cyan ring-2 ring-reels-cyan/25"
                          : "border-white/20 hover:border-reels-cyan/50"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={o.src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                <label className="relative flex h-[52px] w-[52px] cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-white/20 bg-white/5 transition-colors hover:border-reels-cyan/60 hover:bg-white/10 sm:h-[60px] sm:w-[60px]">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 grid place-items-center text-[2.1rem] font-light leading-none text-[color:var(--reels-point)] sm:text-[2.4rem]"
                  >
                    +
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 file:cursor-pointer"
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
              <div className="mt-auto flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-2 pt-2">
                <p className="min-w-0 max-w-[16rem] shrink text-left text-[11px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                  미리보기는 20크레딧 소요됩니다.
                </p>
                <div className="grid min-w-0 shrink-0 grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={
                      facePreviewApplying ||
                      !selectedFaceSourceUrl?.trim()
                    }
                    onClick={() => void applyFacePreview()}
                    className="flex w-full min-w-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[12px] font-semibold text-zinc-100 transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-200 sm:py-2.5 sm:text-[13px]"
                  >
                    {facePreviewApplying ? "미리보기 중…" : "미리보기"}
                  </button>
                  <button
                    type="button"
                    disabled={!selectedFaceSourceUrl?.trim()}
                    onClick={() => {
                      if (!selectedFaceSourceUrl?.trim()) return;
                      setIsAvatarConfirmed(true);
                    }}
                    className="flex w-full min-w-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[12px] font-semibold text-zinc-100 transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-200 sm:py-2.5 sm:text-[13px]"
                  >
                    확정
                  </button>
                </div>
              </div>
              {facePreviewError ? (
                <p
                  className={`mt-2 text-[11px] leading-snug text-red-400 [html[data-theme='light']_&]:text-red-600 ${
                    selectedFaceSourceUrl?.trim()
                      ? "text-right sm:text-left"
                      : "text-right"
                  }`}
                >
                  {facePreviewError}
                </p>
              ) : null}
            </>
            )}
            </div>
          </section>

                <section
                  className={`${STUDIO_SECTION_SURFACE} relative flex min-h-0 h-full min-w-0 flex-col overflow-hidden p-4 sm:p-5`}
                >
            <h2 className={`${STUDIO_SECTION_H2_ROW} min-w-0`}>
              <span className={STUDIO_STEP_BADGE}>2</span>
              <span className="min-w-0 truncate">배경 설정</span>
            </h2>
            <div className="mt-0 flex min-h-0 flex-1 flex-col">
            {isBackgroundConfirmed ? (
              <div className="mt-3 flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
                <div className="relative group rounded-xl overflow-hidden shadow-lg border-2 border-reels-cyan">
                  {confirmedBackgroundThumbUrl ? (
                    <img
                      src={confirmedBackgroundThumbUrl}
                      alt="Confirmed Background"
                      className="w-[100px] h-[140px] sm:w-[140px] sm:h-[196px] object-cover"
                    />
                  ) : (
                    <div
                      className="h-[140px] w-[100px] bg-zinc-900 sm:h-[196px] sm:w-[140px]"
                      aria-hidden
                    />
                  )}
                  
                  {/* Hover Edit Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirmedBackgroundThumbUrl) {
                          setEnlargedImage({
                            url: confirmedBackgroundThumbUrl,
                            index: 0,
                            type: "full",
                          });
                        }
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white text-[12px] font-bold px-4 py-2 rounded-full backdrop-blur-md border border-white/30 transition-colors w-[80%]"
                    >
                      크게보기
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBackgroundConfirmed(false)}
                      className="bg-white/20 hover:bg-white/30 text-white text-[12px] font-bold px-4 py-2 rounded-full backdrop-blur-md border border-white/30 transition-colors w-[80%]"
                    >
                      변경하기
                    </button>
                  </div>
                </div>
                <p className="text-[12px] font-medium text-white [html[data-theme='light']_&]:text-zinc-900">
                  {bgPreviewOn
                    ? `(${previewBgPrompt ?? "새로운 시공간"}) 배경이 확정되었습니다.`
                    : "배경이 확정되었습니다."}
                </p>
              </div>
            ) : (
            <>
            <div className="mt-3 flex min-h-0 min-w-0 w-full flex-1 flex-col gap-2 overflow-y-auto">
            <InputSection
              ref={bgPromptRef}
              value={draft.backgroundPrompt}
              onChange={(value) => updateDraft({ backgroundPrompt: value })}
              rows={2}
              placeholder="예: 골목"
              className="mt-0 w-full resize-none rounded-lg border border-white/10 bg-black/35 px-3 py-1.5 text-[12px] leading-snug text-zinc-100 placeholder:text-zinc-600 focus:border-reels-cyan/45 focus:outline-none focus:ring-1 focus:ring-reels-cyan/30"
            />
            {backgroundPreviewError ? (
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-reels-crimson">
                {backgroundPreviewError}
              </p>
            ) : null}
            {backgroundPreviewInfo ? (
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-amber-200/95">
                {backgroundPreviewInfo}
              </p>
            ) : null}

            {/* 시공간 이동 결과물 갤러리 */}
            {bgPreviewOn || previewCandidates.length > 0 ? (
              <div className="mt-3 min-h-0 flex-1 flex flex-col">
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
                      {originFrameThumbUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={originFrameThumbUrl}
                            className="absolute inset-0 w-full h-full object-cover"
                            alt="original"
                          />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-zinc-800" aria-hidden />
                      )}
                      
                      {/* Enlarge Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (originFrameThumbUrl) {
                            setEnlargedImage({
                              url: originFrameThumbUrl,
                              index: 0,
                              type: "full",
                            });
                          }
                        }}
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
                          <div className={`w-[80px] h-[110px] rounded-lg overflow-hidden border-2 relative transition ${isSelected ? 'border-reels-cyan shadow-[0_0_12px_rgba(255,45,141,0.3)]' : 'border-transparent hover:border-white/20'}`}>
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
            <div className="mt-auto flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-2 pt-2">
              <p className="min-w-0 max-w-[16rem] shrink text-left text-[11px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                미리보기는 20크레딧 소요됩니다.
              </p>
              <div className="grid min-w-0 shrink-0 grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void applyBackgroundPreview(bgPromptRef.current?.value)}
                  disabled={
                    backgroundPreviewApplying ||
                    (aiPreviewQuotaActive && localFacePreviewRemaining <= 0)
                  }
                  className="flex w-full min-w-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[12px] font-semibold text-zinc-100 transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-200 sm:py-2.5 sm:text-[13px]"
                >
                  {backgroundPreviewApplying
                    ? "미리보기 중…"
                    : aiPreviewQuotaActive && localFacePreviewRemaining <= 0
                      ? "무료 1회 소진 (구독 필요)"
                      : "미리보기"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBackgroundConfirmed(true)}
                  className="flex w-full min-w-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[12px] font-semibold text-zinc-100 transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-200 sm:py-2.5 sm:text-[13px]"
                >
                  확정
                </button>
              </div>
            </div>
            </>
            )}
            </div>
              </section>
            </div>

              <section
                className={`${STUDIO_SECTION_SURFACE} p-6 sm:p-8 relative overflow-hidden transition-colors duration-300 ${
                  isAvatarConfirmed && isBackgroundConfirmed && !fusionResultUrl
                    ? "border-[color:var(--reels-point)]/35 [html[data-theme='light']_&]:border-[color:var(--reels-point)]/30"
                    : ""
                }`}
              >
                <h2 className={`${STUDIO_SECTION_H2_ROW} mb-4`}>
                  <span className={STUDIO_STEP_BADGE}>3</span>
                  <span
                    className={
                      isAvatarConfirmed && isBackgroundConfirmed
                        ? ""
                        : "text-zinc-500 [html[data-theme='light']_&]:text-zinc-500"
                    }
                  >
                    의상 스타일 변경
                  </span>
                </h2>
                
                {!(isAvatarConfirmed && isBackgroundConfirmed) ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center opacity-50">
                     <p className="text-[12px] font-medium text-zinc-400">아바타선택과 배경 설정을 모두 확정해야 진행할 수 있습니다.</p>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col items-center">
                    {!fusionResultUrl ? (
                       <>
                         <div className="flex items-center justify-center gap-4 sm:gap-6 w-full mb-6 relative">
                            {/* Input 1: Avatar */}
                            <div className="flex flex-col items-center gap-2 z-10 w-1/3">
                               <div className="relative w-[70px] h-[70px] rounded-full p-1 bg-gradient-to-br from-reels-cyan to-reels-crimson shadow-lg shrink-0">
                                  {confirmedAvatarThumbUrl ? (
                                    <>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={confirmedAvatarThumbUrl}
                                        className="h-full w-full rounded-full bg-black object-cover"
                                        alt="Confirm Avatar"
                                      />
                                    </>
                                  ) : (
                                    <div className="h-full w-full rounded-full bg-black" aria-hidden />
                                  )}
                               </div>
                               <span className="text-[10px] font-bold text-zinc-300 whitespace-nowrap">내 아바타</span>
                            </div>

                            {/* + icon */}
                            <span className="text-2xl text-zinc-500 font-light z-10 mx-[-10px]">+</span>

                            {/* Input 2: Background */}
                            <div className="flex flex-col items-center gap-2 z-10 w-1/3">
                               <div className="relative w-[60px] h-[80px] rounded-lg p-0.5 bg-gradient-to-br from-reels-cyan to-reels-crimson shadow-lg shrink-0">
                                  {fusionBgThumbUrl ? (
                                    <>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={fusionBgThumbUrl}
                                        className="h-full w-full rounded-md bg-black object-cover"
                                        alt="Confirm Background"
                                      />
                                    </>
                                  ) : (
                                    <div className="h-full w-full rounded-md bg-black" aria-hidden />
                                  )}
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
                         <div className="mb-6 w-full max-w-4xl bg-[#1A1A1A] border border-white/10 rounded-xl p-4 shadow-lg relative z-10 mx-auto sm:p-5">
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
                           type="button"
                           onClick={async () => {
                              if (!selectedFaceSourceUrl) return;
                              const bgUrl = fusionBgThumbUrl;
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
                           className={`${MYPAGE_OUTLINE_BTN_MD} relative z-10 mx-auto w-fit shrink-0 disabled:pointer-events-none disabled:opacity-45`}
                         >
                            {isFusionApplying ? (
                               <>
                                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24" aria-hidden><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                 의상 적용 및 DNA 융합 중...
                               </>
                            ) : (
                               "아바타 + 의상 피팅 시작"
                            )}
                         </button>
                       </>
                    ) : (
                       <div className="w-full flex justify-center py-2 animate-fade-in">
                          <div className="relative group rounded-xl overflow-hidden shadow-[0_0_40px_rgba(255,45,141,0.3)] border-2 border-reels-cyan">
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

              <section className={`${STUDIO_SECTION_SURFACE} p-6 sm:p-8 relative overflow-hidden`}>
                <h2 className={`${STUDIO_SECTION_H2_ROW} mb-6`}>
                  <span className={STUDIO_STEP_BADGE}>4</span>
                  AI 모션 생성하기
                </h2>
                
                <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                  {/* Left Box: Video */}
                  <div className="relative aspect-[9/16] w-[150px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl sm:w-[200px]">
                     <div className="absolute inset-0 z-0 overflow-hidden rounded-xl bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <video
                          src={motionReferenceUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover opacity-90"
                        />
                     </div>
                     <div className="absolute bottom-0 z-10 flex w-full flex-col gap-1.5 rounded-b-xl border-t border-white/10 bg-black/40 px-3 py-3 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                           <div className="w-3 h-3 rounded-full border border-reels-cyan flex items-center justify-center shrink-0">
                             <div className="w-1.5 h-1.5 rounded-full bg-reels-cyan"></div>
                           </div>
                           <span className="text-[10px] text-zinc-100 font-bold tracking-tight">원본 모션</span>
                        </div>
                     </div>
                  </div>

                  {/* Right Box: Image */}
                  <div className="rounded-xl border border-white/10 bg-[#1A1A1A] overflow-hidden flex flex-col relative w-[150px] sm:w-[200px] shrink-0 aspect-[9/16] shadow-2xl">
                     {fusionResultUrl ? (
                         <div className="absolute inset-0 z-0 overflow-hidden rounded-xl bg-[#0a0a0a]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={fusionResultUrl} alt="Target Character Image" className="h-full w-full object-contain pb-8" />
                            <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent p-3 pt-4">
                               <p className="text-[10px] sm:text-[11px] font-bold tracking-wide text-zinc-300 drop-shadow-md leading-tight">Target Frame<br/><span className="text-zinc-500 font-medium">(DNA Fusion)</span></p>
                            </div>
                         </div>
                     ) : (
                         <div className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden rounded-xl p-6 pt-8 pb-12">
                            <div className="text-zinc-400 border border-white/10 rounded-lg p-2 border-dashed">
                               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            </div>
                         </div>
                     )}
                     <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-xl bg-dots-grid bg-[length:16px_16px] opacity-5"></div>
                     <div className="absolute bottom-0 z-10 flex w-full flex-col gap-1.5 rounded-b-xl border-t border-white/10 bg-black/40 px-3 py-3 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                           <div className="w-3 h-3 rounded-full border border-reels-cyan flex items-center justify-center shrink-0">
                             <div className="w-1.5 h-1.5 rounded-full bg-reels-cyan"></div>
                           </div>
                           <span className="text-[10px] text-zinc-100 font-bold tracking-tight">최종 합성</span>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="mt-5 relative z-10">
                   <div className="flex items-center justify-between mb-2">
                       <p className="text-[12px] font-bold text-zinc-300">동작 프롬프트 (가이드)</p>
                       <div className="flex bg-[#111] border border-white/10 rounded-lg p-0.5 relative z-10">
                           <button 
                             onClick={() => setCharacterOrientation("image")}
                             className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${characterOrientation === "image" ? "bg-zinc-600 text-zinc-100 shadow-inner ring-1 ring-white/10" : "text-zinc-500 hover:text-zinc-300"}`}
                           >
                             이미지 기준 (자연스러운 배경)
                           </button>
                           <button 
                             onClick={() => setCharacterOrientation("video")}
                             className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${characterOrientation === "video" ? "bg-zinc-600 text-zinc-100 shadow-inner ring-1 ring-white/10" : "text-zinc-500 hover:text-zinc-300"}`}
                           >
                             댄스 모션 기준 (격렬한 춤)
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
                  <div className="mt-4 flex justify-center">
                   <button 
                     onClick={async () => {
                        if (!fusionResultUrl) {
                           alert("Step 3에서 먼저 DNA 융합 마법을 시작하여 이미지를 생성해주세요.");
                           return;
                        }
                        if (needsServerMp4Extraction(video)) {
                          alert(
                            "참조 영상을 MP4로 준비하는 중입니다. 상단 안내 배너가 사라진 뒤 다시 시도해 주세요.",
                          );
                          return;
                        }
                        setIsKlingGenerating(true);
                        try {
                           const res = await fetch("/api/kling/motion-control", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                 imageUrl: fusionResultUrl,
                                 videoUrl: motionReferenceUrl,
                                 prompt: klingPromptText + ", one person only, solo dancer, exactly one character",
                                 characterOrientation: characterOrientation
                              })
                           });
                           const data = await res.json();
                           if (!res.ok) throw new Error(data.error || "AI 모션 API 에러");
                           
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
                     disabled={!fusionResultUrl || isKlingGenerating || needsServerMp4Extraction(video)}
                     className={`${MYPAGE_OUTLINE_BTN_MD} relative z-10 shrink-0 gap-2 disabled:pointer-events-none disabled:!border-zinc-500 disabled:opacity-50 [html[data-theme='light']_&]:disabled:!border-zinc-400`}
                   >
                      {isKlingGenerating ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24" aria-hidden><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Task 전송 중...
                          </>
                      ) : (
                          <>AI 모션 생성 시작</>
                      )}
                   </button>
                  </div>
                )}
              </section>

              {/* Step 5: Final Result UI */}
              {(klingJob || isKlingGenerating) && (
                  <section
                    className={`${STUDIO_SECTION_SURFACE} p-6 sm:p-8 relative overflow-hidden mt-6 border-[color:var(--reels-point)]/25 [html[data-theme='light']_&]:border-[color:var(--reels-point)]/20`}
                  >
                    <h2 className={`${STUDIO_SECTION_H2_ROW} mb-6`}>
                      <span className={STUDIO_STEP_BADGE}>5</span>
                      최종 동영상 완성 및 다운로드
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
                             <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#ff2d8d] via-reels-cyan to-[#ff2d8d] bg-[length:200%_100%] transition-all duration-1000 ease-in-out origin-left animate-[gradient_2s_linear_infinite]" style={{ transform: `scaleX(${klingJob.progress / 100})` }}>
                             </div>
                           </div>
                         </div>
                    )}

                    {klingJob && klingJob.status === "succeeded" && klingJob.outputVideoUrl && (
                        <div className="mt-4 flex flex-col items-center animate-fade-in">
                            <div className="w-full flex justify-between items-end mb-4 px-1">
                                <div>
                                    <h3 className="text-[16px] font-extrabold text-reels-cyan">✨ 영상 생성의 마법이 끝났습니다!</h3>
                                    <p className="text-[11px] text-zinc-400 mt-1">생성된 동영상은 마이페이지 생명연구소에 자동 저장됩니다.</p>
                                </div>
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded flex items-center gap-1 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                    SUCCESS
                                </span>
                            </div>

                            <div className="w-[80%] max-w-[280px] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/10 relative group">
                                <video
                                  src={klingJob.outputVideoUrl}
                                  controls
                                  controlsList="nodownload noplaybackrate noremoteplayback"
                                  disablePictureInPicture
                                  autoPlay
                                  loop
                                  playsInline
                                  className="studio-preview-native-video aspect-[9/16] h-full w-full object-contain"
                                />
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-bold tracking-wider">9:16 REELS</span>
                                </div>
                            </div>
                            
                            <div className="w-[80%] max-w-[280px] mt-5 space-y-3">
                                <a href={klingJob.outputVideoUrl} download target="_blank" rel="noreferrer" className="w-full py-4 bg-gradient-to-r from-reels-cyan to-[#ff2d8d] text-black rounded-xl text-[14px] font-extrabold shadow-[0_0_20px_rgba(255,45,141,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
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
                  <section
                    className={`${STUDIO_SECTION_SURFACE} p-6 sm:p-8 relative overflow-hidden mt-6 border-[color:var(--reels-point)]/25 [html[data-theme='light']_&]:border-[color:var(--reels-point)]/20`}
                  >
                    <h2 className={`${STUDIO_SECTION_H2_ROW} mb-6 relative z-10`}>
                      이전 렌더링 완성본 목록 (내 동영상 보관함)
                    </h2>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
                        {klingHistory.map((hist, idx) => {
                          const histUrl =
                            (typeof hist.videoUrl === "string" && hist.videoUrl) ||
                            (typeof hist.outputUrl === "string" && hist.outputUrl) ||
                            "";
                          const histTime =
                            hist.createdAt ?? hist.updatedAt ?? hist.time;
                          return (
                            <div key={hist.id ?? idx} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black aspect-[9/16] shadow-lg">
                                <video
                                  src={histUrl}
                                  className="studio-preview-native-video h-full w-full object-contain"
                                  controls
                                  controlsList="nodownload noplaybackrate noremoteplayback"
                                  disablePictureInPicture
                                  playsInline
                                  muted
                                />
                                <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pointer-events-none transition-opacity opacity-0 group-hover:opacity-100">
                                    <div className="max-w-[70%]">
                                        <p className="text-[9px] font-semibold text-white/50">
                                          {histTime
                                            ? new Date(histTime).toLocaleString()
                                            : "—"}
                                        </p>
                                    </div>
                                    <a 
                                      href={histUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="bg-reels-cyan/90 backdrop-blur text-black px-2 py-1 rounded text-[10px] font-bold z-10 pointer-events-auto hover:bg-white transition-colors shadow-lg"
                                    >
                                      크게 보기
                                    </a>
                                </div>
                            </div>
                          );
                        })}
                    </div>
                  </section>
              )}

            </>
          ) : null}

          {useAdvancedStep && owned ? (
            <div className="flex w-full flex-col items-end gap-3">
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={persist}
                  disabled={saveStatus === "saving"}
                  className={`${MYPAGE_OUTLINE_BTN_MD_TRANSPARENT} disabled:pointer-events-none disabled:opacity-45`}
                >
                  임시 저장
                </button>
                {saveStatus === "saving" ? (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                    저장 중…
                  </span>
                ) : saveStatus === "saved" ? (
                  <span className="text-[12px] font-semibold text-[color:var(--reels-point)]">
                    마이페이지에 임시 저장됨
                  </span>
                ) : saveStatus === "error" && saveError ? (
                  <span className="max-w-xs text-[12px] font-medium text-amber-200 [html[data-theme='light']_&]:text-amber-800">
                    {saveError}
                  </span>
                ) : null}
                <button
                  type="button"
                  disabled={submitRemote || !effectiveFaceImageUrl}
                  onClick={submitServerGeneration}
                  className={`${MYPAGE_OUTLINE_BTN_MD} disabled:pointer-events-none disabled:opacity-45`}
                >
                  {submitRemote ? "생성 중…" : "생성 하기"}
                </button>
              </div>
              {!remoteJob ? (
                <p className="max-w-xl text-right text-[11px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                  생성 시작한 뒤에는 이 화면을 나가도 작업은 이어지며, 결과는{" "}
                  <Link
                    href="/mypage?tab=drafts"
                    className="font-semibold text-[color:var(--reels-point)] underline-offset-2 hover:underline"
                  >
                    마이페이지 → 임시 저장
                  </Link>
                  에서 다시 열어볼 수 있어요.
                </p>
              ) : null}
            </div>
          ) : null}

          {remoteErr && useAdvancedStep ? (
            <p className="mt-3 text-[12px] font-medium text-reels-crimson">{remoteErr}</p>
          ) : null}
          {remoteJob && useAdvancedStep ? (
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
                <h3 className="text-[17px] font-bold text-zinc-100">AI 3면도 생성</h3>
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
                <div className="text-[14px] text-zinc-400">기준 사진</div>
                <div className="w-full aspect-[9/16] overflow-hidden rounded-xl border border-white/10 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={customUploadSourceUrl} alt="원본 피사체" className="w-full h-full object-cover" />
                </div>
              </div>
              
              {/* Right: Select favorite multi-shots */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <div className="text-[14px] text-zinc-400">
                    생성된 3면도를 확인한 뒤 확정하세요
                  </div>
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
                        다시 생성
                      </button>
                    )}
                    <span className="text-[11px] text-zinc-400 bg-white/5 py-1 px-2.5 rounded-md border border-white/5">
                      일일 무료 3/3
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
                         AI 3면도 생성 시작
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
                                <div key={col} className="aspect-[9/16] rounded-xl bg-[#1c1d21] flex items-center justify-center">
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
                              <div key={i} className="relative aspect-[9/16] rounded-xl overflow-hidden border border-white/5 bg-black">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img 
                                     src={url} 
                                     alt={`생성 각도 ${i + 1}`} 
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
                취소
              </button>
              <button 
                onClick={() => {
                  const newId = `custom-${Date.now()}`;
                  setFaceOptions((prev) => [
                    ...prev,
                    { id: newId, label: "내 프로필 (AI 3면도)", src: customUploadSourceUrl!, aiAngles: customUploadAngles }
                  ]);
                  setSelectedFaceSourceUrl(customUploadSourceUrl);
                  updateDraft({ faceOptionId: newId });
                  setCustomUploadModalVisible(false);
                  
                  if (customUploadSourceUrl) {
                    void setStoredFaceProfile({
                      kind: "ai",
                      source: customUploadSourceUrl,
                      generatedAt: Date.now(),
                    });
                  }
                }}
                className="rounded-lg bg-[#2e3138] disabled:opacity-50 px-6 py-2.5 text-[14px] font-semibold text-zinc-100 hover:bg-[#3f434c] transition-colors"
                disabled={customUploadAngles.length === 0 || isGeneratingAngles}
              >
                {t("studio.confirm")}
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
                className="relative w-[30vh] max-w-[80vw] aspect-[9/16] overflow-hidden rounded-xl shadow-2xl bg-black md:w-[45vh]"
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
