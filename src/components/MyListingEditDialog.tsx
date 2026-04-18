"use client";

import type { FeedVideo } from "@/data/videos";
import { captureFrameFromVideo } from "@/lib/captureVideoFrame";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

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
  const hid = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
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

  useEffect(() => {
    if (!open) return;
    setTitle(video.title);
    setDescription(video.description ?? "");
    setHashtags(hashtagsForInput(video.hashtags));
    setThumbTimeSec(0);
    setDurationSec(video.durationSec ?? null);
    setPosterFile(null);
    setNewPosterBlob(null);
    setError(null);
  }, [open, video]);

  useEffect(() => {
    const el = videoRef.current;
    if (!open || !el) return;
    const d = el.duration;
    const cap = Number.isFinite(d) && d > 0 ? d - 0.04 : undefined;
    const t = cap !== undefined ? Math.min(thumbTimeSec, cap) : thumbTimeSec;
    el.currentTime = Number.isFinite(t) ? t : 0;
  }, [thumbTimeSec, open, video.src]);

  const onVideoMeta = () => {
    const el = videoRef.current;
    if (!el) return;
    const d = el.duration;
    if (Number.isFinite(d) && d > 0) {
      setDurationSec(Math.round(d));
      setThumbTimeSec((prev) => (prev > d ? Math.max(0, d - 0.05) : prev));
    }
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
        fd.append("poster", newPosterBlob, "poster.jpg");
      }

      const res = await fetch(`/api/sell/video/${encodeURIComponent(video.id)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = (await res.json()) as {
        ok?: boolean;
        video?: FeedVideo;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.video) {
        setError(
          data.error === "not_found"
            ? "해당 영상을 찾을 수 없습니다."
            : "저장하지 못했습니다.",
        );
        return;
      }
      onSaved(data.video);
      onClose();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${hid}-edit-title`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/12 bg-[#121018] shadow-2xl [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 [html[data-theme='light']_&]:border-zinc-200">
          <h2
            id={`${hid}-edit-title`}
            className="text-[16px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
          >
            등록 정보 수정
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 [html[data-theme='light']_&]:hover:bg-zinc-100"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {error ? (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-200 [html[data-theme='light']_&]:text-rose-900">
              {error}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-white/12 bg-black/40 [html[data-theme='light']_&]:border-zinc-200">
            <video
              ref={videoRef}
              className="aspect-[9/16] max-h-[220px] w-full object-cover sm:aspect-video sm:max-h-[180px]"
              src={video.src}
              crossOrigin="anonymous"
              muted
              playsInline
              controls
              onLoadedMetadata={onVideoMeta}
            />
          </div>

          <div>
            <span className={LABEL}>썸네일</span>
            <p className="mb-2 text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              슬라이더로 장면을 고른 뒤 &quot;이 장면을 썸네일로&quot;를 누르거나,
              아래에서 이미지를 직접 올리세요. 저장할 때만 반영됩니다.
            </p>
            <input
              type="range"
              min={0}
              max={durationSec != null && durationSec > 0 ? durationSec : 1}
              step={0.05}
              value={
                durationSec != null && durationSec > 0
                  ? Math.min(thumbTimeSec, durationSec)
                  : thumbTimeSec
              }
              onChange={(e) => {
                setPosterFile(null);
                setNewPosterBlob(null);
                setThumbTimeSec(parseFloat(e.target.value));
              }}
              disabled={Boolean(posterFile)}
              className="w-full accent-reels-cyan disabled:opacity-40"
              aria-label="썸네일 시점"
            />
            <div className="mt-1 flex justify-between text-[11px] text-zinc-500">
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
              disabled={Boolean(posterFile) || !videoRef.current}
              onClick={async () => {
                const el = videoRef.current;
                if (!el) return;
                const blob = await captureFrameFromVideo(
                  el,
                  thumbTimeSec,
                  "image/jpeg",
                  0.92,
                );
                if (blob) {
                  setPosterFile(null);
                  setNewPosterBlob(blob);
                }
              }}
              className="mt-3 w-full rounded-xl border border-reels-cyan/40 bg-reels-cyan/10 px-3 py-2 text-[12px] font-bold text-reels-cyan hover:bg-reels-cyan/20 disabled:cursor-not-allowed disabled:opacity-40 [html[data-theme='light']_&]:text-reels-crimson"
            >
              이 장면을 썸네일로 적용
            </button>
            {(posterFile || newPosterBlob) && (
              <p className="mt-2 text-[11px] font-semibold text-emerald-400/90 [html[data-theme='light']_&]:text-emerald-700">
                새 썸네일이 저장 시 반영됩니다.
              </p>
            )}
            <label className={`${LABEL} mt-3`} htmlFor={`${hid}-poster-file`}>
              썸네일 이미지 파일 (선택)
            </label>
            <input
              id={`${hid}-poster-file`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-[13px] text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-reels-crimson/90 file:px-3 file:py-2 file:text-[12px] file:font-bold file:text-white [html[data-theme='light']_&]:text-zinc-800"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setPosterFile(f);
                if (f) setNewPosterBlob(null);
              }}
            />
          </div>

          <div>
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

          <div>
            <label className={LABEL} htmlFor={`${hid}-desc`}>
              설명
            </label>
            <textarea
              id={`${hid}-desc`}
              className={`${INPUT} min-h-[88px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
            />
          </div>

          <div>
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

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-[13px] font-bold text-zinc-300 hover:bg-white/5 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-800"
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving || !title.trim()}
              onClick={() => void onSave()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-reels-crimson px-5 py-2.5 text-[13px] font-extrabold text-white shadow-reels-crimson hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
