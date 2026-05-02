"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Film,
  Image as ImageIcon,
  Loader2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  isSellVideoCategory,
  SELL_VIDEO_CATEGORY_OPTIONS,
  type SellVideoCategory,
} from "@/lib/sellVideoCategory";
import {
  captureFrameFromVideo,
  capturePosterFromFile,
} from "@/lib/captureVideoFrame";
import {
  deleteSellerUploadDraft,
  fetchSellerUploadDraft,
  upsertSellerUploadDraft,
  type SellerUploadDraftPayload,
} from "@/lib/supabaseSellerUploadDraft";

const INPUT =
  "w-full rounded-xl border border-white/[0.085] bg-white/[0.06] px-4 py-3 text-[15px] leading-snug text-zinc-100 caret-reels-crimson outline-none transition-[border-color,box-shadow] placeholder:text-zinc-600 focus:border-white/[0.32] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.35)] focus:outline-none focus-visible:outline-none [html[data-theme='light']_&]:border-zinc-200/75 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:placeholder:text-zinc-400 [html[data-theme='light']_&]:focus:border-zinc-400/85 [html[data-theme='light']_&]:focus:shadow-[0_0_0_1px_rgba(0,0,0,0.12)]";

const LABEL =
  "mb-2 block text-[13px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600";

/** 영상 소스: 한 트랙 안 세그먼트 (떠 있는 이중 핑크 버튼 느낌 완화) */
const SOURCE_SEGMENT_TRACK =
  "flex w-full max-w-[min(24rem,100%)] gap-1 rounded-full border border-white/[0.1] bg-white/[0.04] p-1 [html[data-theme='light']_&]:border-zinc-200/80 [html[data-theme='light']_&]:bg-zinc-100/45";

const SOURCE_SEGMENT_BTN =
  "relative flex min-h-[2.75rem] flex-1 items-center justify-center rounded-full px-4 py-2 text-center text-[15px] font-medium leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-0 focus-visible:ring-offset-transparent sm:min-h-[2.875rem] sm:py-2.5 [html[data-theme='light']_&]:focus-visible:ring-zinc-400/40";

const SOURCE_SEGMENT_BTN_ACTIVE =
  "bg-white/[0.17] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)] [html[data-theme='light']_&]:bg-white/[0.72] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]";

const SOURCE_SEGMENT_BTN_INACTIVE =
  "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-white/40 [html[data-theme='light']_&]:hover:text-zinc-900";

const SOURCE_PANEL =
  "border-t border-white/[0.08] bg-black/[0.12] px-4 py-5 sm:px-5 sm:py-6 [html[data-theme='light']_&]:border-zinc-100 [html[data-theme='light']_&]:bg-zinc-50/40";

/** 본문 액션: 탭 선택과 구분되는 얇은 아웃라인 (핑크 채우기·글로우 없음) */
const SOURCE_SECONDARY_BTN =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-[13px] font-medium text-zinc-100 shadow-none transition-colors hover:border-white/[0.32] hover:bg-white/[0.06] active:bg-white/[0.04] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:hover:bg-zinc-50";

/** 등록 포스터 캡처 시점(sec) 안전 클램프 */
function clampThumbSec(t: number, durationSec: number | null): number {
  const x = Number.isFinite(t) ? Math.max(0, t) : 0;
  if (durationSec != null && Number.isFinite(durationSec) && durationSec > 0) {
    const cap = Math.max(0, durationSec - 0.05);
    return Math.min(x, cap);
  }
  return x;
}

const RIGHTS_CHECK_WRAP =
  "mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border border-white/30 bg-transparent transition-[border-color,background-color] peer-checked:border-reels-crimson peer-checked:bg-reels-crimson peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-reels-crimson/55 [html[data-theme='light']_&]:border-zinc-300 peer-checked:[html[data-theme='light']_&]:border-reels-crimson";

function RightsAgreementCheckbox({
  checked,
  onChange,
  required: req,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        required={req}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={`${RIGHTS_CHECK_WRAP} peer-checked:[&_svg]:opacity-100`} aria-hidden>
        <Check className="h-3 w-3 text-white opacity-0 transition-opacity" strokeWidth={3} />
      </span>
      <span className="text-[14px] font-medium leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
        {children}
      </span>
    </label>
  );
}

function normalizeVideoUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("/")) return t;
  return `https://${t}`;
}

export function SellerClipUploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const hid = useId();
  const { user, supabaseConfigured } = useAuthSession();
  const [sellerDraftReady, setSellerDraftReady] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<"file" | "url">("file");
  const [videoUrl, setVideoUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  /** 슬라이더·영상 미리보기 동기 시점(초) */
  const [thumbDraftSec, setThumbDraftSec] = useState(0);
  /** 등록 시 포스터 캡처에 쓸 확정 시점(초) —「썸네일로 적용」으로 갱신 */
  const [thumbCommittedSec, setThumbCommittedSec] = useState(0);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SellVideoCategory>("daily");
  const [price, setPrice] = useState("1000");
  const [isAi, setIsAi] = useState(false);
  const [rights, setRights] = useState(false);
  const [confirmOriginal, setConfirmOriginal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const resetPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFile(null);
    setDurationSec(null);
    setThumbDraftSec(0);
    setThumbCommittedSec(0);
  }, [previewUrl]);

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
      setSourceType(d.sourceType);
      setVideoUrl(d.videoUrl);
      setTitle(d.title);
      setDescription(d.description);
      setCategory(
        typeof d.category === "string" && isSellVideoCategory(d.category)
          ? d.category
          : "daily",
      );
      setPrice(d.price);
      setIsAi(d.isAi);
      setRights(d.rights);
      setConfirmOriginal(d.confirmOriginal);
      setDurationSec(d.durationSec);
      setOrientation(d.orientation);
      if (d.sourceType === "url" && d.videoUrl.trim()) {
        setFile(null);
        setPreviewUrl(normalizeVideoUrl(d.videoUrl.trim()));
      } else {
        setFile(null);
        setPreviewUrl(null);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (d.hadLocalFile) {
        setMessage({
          ok: true,
          text: "임시 저장된 양식을 불러왔어요. 동영상 파일은 보안상 서버에 남지 않으니 다시 선택해 주세요.",
        });
      }
      if (!cancelled) setSellerDraftReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, supabaseConfigured]);

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
      rights,
      confirmOriginal,
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
    rights,
    confirmOriginal,
    durationSec,
    orientation,
    file,
  ]);

  /** 미리보기 비디오: 슬라이더(draft)와 동기 시 seek */
  useEffect(() => {
    const el = videoPreviewRef.current;
    if (!el || !previewUrl) return;
    const d = el.duration;
    const cap = Number.isFinite(d) && d > 0 ? d - 0.04 : undefined;
    const t = cap !== undefined ? Math.min(thumbDraftSec, cap) : thumbDraftSec;
    el.currentTime = Number.isFinite(t) ? t : 0;
  }, [thumbDraftSec, previewUrl]);

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
    const normalized = raw.startsWith("http://") || raw.startsWith("https://")
      ? raw
      : raw.startsWith("/")
        ? raw
        : `https://${raw}`;
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

  const onApplyThumbnailTime = () => {
    const d = durationSec != null ? durationSec : null;
    const next = clampThumbSec(thumbDraftSec, d);
    setThumbCommittedSec(next);
    setThumbDraftSec(next);
    const el = videoPreviewRef.current;
    if (el && previewUrl) {
      const raw = el.duration;
      const cap = Number.isFinite(raw) && raw > 0 ? raw - 0.04 : undefined;
      const t = cap !== undefined ? Math.min(next, cap) : next;
      el.currentTime = Number.isFinite(t) ? t : 0;
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (sourceType === "file" && !file) {
      setMessage({ ok: false, text: "동영상 파일을 선택해 주세요." });
      return;
    }
    if (sourceType === "url" && !videoUrl.trim()) {
      setMessage({ ok: false, text: "동영상 URL을 입력해 주세요." });
      return;
    }
    if (!rights || !confirmOriginal) {
      setMessage({
        ok: false,
        text: "권리·원본 확인 항목에 모두 동의해 주세요.",
      });
      return;
    }
    if (!category) {
      setMessage({ ok: false, text: "카테고리를 선택해 주세요." });
      return;
    }
    if (
      previewUrl &&
      durationSec != null &&
      durationSec > 0 &&
      Math.abs(thumbDraftSec - thumbCommittedSec) > 0.035
    ) {
      setMessage({
        ok: false,
        text: '슬라이더로 장면을 맞춘 뒤「썸네일로 적용」 버튼을 눌러 저장한 다음 등록해 주세요.',
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
      fd.append("rightsConfirmed", rights ? "true" : "false");
      fd.append("confirmOriginal", confirmOriginal ? "true" : "false");
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
            text:
              "영상에서 썸네일을 만들 수 없습니다. MP4 등 지원 형식인지 확인하거나 잠시 후 다시 시도해 주세요.",
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
      };

      if (!res.ok || !data.ok) {
        setMessage({
          ok: false,
          text: data.error ?? "업로드에 실패했습니다.",
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
      setRights(false);
      setConfirmOriginal(false);
      setVideoUrl("");
      setSourceType("file");
      resetPreview();
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage(null);

      // 상태 플러시·언마운트 후 이동 — refresh 병행 시 RSC/클라이언트 트리 불일치로 훅 오류가 날 수 있음
      queueMicrotask(() => {
        router.replace("/mypage?tab=listings");
      });
    } catch {
      setMessage({ ok: false, text: "네트워크 오류가 발생했습니다." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm"
      onSubmit={onSubmit}
    >
      <header className="mb-8 flex items-center gap-2 border-b border-white/10 pb-6 sm:gap-2.5 [html[data-theme='light']_&]:border-zinc-100">
        <Film
          aria-hidden
          color="#fc03a5"
          className="h-6 w-6 shrink-0 sm:h-[1.625rem] sm:w-[1.625rem]"
          strokeWidth={2}
        />
        <h2 className="text-[clamp(1.2rem,3.35vw,1.5rem)] font-semibold leading-tight tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
          영상 등록
        </h2>
      </header>

      {message ? (
        <div
          className={`mb-8 flex items-start gap-2 rounded-xl border px-3.5 py-3 text-[13px] font-medium ${
            message.ok
              ? "border-emerald-500/35 bg-emerald-500/[0.08] text-emerald-200 [html[data-theme='light']_&]:text-emerald-900"
              : "border-reels-crimson/35 bg-reels-crimson/[0.08] text-pink-100 [html[data-theme='light']_&]:text-reels-crimson"
          }`}
          role="status"
        >
          {message.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden />
          )}
          <span>{message.text}</span>
        </div>
      ) : null}

      <div className="space-y-10">
        <fieldset className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
          <legend className="sr-only">영상 소스</legend>

          <div className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
            <p className="mx-auto mb-3 max-w-md px-2 text-center text-[12px] font-medium leading-relaxed tracking-tight text-white/42 [html[data-theme='light']_&]:text-zinc-600/85">
              둘 중 하나의 방법을 선택해 주세요.
            </p>
            <div className="flex justify-center">
              <div
                role="tablist"
                aria-label="영상 등록 방식"
                className={SOURCE_SEGMENT_TRACK}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={sourceType === "file"}
                  onClick={() => setSourceType("file")}
                  className={`${SOURCE_SEGMENT_BTN} ${sourceType === "file" ? SOURCE_SEGMENT_BTN_ACTIVE : SOURCE_SEGMENT_BTN_INACTIVE}`}
                >
                  직접 업로드
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={sourceType === "url"}
                  onClick={() => setSourceType("url")}
                  className={`${SOURCE_SEGMENT_BTN} ${sourceType === "url" ? SOURCE_SEGMENT_BTN_ACTIVE : SOURCE_SEGMENT_BTN_INACTIVE}`}
                >
                  영상 URL
                </button>
              </div>
            </div>
          </div>

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
                <div className="rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-4 py-5 sm:p-6 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/60">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="min-w-0 space-y-1">
                      <p className="text-[13px] font-semibold text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
                        동영상 파일
                      </p>
                      <p className="text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                        MP4 · MOV · WebM
                      </p>
                    </div>
                    <div className="flex min-w-0 flex-col gap-2 sm:w-auto sm:max-w-[min(100%,22rem)] sm:items-end">
                      <button
                        type="button"
                        className={`${SOURCE_SECONDARY_BTN} w-full sm:w-auto`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        파일 선택
                      </button>
                      <p className="truncate text-center text-[12px] leading-snug text-zinc-500 sm:text-right [html[data-theme='light']_&]:text-zinc-600">
                        {file?.name ?? "선택된 파일 없음"}
                      </p>
                    </div>
                  </div>
                </div>
                {previewUrl ? (
                  <div className="mt-5 flex w-full min-w-0 justify-center overflow-hidden rounded-xl border border-white/12 bg-zinc-950/80 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100">
                    <video
                      ref={videoPreviewRef}
                      className="max-h-[min(52vh,480px)] w-full object-contain"
                      src={previewUrl}
                      crossOrigin="anonymous"
                      muted
                      playsInline
                      controls
                      onLoadedMetadata={onVideoMeta}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <div className="space-y-3">
                <label className={`${LABEL} mb-0`} htmlFor={`${hid}-video-url`}>
                  동영상 URL
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    id={`${hid}-video-url`}
                    className={`${INPUT} min-h-[48px] sm:flex-1`}
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://... 또는 /videos/sample1.mp4"
                  />
                  <button
                    type="button"
                    onClick={onApplyVideoUrl}
                    className={`${SOURCE_SECONDARY_BTN} min-h-[48px] whitespace-nowrap sm:min-w-[7.5rem]`}
                  >
                    미리보기
                  </button>
                </div>
                <p className="text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                  공개 접근 가능한 영상 주소를 넣으면 미리보기로 확인할 수 있어요.
                </p>
                {previewUrl ? (
                  <div className="mt-5 flex w-full justify-center overflow-hidden rounded-xl border border-white/12 bg-zinc-950/80 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100">
                    <video
                      ref={videoPreviewRef}
                      className="max-h-[min(52vh,480px)] w-full object-contain"
                      src={previewUrl}
                      crossOrigin="anonymous"
                      muted
                      playsInline
                      controls
                      onLoadedMetadata={onVideoMeta}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {previewUrl ? (
            <div className="border-t border-white/[0.08] p-4 sm:p-6 [html[data-theme='light']_&]:border-zinc-100">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.05] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50"
                    aria-hidden
                  >
                    <ImageIcon className="h-5 w-5 text-reels-crimson" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                      썸네일 장면
                    </p>
                    <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                      슬라이더로 프레임을 맞춘 뒤{" "}
                      <span className="font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
                        썸네일로 적용
                      </span>
                      으로 확정하면 등록 시 그 순간의 화면이 썸네일로 들어가요.
                      일부 외부 주소는 정책 때문에 썸네일 추출에 실패할 수 있어요.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 sm:p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/90">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <label
                    htmlFor={`${hid}-thumb-range`}
                    className="block text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600"
                  >
                    재생 프레임 맞추기
                  </label>
                  <span className="font-mono text-[13px] tabular-nums text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                    미리보기{" "}
                    {(durationSec != null && durationSec > 0
                      ? Math.min(thumbDraftSec, durationSec)
                      : thumbDraftSec
                    ).toFixed(2)}{" "}
                    초
                  </span>
                </div>

                <input
                  id={`${hid}-thumb-range`}
                  type="range"
                  min={0}
                  max={
                    durationSec != null && durationSec > 0 ? durationSec : 1
                  }
                  step={0.05}
                  value={
                    durationSec != null && durationSec > 0
                      ? Math.min(thumbDraftSec, durationSec)
                      : thumbDraftSec
                  }
                  onChange={(e) =>
                    setThumbDraftSec(parseFloat(e.target.value))
                  }
                  className="w-full cursor-pointer accent-reels-crimson"
                  aria-valuemin={0}
                  aria-valuemax={
                    durationSec != null && durationSec > 0
                      ? durationSec
                      : 1
                  }
                  aria-valuenow={
                    durationSec != null && durationSec > 0
                      ? Math.min(thumbDraftSec, durationSec)
                      : thumbDraftSec
                  }
                  aria-label="썸네일로 쓸 동영상 시점(초)"
                />

                <div className="mt-2 flex justify-between text-[11px] text-zinc-500 tabular-nums [html[data-theme='light']_&]:text-zinc-500">
                  <span>0초</span>
                  <span>
                    {durationSec != null && durationSec > 0
                      ? `총 ${durationSec}초`
                      : "길이 로딩…"}
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-4 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between [html[data-theme='light']_&]:border-zinc-100">
                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                      등록에 반영되는 시점
                    </p>
                    <p className="font-mono text-lg font-semibold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                      {thumbCommittedSec.toFixed(2)}
                      <span className="ml-1 text-[14px] font-medium text-zinc-400">
                        초
                      </span>
                    </p>
                    {previewUrl &&
                    durationSec != null &&
                    durationSec > 0 &&
                    Math.abs(thumbDraftSec - thumbCommittedSec) > 0.035 ? (
                      <p className="text-[12px] text-amber-200/95 [html[data-theme='light']_&]:text-amber-800">
                        미리본 시점이 아직 적용 전이에요.
                      </p>
                    ) : durationSec != null && durationSec > 0 ? (
                      <p className="text-[12px] text-emerald-300/95 [html[data-theme='light']_&]:text-emerald-800">
                        썸네일 저장 시 이 시점으로 잘려요.
                      </p>
                    ) : (
                      <p className="text-[12px] text-zinc-500">
                        재생 시간을 불러오는 중이에요.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onApplyThumbnailTime}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-reels-crimson/35 bg-reels-crimson/12 px-5 py-3 text-[13px] font-semibold text-zinc-50 transition-colors hover:bg-reels-crimson/22 disabled:pointer-events-none disabled:opacity-50 sm:w-auto sm:min-w-[10.5rem] [html[data-theme='light']_&]:text-zinc-900"
                    disabled={!(durationSec != null && durationSec > 0)}
                  >
                    <Check className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                    썸네일로 적용
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </fieldset>

        <div className="h-px bg-white/[0.08] [html[data-theme='light']_&]:bg-zinc-100" aria-hidden />

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor={`${hid}-title`}>
              제목 (필수)
            </label>
            <input
              id={`${hid}-title`}
              className={INPUT}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 비 오는 창가 브이로그 인트로"
              maxLength={120}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor={`${hid}-desc`}>
              설명
            </label>
            <textarea
              id={`${hid}-desc`}
              className={`${INPUT} min-h-[120px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 상황에 쓰기 좋은지, 분위기, 촬영 정보 등을 적어 주세요."
              maxLength={2000}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor={`${hid}-category`}>
              카테고리
            </label>
            <select
              id={`${hid}-category`}
              className={`${INPUT} cursor-pointer`}
              value={category}
              onChange={(e) => {
                const next = e.target.value;
                if (isSellVideoCategory(next)) setCategory(next);
              }}
              required
            >
              {SELL_VIDEO_CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL} htmlFor={`${hid}-price`}>
              판매 가격 (원, 최소 100)
            </label>
            <input
              id={`${hid}-price`}
              className={INPUT}
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
              required
            />
          </div>

          <div className="sm:col-span-2 space-y-4 rounded-xl border border-white/[0.1] bg-white/[0.02] p-4 sm:p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/90">
            <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
              권리 확인
            </p>
            <RightsAgreementCheckbox
              checked={rights}
              required
              onChange={setRights}
            >
              이 파일에 대한 재판매·배포 권한을 보유했거나, 권리자의 동의를 받았습니다.
            </RightsAgreementCheckbox>
            <RightsAgreementCheckbox
              checked={confirmOriginal}
              required
              onChange={setConfirmOriginal}
            >
              타인의 초상·음원·상표 등 제3자 권리를 침해하지 않습니다.
            </RightsAgreementCheckbox>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col-reverse gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between [html[data-theme='light']_&]:border-zinc-100">
        <p className="text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
          제출 시{" "}
          <span className="font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
            심사·노출 정책
          </span>
          에 동의한 것으로 간주됩니다.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-reels-crimson px-8 py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-market-bloomHover disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto sm:min-w-[10rem]"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-4 w-4" aria-hidden />
          )}
          등록하기
        </button>
      </div>
    </form>
  );
}
