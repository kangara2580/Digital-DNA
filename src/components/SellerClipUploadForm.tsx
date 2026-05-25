"use client";

import {
  AlertCircle,
  CheckCircle2,
  Film,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { AraDualSpinLogo } from "@/components/AraDualSpinLogo";
import { GemAmount } from "@/components/PaymentDiamondIcon";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import { localizeApiError } from "@/lib/i18n/localizeApiError";
import type { SiteLocale } from "@/lib/sitePreferences";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  coerceSellCategoryForUserForm,
  type SellVideoUserSelectableCategory,
} from "@/lib/sellVideoCategory";
import { SELL_CUSTOM_POSTER_MAX_BYTES } from "@/lib/sellCustomPosterMaxBytes";
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
import type { FeedVideo } from "@/data/videos";

const PENDING_UPLOADED_VIDEO_KEY = "sell:pending-uploaded-video";

const INPUT =
  "w-full rounded-xl border border-white/[0.14] bg-[#0c0c0e] px-4 py-3 text-[15px] leading-snug text-zinc-100 caret-reels-crimson outline-none transition-[border-color,box-shadow] placeholder:text-zinc-600 focus:border-white/[0.32] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.35)] focus:outline-none focus-visible:outline-none [html[data-theme='light']_&]:border-zinc-200/75 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:placeholder:text-zinc-400 [html[data-theme='light']_&]:focus:border-zinc-400/85 [html[data-theme='light']_&]:focus:shadow-[0_0_0_1px_rgba(0,0,0,0.12)]";

const LABEL =
  "mb-2 block text-[15px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900";

const SOURCE_PANEL = "px-0 py-0";

/** 마이페이지 고스트 CTA와 동일 호버 — 비활성일 때 리프트·스케일 제거 */
const BTN_DISABLED_GHOST =
  "disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100";

/** 본문 액션: 탭 선택과 구분되는 얇은 아웃라인 (핑크 채우기·글로우 없음) */
const SOURCE_SECONDARY_BTN =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-[13px] font-medium text-zinc-100 shadow-none transition-colors hover:border-white/[0.32] hover:bg-white/[0.06] active:bg-white/[0.04] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:hover:bg-zinc-50";

const ALLOWED_CUSTOM_POSTER_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** 등록 포스터 캡처 시점(sec) 안전 클램프 */
function clampThumbSec(t: number, durationSec: number | null): number {
  const x = Number.isFinite(t) ? Math.max(0, t) : 0;
  if (durationSec != null && Number.isFinite(durationSec) && durationSec > 0) {
    const cap = Math.max(0, durationSec - 0.05);
    return Math.min(x, cap);
  }
  return x;
}

export function SellerClipUploadForm() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const posterImageInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const hid = useId();
  const { user, supabaseConfigured } = useAuthSession();
  const [sellerDraftReady, setSellerDraftReady] = useState(false);

  const [file, setFile] = useState<File | null>(null);
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
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SellVideoUserSelectableCategory>("daily");
  const [price, setPrice] = useState("1000");
  const [isAi, setIsAi] = useState(false);
  /** 직접 올린 썸네일 — 있으면 등록 시 영상 프레임 캡처 대신 전송 */
  const [customPosterFile, setCustomPosterFile] = useState<File | null>(null);
  const [customPosterPreviewUrl, setCustomPosterPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

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
    if (customPosterPreviewUrl?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(customPosterPreviewUrl);
      } catch {
        /* noop */
      }
    }
    setPreviewUrl(null);
    setAppliedThumbPreviewUrl(null);
    setCustomPosterPreviewUrl(null);
    setCustomPosterFile(null);
    setFile(null);
    setDurationSec(null);
    setThumbDraftSec(0);
    setThumbCommittedSec(0);
    setThumbPickerOpen(true);
    if (posterImageInputRef.current) posterImageInputRef.current.value = "";
  }, [previewUrl, appliedThumbPreviewUrl, customPosterPreviewUrl]);

  const clearCustomPoster = useCallback(() => {
    setMessage(null);
    setCustomPosterPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(prev);
        } catch {
          /* noop */
        }
      }
      return null;
    });
    setCustomPosterFile(null);
    if (posterImageInputRef.current) posterImageInputRef.current.value = "";
  }, []);

  const onPickCustomPoster = (f: File | null) => {
    setMessage(null);
    if (!f) return;
    const mime = f.type || "";
    if (!ALLOWED_CUSTOM_POSTER_MIME.has(mime)) {
      setMessage({ ok: false, text: t("sellForm.errPosterType") });
      return;
    }
    if (f.size > SELL_CUSTOM_POSTER_MAX_BYTES) {
      setMessage({ ok: false, text: t("sellForm.errPosterTooLarge") });
      return;
    }
    setCustomPosterPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(prev);
        } catch {
          /* noop */
        }
      }
      return URL.createObjectURL(f);
    });
    setCustomPosterFile(f);
  };

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
      setTitle(d.title);
      setDescription(d.description);
      setCategory(coerceSellCategoryForUserForm(d.category));
      setPrice(d.price);
      setIsAi(d.isAi);
      setDurationSec(d.durationSec);
      setOrientation(d.orientation);
      setFile(null);
      setPreviewUrl(null);
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
  }, [user, supabaseConfigured, t]);

  useEffect(() => {
    if (!sellerDraftReady || !user || !supabaseConfigured) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const payload: SellerUploadDraftPayload = {
      sourceType: "file",
      videoUrl: "",
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
    const timer = window.setTimeout(() => {
      void upsertSellerUploadDraft(supabase, user.id, payload);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [
    sellerDraftReady,
    user,
    supabaseConfigured,
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
    const seekT = cap !== undefined ? Math.min(thumbDraftSec, cap) : thumbDraftSec;
    el.currentTime = Number.isFinite(seekT) ? seekT : 0;
  }, [thumbDraftSec, previewUrl, thumbPickerOpen]);

  /** 피커를 닫은 뒤엔 확정 시점 프레임에 고정 */
  useEffect(() => {
    if (thumbPickerOpen) return;
    const el = videoPreviewRef.current;
    if (!el || !previewUrl) return;
    const raw = el.duration;
    const cap = Number.isFinite(raw) && raw > 0 ? raw - 0.04 : undefined;
    const next = clampThumbSec(thumbCommittedSec, durationSec);
    const seekT = cap !== undefined ? Math.min(next, cap) : next;
    el.currentTime = Number.isFinite(seekT) ? seekT : 0;
  }, [thumbPickerOpen, thumbCommittedSec, previewUrl, durationSec]);

  const onPickFile = (f: File | null) => {
    resetPreview();
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
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

    if (!file) {
      setMessage({ ok: false, text: t("sellForm.errNoFile") });
      return;
    }
    if (!category) {
      setMessage({ ok: false, text: t("sellForm.errNoCategory") });
      return;
    }
    if (
      !customPosterFile &&
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
      fd.append("video", file);
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

      if (customPosterFile) {
        const mime = customPosterFile.type || "";
        if (!ALLOWED_CUSTOM_POSTER_MIME.has(mime)) {
          setMessage({ ok: false, text: t("sellForm.errPosterType") });
          return;
        }
        if (customPosterFile.size > SELL_CUSTOM_POSTER_MAX_BYTES) {
          setMessage({ ok: false, text: t("sellForm.errPosterTooLarge") });
          return;
        }
        const ext =
          mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
        const safeName = (customPosterFile.name || "").trim();
        fd.append(
          "poster",
          customPosterFile,
          safeName || `poster.${ext}`,
        );
      } else {
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
          text: localizeApiError(
            locale as SiteLocale,
            data.error ?? data.message ?? t("sellForm.errUploadFail"),
          ),
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

      try {
        for (const key of Object.keys(window.sessionStorage)) {
          if (key.startsWith("reels:category:feed:")) {
            window.sessionStorage.removeItem(key);
          }
        }
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event("reels-market-feed-updated"));

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
      autoComplete="off"
      className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm"
      onSubmit={onSubmit}
    >
      <header className="mb-6 border-b border-white/10 pb-4 [html[data-theme='light']_&]:border-zinc-100">
        <div className="mb-4 flex min-w-0 items-center gap-2 sm:gap-2.5">
          <Film
            aria-hidden
            color="#FF2D8D"
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
            <div className="flex w-full min-w-0 flex-row flex-wrap items-center gap-x-3 gap-y-1.5">
              <button
                type="button"
                aria-label={t("sellForm.sourceFile")}
                className={`${SOURCE_SECONDARY_BTN} shrink-0 px-5 py-3 text-[15px] font-semibold sm:px-6 sm:py-3.5 sm:text-[16px]`}
                onClick={() => fileInputRef.current?.click()}
              >
                {t("sellForm.chooseFile")}
              </button>
              <p className="min-w-0 flex-1 truncate text-left text-[13px] leading-snug text-zinc-500 sm:text-[14px] [html[data-theme='light']_&]:text-zinc-600">
                {file?.name ?? t("sellForm.noFileChosen")}
              </p>
            </div>
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
                name="sell_clip_listing_title"
                className={INPUT}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("sellForm.titlePlaceholder")}
                maxLength={120}
                autoComplete="off"
                data-lpignore="true"
                required
              />
            </div>

            <div>
              <label className={LABEL} htmlFor={`${hid}-desc`}>
                {t("sellForm.descLabel")}
              </label>
              <textarea
                id={`${hid}-desc`}
                name="sell_clip_listing_description"
                className={`${INPUT} min-h-[120px] resize-y`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("sellForm.descPlaceholder")}
                maxLength={2000}
                autoComplete="off"
                data-lpignore="true"
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
                  {price && Number(price) > 0 ? (
                    <span className="ml-2 text-xs font-normal text-zinc-400">
                      ={" "}
                      <GemAmount
                        value={Math.round(Number(price) / 6).toLocaleString()}
                        className="inline-flex text-xs font-normal text-zinc-400"
                        iconClassName="h-3 w-3 shrink-0 text-[color:var(--reels-point)]"
                      />
                    </span>
                  ) : null}
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

            <div>
              <label className={LABEL} htmlFor={`${hid}-custom-poster-open`}>
                {t("sellForm.customPosterLabel")}
              </label>
              <p className="mb-2 text-[13px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                {t("sellForm.customPosterHint")}
              </p>
              <div className={SOURCE_PANEL}>
                <input
                  id={`${hid}-custom-poster`}
                  ref={posterImageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  tabIndex={-1}
                  className="sr-only"
                  aria-hidden
                  onChange={(e) => {
                    onPickCustomPoster(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
                <div className="flex w-full min-w-0 flex-row flex-wrap items-center gap-x-3 gap-y-1.5">
                  <button
                    type="button"
                    id={`${hid}-custom-poster-open`}
                    aria-label={t("sellForm.customPosterChoose")}
                    className={`${SOURCE_SECONDARY_BTN} shrink-0 px-5 py-3 text-[15px] font-semibold sm:px-6 sm:py-3.5 sm:text-[16px]`}
                    onClick={() => posterImageInputRef.current?.click()}
                  >
                    {t("sellForm.customPosterChoose")}
                  </button>
                  <p className="min-w-0 flex-1 truncate text-left text-[13px] leading-snug text-zinc-500 sm:text-[14px] [html[data-theme='light']_&]:text-zinc-600">
                    {customPosterFile?.name ?? t("sellForm.customPosterNone")}
                  </p>
                  {customPosterFile ? (
                    <button
                      type="button"
                      onClick={clearCustomPoster}
                      className={`${SOURCE_SECONDARY_BTN} shrink-0 px-4 py-2.5 text-[13px] font-medium`}
                    >
                      {t("sellForm.customPosterClear")}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <aside
            className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 lg:-mt-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/70"
            aria-label={t("sellForm.videoPreviewAria")}
          >
            {previewUrl ? (
              <>
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

                {(customPosterPreviewUrl || appliedThumbPreviewUrl) ? (
                  <div className="w-full max-w-[200px] overflow-hidden rounded-xl border border-white/12 bg-zinc-950/80 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100">
                    <img
                      src={customPosterPreviewUrl ?? appliedThumbPreviewUrl ?? ""}
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
            {t("sellForm.termsNoticePrefix")}
            <Link
              href="/license#seller"
              className="font-semibold text-reels-cyan underline underline-offset-2 hover:text-[color:var(--reels-point)] [html[data-theme='light']_&]:text-[color:var(--reels-point)]"
            >
              {t("sellForm.termsNoticeLink")}
            </Link>
            {t("sellForm.termsNoticeSuffix")}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 ${MYPAGE_OUTLINE_BTN_MD} sm:w-auto sm:min-w-[10rem] ${BTN_DISABLED_GHOST}`}
        >
          {submitting ? (
            <AraDualSpinLogo size={16} className="shrink-0" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden />
          )}
          {t("sellForm.submit")}
        </button>
      </div>
    </form>
  );
}
