"use client";

import type { FeedVideo } from "@/data/videos";
import {
  captureFrameFromVideo,
  captureFrameFromVideoSrc,
} from "@/lib/captureVideoFrame";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { X } from "lucide-react";
import { AraDualSpinLogo } from "@/components/AraDualSpinLogo";
import { GemAmount } from "@/components/PaymentDiamondIcon";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { SellCategorySelect } from "@/components/SellCategorySelect";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  coerceSellCategoryForUserForm,
  type SellVideoUserSelectableCategory,
} from "@/lib/sellVideoCategory";
import { SELL_CUSTOM_POSTER_MAX_BYTES } from "@/lib/sellCustomPosterMaxBytes";

const INPUT =
  "w-full rounded-xl border border-white/[0.14] bg-[#0c0c0e] px-3.5 py-2.5 text-[14px] text-zinc-100 outline-none transition focus:border-[color:var(--reels-point)]/45 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900";

const LABEL =
  "mb-1.5 block text-[16px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900";

const ALLOWED_CUSTOM_POSTER_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const THUMB_OUTLINE_BTN =
  "inline-flex w-full max-w-[16rem] items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-[13px] font-extrabold leading-snug text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-zinc-100 sm:w-auto";

type Props = {
  video: FeedVideo;
  open: boolean;
  onClose: () => void;
  onSaved: (v: FeedVideo) => void;
};

export function MyListingEditDialog({ video, open, onClose, onSaved }: Props) {
  const router = useRouter();
  const hid = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterFileInputRef = useRef<HTMLInputElement>(null);
  const scrubbingRef = useRef(false);
  const thumbTimeSecRef = useRef(0);

  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description ?? "");
  const [category, setCategory] = useState<SellVideoUserSelectableCategory>(
    coerceSellCategoryForUserForm(video.category),
  );
  const [price, setPrice] = useState(String(video.priceWon ?? ""));
  const [thumbTimeSec, setThumbTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState<number | null>(
    video.durationSec ?? null,
  );
  const [newPosterBlob, setNewPosterBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTitle(video.title);
    setDescription(video.description ?? "");
    setCategory(coerceSellCategoryForUserForm(video.category));
    setPrice(String(video.priceWon ?? ""));
    setThumbTimeSec(0);
    thumbTimeSecRef.current = 0;
    setDurationSec(video.durationSec ?? null);
    setNewPosterBlob(null);
    setCapturedPreviewUrl(null);
    setError(null);
    setVideoError(null);
    setVideoReady(false);
    if (posterFileInputRef.current) posterFileInputRef.current.value = "";
  }, [open, video]);

  useEffect(() => {
    if (!newPosterBlob) {
      setCapturedPreviewUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(newPosterBlob);
    setCapturedPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [newPosterBlob]);

  useEffect(() => {
    thumbTimeSecRef.current = thumbTimeSec;
  }, [thumbTimeSec]);

  useEffect(() => {
    if (!open) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [open]);

  useEffect(() => {
    const endScrub = () => {
      scrubbingRef.current = false;
    };
    window.addEventListener("pointerup", endScrub);
    window.addEventListener("pointercancel", endScrub);
    return () => {
      window.removeEventListener("pointerup", endScrub);
      window.removeEventListener("pointercancel", endScrub);
    };
  }, []);

  const seekVideo = useCallback((t: number) => {
    const el = videoRef.current;
    if (!el) return;
    const d = el.duration;
    const cap = Number.isFinite(d) && d > 0 ? d - 0.04 : undefined;
    const tt =
      cap !== undefined ? Math.min(Math.max(0, t), cap) : Math.max(0, t);
    if (Number.isFinite(tt)) el.currentTime = tt;
  }, []);

  const applyLoadedDuration = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const d = el.duration;
    if (Number.isFinite(d) && d > 0 && d !== Infinity) {
      setDurationSec(Math.round(d));
      setVideoReady(true);
      setVideoError(null);
      const cap = d - 0.04;
      const t = Math.min(Math.max(0, thumbTimeSecRef.current), cap);
      el.currentTime = t;
    }
  }, []);

  const onVideoMeta = () => {
    applyLoadedDuration();
  };

  const onVideoError = () => {
    setVideoReady(false);
    setVideoError(
      "영상을 불러오지 못했습니다. 네트워크나 주소를 확인해 주세요.",
    );
  };

  const toggleVideoPlayback = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play().catch(() => {
        /* ignore autoplay/user gesture errors */
      });
      return;
    }
    el.pause();
  }, []);

  const onSave = async () => {
    setError(null);
    const normalizedPrice = Number.parseInt(price.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(normalizedPrice) || normalizedPrice < 100) {
      setError("금액은 100원 이상으로 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = (await supabase?.auth.getSession()) ?? {
        data: { session: null },
      };
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("세션이 없습니다. 다시 로그인해 주세요.");
        setSaving(false);
        return;
      }

      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("category", category);
      fd.append("price", String(normalizedPrice));
      if (newPosterBlob) {
        if (newPosterBlob instanceof File) {
          const ext =
            newPosterBlob.type === "image/png"
              ? "png"
              : newPosterBlob.type === "image/webp"
                ? "webp"
                : "jpg";
          const name = newPosterBlob.name?.trim();
          fd.append(
            "poster",
            newPosterBlob,
            name && name.length > 0 ? name : `poster.${ext}`,
          );
        } else {
          fd.append(
            "poster",
            new File([newPosterBlob], "poster.jpg", { type: "image/jpeg" }),
          );
        }
      }
      fd.append(
        "thumb_time_sec",
        String(Number.isFinite(thumbTimeSecRef.current) ? thumbTimeSecRef.current : 0),
      );

      const res = await fetch(`/api/sell/video/${encodeURIComponent(video.id)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      let data: {
        ok?: boolean;
        video?: FeedVideo;
        error?: string;
      };
      try {
        data = (await res.json()) as typeof data;
      } catch {
        setError("저장 응답을 해석하지 못했습니다.");
        return;
      }

      if (!res.ok || !data.ok || !data.video) {
        setError(
          data.error === "not_found"
            ? "해당 영상을 찾을 수 없습니다."
            : typeof data.error === "string" && data.error.length > 0
              ? data.error
              : "저장하지 못했습니다.",
        );
        return;
      }
      onSaved(data.video);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !portalReady) return null;

  const durationForSlider =
    durationSec != null && durationSec > 0 ? durationSec : 1;
  const sliderDisabled =
    !videoReady || durationSec == null || durationSec <= 0;
  const previewFrameClass =
    video.orientation === "portrait"
      ? "relative aspect-[9/16] w-[min(280px,100%)] max-w-[300px] shrink-0 overflow-hidden"
      : "relative aspect-video w-full max-w-[min(400px,100%)] min-h-[200px] shrink-0 overflow-hidden";

  const modal = (
    <div
      className="fixed inset-0 z-[10050] isolate flex items-center justify-center bg-black/75 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${hid}-edit-title`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex h-[min(92dvh,calc(100dvh-1.5rem))] w-full max-w-4xl min-h-0 flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#06070d] shadow-2xl [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 [html[data-theme='light']_&]:border-zinc-200">
          <h2
            id={`${hid}-edit-title`}
            className="min-w-0 pr-2 text-[18px] font-extrabold leading-snug text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
          >
            등록 정보 수정
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 [html[data-theme='light']_&]:hover:bg-zinc-100"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-scroll overflow-x-hidden overscroll-contain px-4 py-4 touch-pan-y [scrollbar-gutter:stable]"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
            <div className="lg:sticky lg:top-0">
              <div
                className={`overflow-hidden rounded-xl border border-white/12 bg-black/40 [html[data-theme='light']_&]:border-zinc-200 ${
                  video.orientation === "portrait"
                    ? "mx-auto w-full max-w-[360px]"
                    : "w-full"
                }`}
              >
                <video
                  key={`${video.id}:${video.src}`}
                  ref={videoRef}
                  className={`w-full object-contain ${
                    video.orientation === "portrait"
                      ? "aspect-[9/16] max-h-[min(62vh,580px)]"
                      : "aspect-video max-h-[min(44vh,320px)]"
                  }`}
                  src={video.src}
                  preload="metadata"
                  muted
                  playsInline
                  controls
                  controlsList="nodownload noplaybackrate noremoteplayback"
                  disablePictureInPicture
                  onClick={toggleVideoPlayback}
                  onLoadedMetadata={onVideoMeta}
                  onLoadedData={applyLoadedDuration}
                  onTimeUpdate={() => {
                    const el = videoRef.current;
                    if (!el || scrubbingRef.current) return;
                    setThumbTimeSec(el.currentTime);
                  }}
                  onError={onVideoError}
                />
              </div>
              {videoError ? (
                <p className="mt-2 text-[12px] text-amber-200/95 [html[data-theme='light']_&]:text-amber-900">
                  {videoError}
                </p>
              ) : null}
            </div>

            <div>
              <div>
                <span className="mb-1.5 block text-[16px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                  썸네일
                </span>
                <p className="mb-1 break-words text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                  슬라이더로 영상 화면을 선택하세요.
                </p>
                <input
                  type="range"
                  min={0}
                  max={durationForSlider}
                  step={0.05}
                  value={
                    durationSec != null && durationSec > 0
                      ? Math.min(thumbTimeSec, durationSec)
                      : thumbTimeSec
                  }
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setNewPosterBlob(null);
                    setThumbTimeSec(v);
                    seekVideo(v);
                  }}
                  onPointerDown={() => {
                    scrubbingRef.current = true;
                  }}
                  onPointerUp={() => {
                    scrubbingRef.current = false;
                  }}
                  onPointerCancel={() => {
                    scrubbingRef.current = false;
                  }}
                  disabled={sliderDisabled}
                  className="thumb-pink-slider w-full min-w-0 cursor-pointer disabled:opacity-40"
                  aria-label="썸네일 시점"
                />
                <div className="mt-1 flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
                  <span>0초</span>
                  <span className="font-mono">{thumbTimeSec.toFixed(2)}초</span>
                  <span>
                    {durationSec != null && durationSec > 0 ? `총 ${durationSec}초` : "…"}
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex min-w-0 flex-col gap-2">
                    <button
                      type="button"
                      disabled={!videoReady}
                      onClick={async () => {
                        const el = videoRef.current;
                        if (!el) return;
                        let blob = await captureFrameFromVideo(
                          el,
                          thumbTimeSec,
                          "image/jpeg",
                          0.92,
                        );
                        if (!blob && video.src) {
                          blob = await captureFrameFromVideoSrc(
                            video.src,
                            thumbTimeSec,
                            "image/jpeg",
                            0.92,
                          );
                        }
                        if (blob) {
                          setNewPosterBlob(blob);
                          setError(null);
                        } else {
                          setError("이 시점의 화면을 캡처하지 못했습니다. 다른 시점을 시도해 주세요.");
                        }
                      }}
                      className={THUMB_OUTLINE_BTN}
                    >
                      썸네일 적용
                    </button>
                    <input
                      id={`${hid}-poster-file`}
                      ref={posterFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        e.target.value = "";
                        if (!f) return;
                        if (!ALLOWED_CUSTOM_POSTER_MIME.has(f.type)) {
                          setError("썸네일은 JPEG, PNG, WebP만 올릴 수 있어요.");
                          return;
                        }
                        if (f.size > SELL_CUSTOM_POSTER_MAX_BYTES) {
                          setError("썸네일은 2MB 이하로 올려 주세요.");
                          return;
                        }
                        setNewPosterBlob(f);
                        setError(null);
                      }}
                    />
                    <button
                      type="button"
                      className={THUMB_OUTLINE_BTN}
                      onClick={() => posterFileInputRef.current?.click()}
                    >
                      썸네일 직접 업로드
                    </button>
                    <p className="text-[11px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                      JPEG, PNG, WebP · 최대 2MB
                    </p>
                    {newPosterBlob ? (
                      <button
                        type="button"
                        onClick={() => {
                          setNewPosterBlob(null);
                          setError(null);
                        }}
                        className="w-fit text-left text-[12px] font-semibold text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:text-zinc-900"
                      >
                        썸네일 선택 지우기
                      </button>
                    ) : null}
                  </div>
                  <div className="hidden shrink-0 lg:flex lg:min-w-[min(280px,34%)] lg:max-w-[min(320px,40%)] lg:flex-1 lg:items-center lg:justify-center">
                    <div
                      className={`${previewFrameClass} rounded-lg border border-white/15 bg-black [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-950`}
                    >
                      {capturedPreviewUrl ? (
                        <img
                          src={capturedPreviewUrl}
                          alt="선택한 썸네일 미리보기"
                          className="absolute inset-0 h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="h-full min-h-[1px] w-full bg-transparent" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className={LABEL} htmlFor={`${hid}-title`}>
                  제목
                </label>
                <input
                  id={`${hid}-title`}
                  className={INPUT}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              <div className="mt-6">
                <label className={LABEL} htmlFor={`${hid}-desc`}>
                  설명
                </label>
                <textarea
                  id={`${hid}-desc`}
                  className={`${INPUT} min-h-[72px] max-h-[40vh] resize-y`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={LABEL} htmlFor={`${hid}-category`}>
                    카테고리
                  </label>
                  <SellCategorySelect
                    id={`${hid}-category`}
                    listboxId={`${hid}-category-listbox`}
                    value={category}
                    onChange={setCategory}
                    triggerClassName="h-[48px] min-h-0 py-0 text-[14px]"
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor={`${hid}-price`}>
                    금액 (원)
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
                    inputMode="numeric"
                    className={`${INPUT} h-[48px]`}
                    value={price}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/[^\d]/g, "");
                      setPrice(digitsOnly);
                    }}
                    placeholder="100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/10 bg-[#06070d] px-4 py-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white sm:flex-row sm:justify-end sm:gap-3">
          {error ? (
            <p className="text-[14px] font-bold leading-snug text-[color:var(--reels-point)] sm:mr-2 sm:self-center">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="relative z-[1] rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-[13px] font-extrabold leading-snug text-white transition hover:bg-white/10 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-zinc-100"
          >
            취소
          </button>
          <button
            type="button"
            disabled={saving || !title.trim() || !price.trim()}
            onClick={() => void onSave()}
            className="relative z-[1] inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-[13px] font-extrabold leading-snug text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-zinc-100"
          >
            {saving ? (
              <AraDualSpinLogo size={16} className="shrink-0" />
            ) : null}
            저장
          </button>
        </div>
      </div>
      <style jsx global>{`
        .thumb-pink-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          touch-action: pan-y;
        }
        .thumb-pink-slider::-webkit-slider-runnable-track {
          height: 8px;
          border-radius: 9999px;
          background:
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.24) 0%,
              rgba(255, 255, 255, 0.4) 50%,
              rgba(255, 255, 255, 0.24) 100%
            );
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.14),
            inset 0 1px 3px rgba(0, 0, 0, 0.28);
          cursor: pointer;
        }
        .thumb-pink-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          margin-top: -6px;
          height: 20px;
          width: 20px;
          border-radius: 9999px;
          border: 2px solid rgba(255, 255, 255, 0.28);
          background: var(--reels-point);
          box-shadow:
            0 4px 14px rgba(255, 42, 146, 0.38),
            0 1px 2px rgba(0, 0, 0, 0.32);
          cursor: grab;
          transition: transform 140ms ease, box-shadow 140ms ease;
        }
        .thumb-pink-slider:active::-webkit-slider-thumb {
          cursor: grabbing;
          transform: scale(1.08);
          box-shadow:
            0 7px 18px rgba(255, 42, 146, 0.48),
            0 1px 2px rgba(0, 0, 0, 0.35);
        }
        .thumb-pink-slider::-moz-range-track {
          height: 8px;
          border-radius: 9999px;
          background:
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.24) 0%,
              rgba(255, 255, 255, 0.4) 50%,
              rgba(255, 255, 255, 0.24) 100%
            );
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.14),
            inset 0 1px 3px rgba(0, 0, 0, 0.28);
          cursor: pointer;
        }
        .thumb-pink-slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 9999px;
          border: 2px solid rgba(255, 255, 255, 0.28);
          background: var(--reels-point);
          box-shadow:
            0 4px 14px rgba(255, 42, 146, 0.38),
            0 1px 2px rgba(0, 0, 0, 0.32);
          cursor: grab;
          transition: transform 140ms ease, box-shadow 140ms ease;
        }
        .thumb-pink-slider:active::-moz-range-thumb {
          transform: scale(1.08);
          box-shadow:
            0 7px 18px rgba(255, 42, 146, 0.48),
            0 1px 2px rgba(0, 0, 0, 0.35);
          cursor: grabbing;
        }
      `}</style>
    </div>
  );

  return createPortal(modal, document.body);
}
