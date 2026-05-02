"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Film,
  Image as ImageIcon,
  Loader2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
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
import { MYPAGE_OUTLINE_BTN_MD } from "@/lib/mypageOutlineCta";
import {
  deleteSellerUploadDraft,
  fetchSellerUploadDraft,
  upsertSellerUploadDraft,
  type SellerUploadDraftPayload,
} from "@/lib/supabaseSellerUploadDraft";
import { parseSocialVideoEmbed } from "@/lib/socialVideoEmbed";

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

/** 마이페이지 고스트 CTA와 동일 호버 — 비활성일 때 리프트·스케일 제거 */
const BTN_DISABLED_GHOST =
  "disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100";

/** 본문 액션: 탭 선택과 구분되는 얇은 아웃라인 (핑크 채우기·글로우 없음) */
const SOURCE_SECONDARY_BTN =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-[13px] font-medium text-zinc-100 shadow-none transition-colors hover:border-white/[0.32] hover:bg-white/[0.06] active:bg-white/[0.04] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:hover:bg-zinc-50";

const EMBED_IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

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

const CATEGORY_LISTBOX_PANEL =
  "absolute left-0 right-0 top-full z-[120] mt-1.5 max-h-[min(18rem,50vh)] overflow-y-auto overflow-x-hidden rounded-xl border border-white/[0.12] bg-[#0a0c12]/96 py-1.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.75)] backdrop-blur-xl [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-white/95 [html[data-theme='light']_&]:shadow-[0_16px_40px_-12px_rgba(56,78,125,0.22)]";

const CATEGORY_OPTION_ROW =
  "flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left text-[14px] font-medium text-zinc-200 transition-colors hover:bg-white/[0.07] focus:bg-white/[0.07] focus:outline-none [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:focus:bg-zinc-100";

const CATEGORY_OPTION_ROW_SELECTED =
  "bg-reels-crimson/[0.14] text-white hover:bg-reels-crimson/20 [html[data-theme='light']_&]:bg-reels-crimson/[0.12] [html[data-theme='light']_&]:text-zinc-900";

function SellCategorySelect({
  id,
  listboxId,
  value,
  onChange,
}: {
  id: string;
  listboxId: string;
  value: SellVideoCategory;
  onChange: (next: SellVideoCategory) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentLabel =
    SELL_VIDEO_CATEGORY_OPTIONS.find((o) => o.value === value)?.label ?? value;

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      const t = e.target;
      if (t instanceof Node && wrapRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointer, true);
    return () => document.removeEventListener("pointerdown", onDocPointer, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((o) => !o)}
        className={`${INPUT} flex min-h-[48px] w-full cursor-pointer items-center justify-between gap-3 text-left`}
      >
        <span className="min-w-0 truncate">{currentLabel}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 [html[data-theme='light']_&]:text-zinc-600 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className={CATEGORY_LISTBOX_PANEL}
          aria-label="판매 카테고리 선택"
        >
          {SELL_VIDEO_CATEGORY_OPTIONS.map((item) => {
            const selected = item.value === value;
            return (
              <li key={item.value} role="none" className="list-none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`${CATEGORY_OPTION_ROW} ${selected ? CATEGORY_OPTION_ROW_SELECTED : ""}`}
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                    queueMicrotask(() => triggerRef.current?.focus());
                  }}
                >
                  <span>{item.label}</span>
                  {selected ? (
                    <Check
                      className="h-4 w-4 shrink-0 text-reels-crimson [html[data-theme='light']_&]:text-reels-crimson"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  ) : (
                    <span className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
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
  /** true일 때 슬라이더·적용 UI 표시; 적용 후 접어서 미리보기만 */
  const [thumbPickerOpen, setThumbPickerOpen] = useState(true);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SellVideoCategory>("daily");
  const [price, setPrice] = useState("1000");
  const [isAi, setIsAi] = useState(false);
  const [rights, setRights] = useState(true);
  const [confirmOriginal, setConfirmOriginal] = useState(true);
  const [confirmPromotionAndLiability, setConfirmPromotionAndLiability] =
    useState(true);
  /** 접으면 조항 숨김 — 클릭 시 펼침 */
  const [rightsDisclosureOpen, setRightsDisclosureOpen] = useState(false);

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
    setPreviewUrl(null);
    setFile(null);
    setDurationSec(null);
    setThumbDraftSec(0);
    setThumbCommittedSec(0);
    setThumbPickerOpen(true);
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
      setConfirmPromotionAndLiability(
        typeof d.confirmPromotionAndLiability === "boolean"
          ? d.confirmPromotionAndLiability
          : true,
      );
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
      confirmPromotionAndLiability,
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
    confirmPromotionAndLiability,
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
    setThumbPickerOpen(false);
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
    if (
      !rights ||
      !confirmOriginal ||
      !confirmPromotionAndLiability
    ) {
      setMessage({
        ok: false,
        text: "권리 확인 항목에 모두 동의해 주세요.",
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
      thumbPickerOpen &&
      Math.abs(thumbDraftSec - thumbCommittedSec) > 0.035
    ) {
      setMessage({
        ok: false,
        text: '슬라이더를 맞춘 뒤「썸네일로 적용」으로 확정해 주세요.',
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
      fd.append(
        "confirmPromotionAndLiability",
        confirmPromotionAndLiability ? "true" : "false",
      );
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
                      className="sell-video-preview max-h-[min(52vh,480px)] w-full object-contain"
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
                  YouTube·인스타그램(릴·게시물)·TikTok 영상 페이지 전체 주소(예: …/video/숫자)는
                  여기서 미리보기됩니다. 공개 MP4 등 직접 스트림 주소도 넣을 수 있어요. TikTok
                  단축 링크(vm 등)는 브라우저에서 미리보기가 안 될 수 있어요.
                </p>
                {previewUrl ? (
                  <div className="mt-5 flex w-full flex-col items-center overflow-hidden rounded-xl border border-white/12 bg-zinc-950/80 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100">
                    {socialEmbedPreview ? (
                      <>
                        <div
                          className={
                            socialEmbedPreview.aspect === "9:16"
                              ? "relative mx-auto w-full max-w-[min(100%,340px)] aspect-[9/16] max-h-[min(52vh,520px)] overflow-hidden rounded-lg"
                              : "relative w-full aspect-video max-h-[min(52vh,480px)] overflow-hidden rounded-lg"
                          }
                        >
                          <iframe
                            src={socialEmbedPreview.iframeSrc}
                            title={
                              socialEmbedPreview.provider === "youtube"
                                ? "YouTube 미리보기"
                                : socialEmbedPreview.provider === "tiktok"
                                  ? "TikTok 미리보기"
                                  : "Instagram 미리보기"
                            }
                            loading="lazy"
                            allow={EMBED_IFRAME_ALLOW}
                            allowFullScreen
                            className="absolute inset-0 h-full w-full border-0"
                          />
                        </div>
                        <p className="mt-2 max-w-xl px-2 text-center text-[11px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                          플랫폼 제공 미리보기입니다. 등록 시 썸네일 시간 조절은 직접 주소(MP4 등)만
                          지원돼요.
                        </p>
                      </>
                    ) : (
                      <video
                        ref={videoPreviewRef}
                        className="sell-video-preview max-h-[min(52vh,480px)] w-full object-contain"
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
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {previewUrl && thumbPickerOpen && !socialEmbedPreview ? (
            <div className="border-t border-white/[0.08] p-4 sm:p-6 [html[data-theme='light']_&]:border-zinc-100">
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
                    슬라이더로 프레임을 맞춘 다음{" "}
                    <span className="font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
                      썸네일로 적용
                    </span>
                    을 누르면 등록 시 그 화면이 썸네일로 저장돼요.
                  </p>
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

                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={onApplyThumbnailTime}
                    className={`${MYPAGE_OUTLINE_BTN_MD} w-full max-w-sm cursor-pointer sm:w-auto ${BTN_DISABLED_GHOST}`}
                    disabled={!(durationSec != null && durationSec > 0)}
                  >
                    썸네일로 적용
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {previewUrl && !thumbPickerOpen && !socialEmbedPreview ? (
            <div className="border-t border-white/[0.08] px-4 py-4 sm:px-6 [html[data-theme='light']_&]:border-zinc-100">
              <button
                type="button"
                onClick={() => setThumbPickerOpen(true)}
                className={`${SOURCE_SECONDARY_BTN} w-full`}
              >
                썸네일 장면 바꾸기
              </button>
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
            <SellCategorySelect
              id={`${hid}-category`}
              listboxId={`${hid}-category-listbox`}
              value={category}
              onChange={setCategory}
            />
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

          <div className="sm:col-span-2 rounded-xl border border-white/[0.1] bg-white/[0.02] px-4 py-1 sm:p-2 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/90">
            <button
              type="button"
              id={`${hid}-rights-toggle`}
              aria-expanded={rightsDisclosureOpen}
              aria-controls={`${hid}-rights-panel`}
              className="flex w-full flex-col items-center justify-center gap-1 py-4 text-center transition-[color,background-color] hover:bg-white/[0.03] rounded-lg [html[data-theme='light']_&]:hover:bg-zinc-100/70"
              onClick={() =>
                setRightsDisclosureOpen((open) => !open)
              }
            >
              <span
                id={`${hid}-rights-heading`}
                className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500"
              >
                권리 확인
                <ChevronDown
                  strokeWidth={2}
                  aria-hidden
                  className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 [html[data-theme='light']_&]:text-zinc-600 ${
                    rightsDisclosureOpen ? "rotate-180" : ""
                  }`}
                />
              </span>
              {!rightsDisclosureOpen ? (
                <span className="max-w-md text-[11px] font-normal leading-relaxed tracking-normal normal-case text-zinc-600 [html[data-theme='light']_&]:text-zinc-600">
                  필수 동의 항목이 적용되어 있어요. 문구를 보려면 눌러 펼치세요.
                </span>
              ) : null}
            </button>

            {rightsDisclosureOpen ? (
              <div
                id={`${hid}-rights-panel`}
                role="region"
                aria-labelledby={`${hid}-rights-heading`}
                className="space-y-4 border-t border-white/[0.08] px-0 pb-4 pt-5 [html[data-theme='light']_&]:border-zinc-200/80 sm:px-1"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3">
                  <p className="text-[11px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                    개별 선택
                  </p>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRights(true);
                        setConfirmOriginal(true);
                        setConfirmPromotionAndLiability(true);
                      }}
                      disabled={
                        rights &&
                        confirmOriginal &&
                        confirmPromotionAndLiability
                      }
                      className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-[border-color,background-color] hover:border-white/40 hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-zinc-400"
                    >
                      전체 선택
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRights(false);
                        setConfirmOriginal(false);
                        setConfirmPromotionAndLiability(false);
                      }}
                      disabled={
                        !rights &&
                        !confirmOriginal &&
                        !confirmPromotionAndLiability
                      }
                      className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-colors hover:border-white/25 disabled:pointer-events-none disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700"
                    >
                      선택 해제
                    </button>
                  </div>
                </div>
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
                <RightsAgreementCheckbox
                  checked={confirmPromotionAndLiability}
                  required
                  onChange={setConfirmPromotionAndLiability}
                >
                  서비스 홍보를 위한 콘텐츠 활용에 동의하며, 저작권 등 제3자 권리 침해
                  시 모든 법적 책임은 본인에게 있음을 확인합니다.
                </RightsAgreementCheckbox>
              </div>
            ) : null}
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
          className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 ${MYPAGE_OUTLINE_BTN_MD} sm:w-auto sm:min-w-[10rem] ${BTN_DISABLED_GHOST}`}
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
