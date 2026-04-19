"use client";

import type { FeedVideo } from "@/data/videos";
import {
  captureFrameFromVideo,
  captureFrameFromVideoSrc,
} from "@/lib/captureVideoFrame";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const INPUT =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[14px] text-zinc-100 outline-none transition focus:border-reels-cyan/45 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-[#24163b]";

const LABEL =
  "mb-1.5 block text-[12px] font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600";

function hashtagsForInput(raw: string | undefined): string {
  if (!raw?.trim()) return "";
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .join(" ");
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrubbingRef = useRef(false);
  const thumbTimeSecRef = useRef(0);

  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description ?? "");
  const [hashtags, setHashtags] = useState(hashtagsForInput(video.hashtags));
  const [thumbTimeSec, setThumbTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState<number | null>(
    video.durationSec ?? null,
  );
  const [posterFile, setPosterFile] = useState<File | null>(null);
  /** 서버에 새로 올릴 썸네일 — 없으면 기존 썸네일 유지 */
  const [newPosterBlob, setNewPosterBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTitle(video.title);
    setDescription(video.description ?? "");
    setHashtags(hashtagsForInput(video.hashtags));
    setThumbTimeSec(0);
    thumbTimeSecRef.current = 0;
    setDurationSec(video.durationSec ?? null);
    setPosterFile(null);
    setNewPosterBlob(null);
    setError(null);
    setVideoError(null);
    setVideoReady(false);
  }, [open, video]);

  useEffect(() => {
    thumbTimeSecRef.current = thumbTimeSec;
  }, [thumbTimeSec]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
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

  /** 파일·캡처 썸네일 미리보기 */
  useEffect(() => {
    if (posterFile) {
      const u = URL.createObjectURL(posterFile);
      setPreviewUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    if (newPosterBlob) {
      const u = URL.createObjectURL(newPosterBlob);
      setPreviewUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setPreviewUrl(null);
    return undefined;
  }, [posterFile, newPosterBlob]);

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

  const onSave = async () => {
    setError(null);
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
      fd.append("hashtags", hashtags.trim());

      if (posterFile) {
        fd.append("poster", posterFile);
      } else if (newPosterBlob) {
        fd.append(
          "poster",
          new File([newPosterBlob], "poster.jpg", { type: "image/jpeg" }),
        );
      }

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
    Boolean(posterFile) || !videoReady || durationSec == null || durationSec <= 0;

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
        className="flex h-[min(92dvh,calc(100dvh-1.5rem))] w-full max-w-lg min-h-0 flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#121018] shadow-2xl [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 [html[data-theme='light']_&]:border-zinc-200">
          <h2
            id={`${hid}-edit-title`}
            className="min-w-0 pr-2 text-[16px] font-extrabold leading-snug text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
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

        <div className="min-h-0 flex-1 overflow-y-scroll overflow-x-hidden overscroll-contain px-4 py-3 touch-pan-y [scrollbar-gutter:stable]">
          {error ? (
            <p className="mb-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-200 [html[data-theme='light']_&]:text-rose-900">
              {error}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-white/12 bg-black/40 [html[data-theme='light']_&]:border-zinc-200">
            <video
              key={`${video.id}:${video.src}`}
              ref={videoRef}
              className="aspect-video max-h-[min(40vh,220px)] w-full object-contain sm:max-h-[200px]"
              src={video.src}
              preload="metadata"
              muted
              playsInline
              controls
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

          <div className="mt-4">
            <span className={LABEL}>썸네일</span>
            <p className="mb-1 break-words text-[11px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              슬라이더로 장면을 고른 뒤 &quot;이 장면을 썸네일로&quot;를 누르거나,
              아래에서 이미지를 직접 올리세요.
            </p>
            <p className="mb-2 break-words text-[11px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              저장할 때만 반영됩니다.
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
                setPosterFile(null);
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
              className="w-full min-w-0 accent-reels-cyan disabled:opacity-40"
              aria-label="썸네일 시점"
            />
            <div className="mt-1 flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
              <span>0초</span>
              <span className="font-mono">{thumbTimeSec.toFixed(2)}초</span>
              <span>
                {durationSec != null && durationSec > 0
                  ? `총 ${durationSec}초`
                  : "…"}
              </span>
            </div>
            <button
              type="button"
              disabled={Boolean(posterFile) || !videoReady}
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
                  setPosterFile(null);
                  setNewPosterBlob(blob);
                  setError(null);
                } else {
                  setError(
                    "이 시점의 화면을 캡처하지 못했습니다. 이미지를 직접 올리거나 다른 시점을 시도해 주세요.",
                  );
                }
              }}
              className="mt-3 w-full rounded-xl border border-reels-cyan/40 bg-reels-cyan/10 px-3 py-2.5 text-[12px] font-bold leading-snug text-reels-cyan hover:bg-reels-cyan/20 disabled:cursor-not-allowed disabled:opacity-40 [html[data-theme='light']_&]:text-reels-crimson"
            >
              이 장면을 썸네일로 적용
            </button>
            {(posterFile || newPosterBlob) && (
              <p className="mt-2 text-[11px] font-semibold leading-relaxed text-emerald-400/90 [html[data-theme='light']_&]:text-emerald-700">
                새 썸네일이 저장 시 반영됩니다.
              </p>
            )}
            <span className={`${LABEL} mt-3`}>썸네일 이미지 파일 (선택)</span>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                id={`${hid}-poster-file`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                tabIndex={-1}
                className="sr-only"
                aria-hidden
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setPosterFile(f);
                  if (f) setNewPosterBlob(null);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className="inline-flex shrink-0 cursor-pointer rounded-lg bg-reels-crimson/90 px-3 py-2 text-[12px] font-bold text-white shadow-sm transition hover:brightness-110"
                onClick={() => fileInputRef.current?.click()}
              >
                파일 선택
              </button>
              <span className="pointer-events-none min-w-0 flex-1 truncate text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                {posterFile?.name ?? "선택된 파일 없음"}
              </span>
              {previewUrl ? (
                <div className="flex shrink-0 items-center gap-2">
                  <img
                    src={previewUrl}
                    alt=""
                    className="h-[56px] w-[56px] shrink-0 rounded-lg border border-white/15 object-cover [html[data-theme='light']_&]:border-zinc-200"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4">
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

          <div className="mt-4">
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

          <div className="mt-4">
            <label className={LABEL} htmlFor={`${hid}-tags`}>
              해시태그
            </label>
            <input
              id={`${hid}-tags`}
              className={INPUT}
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#일상 #브이로그"
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/10 bg-[#121018] px-4 py-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="relative z-[1] rounded-xl border border-white/15 px-4 py-2.5 text-[13px] font-bold leading-snug text-zinc-300 hover:bg-white/5 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-800"
          >
            취소
          </button>
          <button
            type="button"
            disabled={saving || !title.trim()}
            onClick={() => void onSave()}
            className="relative z-[1] inline-flex items-center justify-center gap-2 rounded-xl bg-reels-crimson px-5 py-2.5 text-[13px] font-extrabold leading-snug text-white shadow-reels-crimson hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : null}
            저장
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
