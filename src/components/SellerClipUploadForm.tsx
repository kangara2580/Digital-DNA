"use client";

import {
  AlertCircle,
  CheckCircle2,
  Film,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  coerceSellCategoryForUserForm,
  type SellVideoUserSelectableCategory,
} from "@/lib/sellVideoCategory";
import {
  captureFrameFromVideo,
  capturePosterFromFile,
} from "@/lib/captureVideoFrame";
import { MYPAGE_OUTLINE_BTN_MD } from "@/lib/mypageOutlineCta";
import {
  deleteSellerUploadDraft,
  fetchSellerUploadDraft,
  upsertSellerUploadDraft,
  type SellerUploadDraftPayload,
} from "@/lib/supabaseSellerUploadDraft";
import { SellCategorySelect } from "@/components/SellCategorySelect";
import {
  parseSocialVideoEmbed,
  normalizeYouTubeUrlToWatch,
  type SocialVideoEmbed,
} from "@/lib/socialVideoEmbed";
import {
  EXTERNAL_EMBED_IFRAME_ALLOW,
  EXTERNAL_EMBED_IFRAME_SANDBOX,
} from "@/lib/externalEmbed/iframeSandbox";
import type { FeedVideo } from "@/data/videos";

const PENDING_UPLOADED_VIDEO_KEY = "sell:pending-uploaded-video";

const INPUT =
  "w-full rounded-xl border border-white/[0.14] bg-[#0c0c0e] px-4 py-3 text-[15px] leading-snug text-zinc-100 caret-reels-crimson outline-none transition-[border-color,box-shadow] placeholder:text-zinc-600 focus:border-white/[0.32] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.35)] focus:outline-none focus-visible:outline-none [html[data-theme='light']_&]:border-zinc-200/75 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:placeholder:text-zinc-400 [html[data-theme='light']_&]:focus:border-zinc-400/85 [html[data-theme='light']_&]:focus:shadow-[0_0_0_1px_rgba(0,0,0,0.12)]";

const LABEL =
  "mb-2 block text-[15px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900";

const SOURCE_PANEL =
  "px-0 py-0";

/** 마이페이지 고스트 CTA와 동일 호버 — 비활성일 때 리프트·스케일 제거 */
const BTN_DISABLED_GHOST =
  "disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100";

/** 본문 액션: 탭 선택과 구분되는 얇은 아웃라인 (핑크 채우기·글로우 없음) */
const SOURCE_SECONDARY_BTN =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-[13px] font-medium text-zinc-100 shadow-none transition-colors hover:border-white/[0.32] hover:bg-white/[0.06] active:bg-white/[0.04] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:hover:bg-zinc-50";

const EMBED_9_16_SHELL =
  "relative mx-auto w-full max-w-[300px] aspect-[9/16] overflow-hidden rounded-xl border border-white/12 bg-zinc-950 shadow-sm [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100";

const EMBED_16_9_SHELL =
  "relative w-full aspect-video overflow-hidden rounded-xl border border-white/12 bg-zinc-950 shadow-sm [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100";

function YouTubeSellPreview({
  videoId,
  iframeSrc,
  aspect,
}: {
  videoId: string;
  iframeSrc: string;
  aspect: "16:9" | "9:16";
}) {
  const [thumbTier, setThumbTier] = useState<"max" | "hq">("max");
  const [iframeReady, setIframeReady] = useState(false);
  const thumbUrl =
    thumbTier === "max"
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  const shell = aspect === "9:16" ? EMBED_9_16_SHELL : EMBED_16_9_SHELL;

  useEffect(() => {
    setIframeReady(false);
    setThumbTier("max");
    const t = window.setTimeout(() => setIframeReady(true), 5000);
    return () => window.clearTimeout(t);
  }, [videoId, iframeSrc]);

  return (
    <div className={shell}>
      {!iframeReady ? (
        <img
          src={thumbUrl}
          alt=""
          className="absolute inset-0 z-0 h-full w-full object-cover"
          onError={() => setThumbTier("hq")}
        />
      ) : null}
      <iframe
        src={iframeSrc}
        title="YouTube preview"
        loading="lazy"
        sandbox={EXTERNAL_EMBED_IFRAME_SANDBOX}
        allow={EXTERNAL_EMBED_IFRAME_ALLOW}
        allowFullScreen
        onLoad={() => setIframeReady(true)}
        className={
          aspect === "9:16"
            ? "absolute inset-0 z-10 h-full w-full border-0 bg-black"
            : "absolute left-1/2 top-1/2 z-10 h-[108%] w-[108%] max-w-none -translate-x-1/2 -translate-y-1/2 border-0 bg-black"
        }
      />
    </div>
  );
}

function SocialSellEmbedPreview({ embed }: { embed: SocialVideoEmbed }) {
  if (embed.provider === "youtube" && embed.youtubeVideoId) {
    return (
      <YouTubeSellPreview
        videoId={embed.youtubeVideoId}
        iframeSrc={embed.iframeSrc}
        aspect={embed.aspect}
      />
    );
  }

  const shell = embed.aspect === "9:16" ? EMBED_9_16_SHELL : EMBED_16_9_SHELL;

  if (embed.provider === "instagram") {
    return (
      <div className={`${shell} !overflow-hidden`}>
        <iframe
          src={embed.iframeSrc}
          title="Instagram preview"
          loading="lazy"
          sandbox={EXTERNAL_EMBED_IFRAME_SANDBOX}
          allow={EXTERNAL_EMBED_IFRAME_ALLOW}
          allowFullScreen
          scrolling="no"
          className="absolute left-1/2 top-[2%] h-[118%] w-[112%] max-w-none -translate-x-1/2 border-0"
        />
      </div>
    );
  }

  return (
    <div className={shell}>
      <iframe
        src={embed.iframeSrc}
        title="TikTok preview"
        loading="lazy"
        sandbox={EXTERNAL_EMBED_IFRAME_SANDBOX}
        allow={EXTERNAL_EMBED_IFRAME_ALLOW}
        allowFullScreen
        scrolling="no"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}

/** 등록 포스터 캡처 시점(sec) 안전 클램프 */
function clampThumbSec(t: number, durationSec: number | null): number {
  const x = Number.isFinite(t) ? Math.max(0, t) : 0;
  if (durationSec != null && Number.isFinite(durationSec) && durationSec > 0) {
    const cap = Math.max(0, durationSec - 0.05);
    return Math.min(x, cap);
  }
  return x;
}

function normalizeVideoUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("/")) return t;
  return `https://${t}`;
}

export function SellerClipUploadForm({
  initialSourceType,
}: {
  initialSourceType: "file" | "url";
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const hid = useId();
  const { user, supabaseConfigured } = useAuthSession();
  const [sellerDraftReady, setSellerDraftReady] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [sourceType] = useState<"file" | "url">(initialSourceType);
  const [videoUrl, setVideoUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  /** 슬라이더·영상 미리보기 동기 시점(초) */
  const [thumbDraftSec, setThumbDraftSec] = useState(0);
  /** 등록 시 포스터 캡처에 쓸 확정 시점(초) —「썸네일로 적용」으로 갱신 */
  const [thumbCommittedSec, setThumbCommittedSec] = useState(0);
  /** 「썸네일로 적용」 직후 하단에 보여줄 적용 썸네일 미리보기 */
  const [appliedThumbPreviewUrl, setAppliedThumbPreviewUrl] = useState<string | null>(null);
  /** true일 때 슬라이더·적용 UI 표시; 적용 후 접어서 미리보기만 */
  const [thumbPickerOpen, setThumbPickerOpen] = useState(true);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SellVideoUserSelectableCategory>("daily");
  const [price, setPrice] = useState("1000");
  const [isAi, setIsAi] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  /** YouTube·TikTok·Instagram 공유 주소 등 — `<video src>` 불가 시 iframe 미리보기 */
  const socialEmbedPreview = useMemo(() => {
    if (sourceType !== "url" || !previewUrl) return null;
    return parseSocialVideoEmbed(previewUrl);
  }, [sourceType, previewUrl]);

  const resetPreview = useCallback(() => {
    if (previewUrl?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {
        /* noop */
      }
    }
    if (appliedThumbPreviewUrl?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(appliedThumbPreviewUrl);
      } catch {
        /* noop */
      }
    }
    setPreviewUrl(null);
    setAppliedThumbPreviewUrl(null);
    setFile(null);
    setDurationSec(null);
    setThumbDraftSec(0);
    setThumbCommittedSec(0);
    setThumbPickerOpen(true);
  }, [previewUrl, appliedThumbPreviewUrl]);

  const clearUrlFieldAndPreview = useCallback(() => {
    setVideoUrl("");
    resetPreview();
  }, [resetPreview]);

  useEffect(() => {
    if (!user || !supabaseConfigured) {
      setSellerDraftReady(true);
      return;
    }
    setSellerDraftReady(false);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSellerDraftReady(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const d = await fetchSellerUploadDraft(supabase, user.id);
      if (cancelled || !d) {
        if (!cancelled) setSellerDraftReady(true);
        return;
      }
      setVideoUrl(normalizeYouTubeUrlToWatch(normalizeVideoUrl(d.videoUrl.trim())));
      setTitle(d.title);
      setDescription(d.description);
      setCategory(coerceSellCategoryForUserForm(d.category));
      setPrice(d.price);
      setIsAi(d.isAi);
      setDurationSec(d.durationSec);
      setOrientation(d.orientation);
      if (sourceType === "url" && d.videoUrl.trim()) {
        setFile(null);
        const vu = normalizeVideoUrl(d.videoUrl.trim());
        setPreviewUrl(normalizeYouTubeUrlToWatch(vu));
      } else {
        setFile(null);
        setPreviewUrl(null);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (d.hadLocalFile) {
        setMessage({
          ok: true,
          text: t("sellForm.draftLoaded"),
        });
      }
      if (!cancelled) setSellerDraftReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, supabaseConfigured, sourceType]);

  useEffect(() => {
    if (!sellerDraftReady || !user || !supabaseConfigured) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const payload: SellerUploadDraftPayload = {
      sourceType,
      videoUrl,
      title,
      description,
      hashtags: "",
      category,
      price,
      isAi,
      rights: true,
      confirmOriginal: true,
      confirmPromotionAndLiability: true,
      durationSec,
      orientation,
      hadLocalFile: Boolean(file),
    };
    const t = window.setTimeout(() => {
      void upsertSellerUploadDraft(supabase, user.id, payload);
    }, 500);
    return () => window.clearTimeout(t);
  }, [
    sellerDraftReady,
    user,
    supabaseConfigured,
    sourceType,
    videoUrl,
    title,
    description,
    category,
    price,
    isAi,
    durationSec,
    orientation,
    file,
  ]);

  /** 미리보기 비디오: 피커가 열렸을 때 슬라이더(draft)와 seek 동기 */
  useEffect(() => {
    if (!thumbPickerOpen) return;
    const el = videoPreviewRef.current;
    if (!el || !previewUrl) return;
    const d = el.duration;
    const cap = Number.isFinite(d) && d > 0 ? d - 0.04 : undefined;
    const t = cap !== undefined ? Math.min(thumbDraftSec, cap) : thumbDraftSec;
    el.currentTime = Number.isFinite(t) ? t : 0;
  }, [thumbDraftSec, previewUrl, thumbPickerOpen]);

  /** 피커를 닫은 뒤엔 확정 시점 프레임에 고정 */
  useEffect(() => {
    if (thumbPickerOpen) return;
    const el = videoPreviewRef.current;
    if (!el || !previewUrl) return;
    const raw = el.duration;
    const cap = Number.isFinite(raw) && raw > 0 ? raw - 0.04 : undefined;
    const next = clampThumbSec(thumbCommittedSec, durationSec);
    const t = cap !== undefined ? Math.min(next, cap) : next;
    el.currentTime = Number.isFinite(t) ? t : 0;
  }, [thumbPickerOpen, thumbCommittedSec, previewUrl, durationSec]);

  /** 공식 임베드(YouTube·TikTok·Instagram): duration·썸네일 시간 UI 제거 — 직접 URL은 resetPreview가 피커를 연다 */
  useEffect(() => {
    if (sourceType !== "url" || !previewUrl?.trim()) return;
    const embed = parseSocialVideoEmbed(previewUrl);
    if (!embed) return;
    setDurationSec(null);
    setThumbDraftSec(0);
    setThumbCommittedSec(0);
    setThumbPickerOpen(false);
    setOrientation(embed.aspect === "9:16" ? "portrait" : "landscape");
  }, [sourceType, previewUrl]);

  const onPickFile = (f: File | null) => {
    resetPreview();
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const onApplyVideoUrl = () => {
    const raw = videoUrl.trim();
    if (!raw) return;
    let normalized =
      raw.startsWith("http://") || raw.startsWith("https://")
        ? raw
        : raw.startsWith("/")
          ? raw
          : `https://${raw}`;
    const ytWatch = normalizeYouTubeUrlToWatch(normalized);
    if (ytWatch !== normalized) {
      setVideoUrl(ytWatch);
      normalized = ytWatch;
    }
    resetPreview();
    setPreviewUrl(normalized);
  };

  const onVideoMeta = () => {
    const el = videoPreviewRef.current;
    if (!el) return;
    const d = el.duration;
    if (Number.isFinite(d) && d > 0) {
      setDurationSec(Math.round(d));
      setThumbDraftSec((prev) => clampThumbSec(prev, Math.round(d)));
      setThumbCommittedSec((prev) => clampThumbSec(prev, Math.round(d)));
    }
    setOrientation(el.videoWidth >= el.videoHeight ? "landscape" : "portrait");
  };

  const onApplyThumbnailTime = async () => {
    const d = durationSec != null ? durationSec : null;
    const next = clampThumbSec(thumbDraftSec, d);
    setThumbCommittedSec(next);
    setThumbDraftSec(next);
    if (previewUrl && videoPreviewRef.current) {
      const posterBlob = await captureFrameFromVideo(
        videoPreviewRef.current,
        next,
        "image/jpeg",
        0.92,
      );
      if (posterBlob) {
        const nextObjectUrl = URL.createObjectURL(posterBlob);
        setAppliedThumbPreviewUrl((prev) => {
          if (prev?.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(prev);
            } catch {
              /* noop */
            }
          }
          return nextObjectUrl;
        });
      }
    }
    setThumbPickerOpen(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (sourceType === "file" && !file) {
      setMessage({ ok: false, text: t("sellForm.errNoFile") });
      return;
    }
    if (sourceType === "url" && !videoUrl.trim()) {
      setMessage({ ok: false, text: t("sellForm.errNoUrl") });
      return;
    }
    if (!category) {
      setMessage({ ok: false, text: t("sellForm.errNoCategory") });
      return;
    }
    if (
      previewUrl &&
      durationSec != null &&
      durationSec > 0 &&
      thumbPickerOpen &&
      Math.abs(thumbDraftSec - thumbCommittedSec) > 0.035
    ) {
      setMessage({
        ok: false,
        text: t("sellForm.errNoThumbnail"),
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
    const session = sessionData.session;

    setSubmitting(true);
    try {
      const fd = new FormData();
      if (sourceType === "file" && file) {
        fd.append("video", file);
      }
      if (sourceType === "url") {
        fd.append("videoUrl", videoUrl.trim());
      }
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("hashtags", "");
      fd.append("category", category);
      fd.append("price", price.trim());
      fd.append("orientation", orientation);
      fd.append("isAiGenerated", isAi ? "true" : "false");
      fd.append("editionKind", "open");
      fd.append("rightsConfirmed", "true");
      fd.append("confirmOriginal", "true");
      fd.append("confirmPromotionAndLiability", "true");
      if (durationSec != null) {
        fd.append("durationSec", String(durationSec));
      }

      if (sourceType === "file" && file) {
        let posterBlob: Blob | null = null;
        if (previewUrl && videoPreviewRef.current) {
          posterBlob = await captureFrameFromVideo(
            videoPreviewRef.current,
            thumbCommittedSec,
            "image/jpeg",
            0.92,
          );
        }
        if (!posterBlob) {
          posterBlob = await capturePosterFromFile(file, thumbCommittedSec);
        }
        if (!posterBlob) {
          setMessage({
            ok: false,
            text: t("sellForm.errThumbFail"),
          });
          return;
        }
        fd.append("poster", posterBlob, "poster.jpg");
      } else if (sourceType === "url" && previewUrl && videoPreviewRef.current) {
        const posterBlob = await captureFrameFromVideo(
          videoPreviewRef.current,
          thumbCommittedSec,
          "image/jpeg",
          0.92,
        );
        if (posterBlob) {
          fd.append("poster", posterBlob, "poster.jpg");
        }
      }

      const res = await fetch("/api/sell/upload", {
        method: "POST",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
        body: fd,
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        video?: FeedVideo;
      };

      if (!res.ok || !data.ok) {
        setMessage({
          ok: false,
          text: data.error ?? t("sellForm.errUploadFail"),
        });
        return;
      }

      if (session?.user?.id && supabase) {
        void deleteSellerUploadDraft(supabase, session.user.id);
      }

      setTitle("");
      setDescription("");
      setCategory("daily");
      setPrice("1000");
      setIsAi(false);
      setVideoUrl("");
      // 진입 전에 고른 등록 방식은 유지합니다.
      resetPreview();
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage(null);
      if (data.video) {
        try {
          window.sessionStorage.setItem(PENDING_UPLOADED_VIDEO_KEY, JSON.stringify(data.video));
        } catch {
          /* ignore storage write failures */
        }
      }

      const sellerIdForRedirect = session?.user?.id ?? user?.id ?? null;
      const sellerFeedHref = sellerIdForRedirect
        ? `/seller/${encodeURIComponent(sellerIdForRedirect)}`
        : "/mypage?tab=listings";

      // 상태 플러시·언마운트 후 이동 — refresh 병행 시 RSC/클라이언트 트리 불일치로 훅 오류가 날 수 있음
      queueMicrotask(() => {
        router.replace(sellerFeedHref);
      });
    } catch {
      setMessage({ ok: false, text: t("sellForm.errNetwork") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm"
      onSubmit={onSubmit}
    >
      <header className="mb-6 border-b border-white/10 pb-4 [html[data-theme='light']_&]:border-zinc-100">
        <div className="mb-4 flex min-w-0 items-center gap-2 sm:gap-2.5">
          <Film
            aria-hidden
            color="#E42980"
            className="h-6 w-6 shrink-0 sm:h-[1.625rem] sm:w-[1.625rem]"
            strokeWidth={2}
          />
          <h2 className="whitespace-nowrap text-[clamp(1.05rem,2.6vw,1.4rem)] font-semibold leading-none tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
            {t("sellForm.title")}
          </h2>
        </div>

        <fieldset className="w-full max-w-[40rem] text-left">
          <legend className="sr-only">{t("sellForm.sourceLegend")}</legend>
          <div className={SOURCE_PANEL}>
            {sourceType === "file" ? (
              <>
                <input
                  id={`${hid}-video`}
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
                  tabIndex={-1}
                  className="sr-only"
                  aria-hidden
                  onChange={(e) => {
                    onPickFile(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
                  <span className="text-left text-[13px] font-semibold text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
                    {t("sellForm.sourceFile")}
                  </span>
                  <button
                    type="button"
                    className={`${SOURCE_SECONDARY_BTN} w-full sm:w-auto`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t("sellForm.chooseFile")}
                  </button>
                </div>
                <p className="mt-1.5 truncate text-left text-[12px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                  {file?.name ?? t("sellForm.noFileChosen")}
                </p>
              </>
            ) : (
              <div className="w-full max-w-[40rem] space-y-2 text-left">
                <label className={`${LABEL} mb-0`} htmlFor={`${hid}-video-url`}>
                  {t("sellForm.sourceUrl")}
                </label>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch">
                  <div className="relative min-h-[48px] min-w-0 flex-1">
                    <input
                      id={`${hid}-video-url`}
                      className={`${INPUT} min-h-[48px] w-full py-3 pr-11`}
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder={t("sellForm.urlPlaceholder")}
                    />
                    {videoUrl.trim().length > 0 ? (
                      <button
                        type="button"
                        aria-label={t("sellForm.clearUrl")}
                        className="absolute right-2 top-1/2 z-[1] -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-zinc-100 [html[data-theme='light']_&]:text-zinc-500 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900"
                        onClick={clearUrlFieldAndPreview}
                      >
                        <X className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
                      </button>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={onApplyVideoUrl}
                    className={`${SOURCE_SECONDARY_BTN} min-h-[48px] shrink-0 whitespace-nowrap sm:min-w-[7.5rem]`}
                  >
                    {t("sellForm.preview")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </fieldset>
      </header>

      {message?.ok ? (
        <div
          className={`mb-8 flex items-start gap-2 rounded-xl border px-3.5 py-3 text-[13px] font-medium ${
            "border-emerald-500/35 bg-emerald-500/[0.08] text-emerald-200 [html[data-theme='light']_&]:text-emerald-900"
          }`}
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden />
          <span>{message.text}</span>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="space-y-6">
            <div>
              <label className={LABEL} htmlFor={`${hid}-title`}>
                {t("sellForm.titleLabel")}
              </label>
              <input
                id={`${hid}-title`}
                className={INPUT}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("sellForm.titlePlaceholder")}
                maxLength={120}
                required
              />
            </div>

            <div>
              <label className={LABEL} htmlFor={`${hid}-desc`}>
                {t("sellForm.descLabel")}
              </label>
              <textarea
                id={`${hid}-desc`}
                className={`${INPUT} min-h-[120px] resize-y`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("sellForm.descPlaceholder")}
                maxLength={2000}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor={`${hid}-category`}>
                  {t("sellForm.categoryLabel")}
                </label>
                <SellCategorySelect
                  id={`${hid}-category`}
                  listboxId={`${hid}-category-listbox`}
                  value={category}
                  onChange={setCategory}
                  ariaLabel={t("sellForm.categoryAria")}
                  triggerClassName="h-[52px] min-h-0 py-0 text-[15px]"
                />
              </div>

              <div>
                <label className={LABEL} htmlFor={`${hid}-price`}>
                  {t("sellForm.priceLabel")}
                </label>
                <input
                  id={`${hid}-price`}
                  className={`${INPUT} h-[52px]`}
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                  required
                />
              </div>
            </div>
          </div>

          <aside
            className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 lg:-mt-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/70"
            aria-label={t("sellForm.videoPreviewAria")}
          >
            {previewUrl ? (
              <>
                {socialEmbedPreview ? (
                  <SocialSellEmbedPreview embed={socialEmbedPreview} />
                ) : (
                  <div className="overflow-hidden rounded-xl border border-white/12 bg-zinc-950/80 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100">
                    <video
                      ref={videoPreviewRef}
                      className={
                        orientation === "portrait"
                          ? "sell-video-preview mx-auto w-full max-w-[300px] aspect-[9/16] object-cover"
                          : "sell-video-preview w-full aspect-video object-contain"
                      }
                      src={previewUrl}
                      crossOrigin="anonymous"
                      muted
                      playsInline
                      controls
                      controlsList="nodownload noplaybackrate noremoteplayback nopictureinpicture"
                      disablePictureInPicture
                      disableRemotePlayback
                      onLoadedMetadata={onVideoMeta}
                    />
                  </div>
                )}

                {!socialEmbedPreview ? (
                  <>
                    {thumbPickerOpen ? (
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
                        <div className="mb-2 flex items-end justify-between gap-2">
                          <label
                            htmlFor={`${hid}-thumb-range`}
                            className="block text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600"
                          >
                            {t("sellForm.thumbnailScene")}
                          </label>
                          <span className="font-mono text-[12px] tabular-nums text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                            {(durationSec != null && durationSec > 0
                              ? Math.min(thumbDraftSec, durationSec)
                              : thumbDraftSec
                            ).toFixed(2)}
                            {t("sellForm.sec")}
                          </span>
                        </div>
                        <input
                          id={`${hid}-thumb-range`}
                          type="range"
                          min={0}
                          max={durationSec != null && durationSec > 0 ? durationSec : 1}
                          step={0.05}
                          value={
                            durationSec != null && durationSec > 0
                              ? Math.min(thumbDraftSec, durationSec)
                              : thumbDraftSec
                          }
                          onChange={(e) => setThumbDraftSec(parseFloat(e.target.value))}
                          className="w-full cursor-pointer accent-reels-crimson"
                          aria-label={t("sellForm.thumbnailSeekAria")}
                        />
                        <button
                          type="button"
                          onClick={onApplyThumbnailTime}
                          className={`mt-3 ${MYPAGE_OUTLINE_BTN_MD} w-full cursor-pointer ${BTN_DISABLED_GHOST}`}
                          disabled={!(durationSec != null && durationSec > 0)}
                        >
                          {t("sellForm.applyThumbnail")}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setThumbPickerOpen(true)}
                        className={`${SOURCE_SECONDARY_BTN} w-auto px-4 text-[15px]`}
                      >
                        {t("sellForm.changeThumbnail")}
                      </button>
                    )}

                    {appliedThumbPreviewUrl ? (
                      <div className="w-full max-w-[200px] overflow-hidden rounded-xl border border-white/12 bg-zinc-950/80 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100">
                        <img
                          src={appliedThumbPreviewUrl}
                          alt={t("sellForm.thumbnailPreviewAlt")}
                          className={
                            orientation === "portrait"
                              ? "w-full aspect-[9/16] object-cover"
                              : "w-full aspect-video object-cover"
                          }
                        />
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-[11px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                    {t("sellForm.platformPreviewNote")}
                  </p>
                )}
              </>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-black/[0.12] px-4 py-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/80">
                <Film
                  aria-hidden
                  className="h-8 w-8 shrink-0 text-zinc-500/45"
                  strokeWidth={1.5}
                />
                <p className="max-w-[16rem] text-[13px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                  {t("sellForm.previewHint")}
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>

      <div className="mt-10 flex flex-col-reverse gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between [html[data-theme='light']_&]:border-zinc-100">
        {!message?.ok && message ? (
          <div
            className="flex items-start gap-2 rounded-xl border border-reels-crimson/35 bg-reels-crimson/[0.08] px-3.5 py-2.5 text-[13px] font-medium text-[#F9ECF3] [html[data-theme='light']_&]:text-reels-crimson"
            role="status"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden />
            <span>{message.text}</span>
          </div>
        ) : (
        <p className="text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
          {t("sellForm.termsNotice")}
        </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 ${MYPAGE_OUTLINE_BTN_MD} sm:w-auto sm:min-w-[10rem] ${BTN_DISABLED_GHOST}`}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-4 w-4" aria-hidden />
          )}
          {t("sellForm.submit")}
        </button>
      </div>
    </form>
  );
}
