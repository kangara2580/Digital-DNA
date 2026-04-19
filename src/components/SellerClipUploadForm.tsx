"use client";

import { AlertCircle, CheckCircle2, Film, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
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
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[14px] text-zinc-100 outline-none transition focus:border-reels-cyan/45 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-[#24163b]";

const LABEL = "mb-1.5 block text-[12px] font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600";

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
  /** 썸네일로 쓸 프레임 시점(초) — 기본 0(첫 화면) */
  const [thumbTimeSec, setThumbTimeSec] = useState(0);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
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
    setThumbTimeSec(0);
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
      setHashtags(d.hashtags);
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
      hashtags,
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
    hashtags,
    price,
    isAi,
    rights,
    confirmOriginal,
    durationSec,
    orientation,
    file,
  ]);

  /** 미리보기 비디오: 슬라이더(thumbTimeSec)와 동기 시 seek (훅은 항상 동일 순서로 유지) */
  useEffect(() => {
    const el = videoPreviewRef.current;
    if (!el || !previewUrl) return;
    const d = el.duration;
    const cap = Number.isFinite(d) && d > 0 ? d - 0.04 : undefined;
    const t = cap !== undefined ? Math.min(thumbTimeSec, cap) : thumbTimeSec;
    el.currentTime = Number.isFinite(t) ? t : 0;
  }, [thumbTimeSec, previewUrl]);

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
      setThumbTimeSec((prev) => (prev > d ? Math.max(0, d - 0.05) : prev));
    }
    setOrientation(el.videoWidth >= el.videoHeight ? "landscape" : "portrait");
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
      fd.append("hashtags", hashtags.trim());
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
            thumbTimeSec,
            "image/jpeg",
            0.92,
          );
        }
        if (!posterBlob) {
          posterBlob = await capturePosterFromFile(file, thumbTimeSec);
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
          thumbTimeSec,
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
      setHashtags("");
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
      className="reels-glass-card rounded-2xl p-5 sm:p-7"
      onSubmit={onSubmit}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Film className="h-5 w-5 text-reels-cyan" strokeWidth={2} aria-hidden />
        <h2 className="text-lg font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-xl">
          릴스 등록 · 메타데이터
        </h2>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        파일은 서버에 저장되며 DB에 목록이 생성됩니다. 미리보기에서 썸네일로 쓸
        장면(기본: 첫 화면)을 고를 수 있고, 심사·노출 단계에서 다시 조정될 수
        있어요.
      </p>

      {message ? (
        <div
          className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-semibold ${
            message.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 [html[data-theme='light']_&]:text-emerald-800"
              : "border-rose-500/45 bg-rose-500/10 text-rose-200 [html[data-theme='light']_&]:text-rose-800"
          }`}
          role="status"
        >
          {message.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          <span>{message.text}</span>
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        <div>
          <span className={LABEL}>영상 소스 선택</span>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSourceType("file")}
              className={`rounded-xl border px-3 py-2 text-[13px] font-bold transition ${
                sourceType === "file"
                  ? "border-reels-cyan/50 bg-reels-cyan/15 text-zinc-100"
                  : "border-white/12 bg-black/20 text-zinc-400 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50"
              }`}
            >
              직접 업로드
            </button>
            <button
              type="button"
              onClick={() => setSourceType("url")}
              className={`rounded-xl border px-3 py-2 text-[13px] font-bold transition ${
                sourceType === "url"
                  ? "border-reels-cyan/50 bg-reels-cyan/15 text-zinc-100"
                  : "border-white/12 bg-black/20 text-zinc-400 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50"
              }`}
            >
              동영상 URL 입력
            </button>
          </div>

          {sourceType === "file" ? (
            <>
              <span className={LABEL}>동영상 파일 (필수)</span>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,520px)] lg:items-start lg:gap-6">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
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
                    <button
                      type="button"
                      className="inline-flex shrink-0 cursor-pointer rounded-lg bg-reels-crimson/90 px-3 py-2 text-[13px] font-bold text-white shadow-sm transition hover:brightness-110"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      파일 선택
                    </button>
                    <span className="pointer-events-none min-w-0 flex-1 truncate text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                      {file?.name ?? "선택된 파일 없음"}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
                    MP4·MOV·WebM 권장. 미리보기에서 재생 길이·가로/세로를 자동 추정합니다.
                  </p>
                </div>
                {previewUrl ? (
                  <div className="flex w-full min-w-0 justify-center overflow-hidden rounded-xl border border-white/15 bg-zinc-950/90 shadow-inner [html[data-theme='light']_&]:bg-zinc-900">
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
            </>
          ) : (
            <>
              <label className={LABEL} htmlFor={`${hid}-video-url`}>
                동영상 URL (필수)
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id={`${hid}-video-url`}
                  className={`${INPUT} flex-1`}
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://... 또는 /videos/sample1.mp4"
                />
                <button
                  type="button"
                  onClick={onApplyVideoUrl}
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/[0.08] px-4 py-2.5 text-[13px] font-bold text-zinc-200 hover:border-reels-cyan/40 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-800"
                >
                  미리보기
                </button>
              </div>
              {previewUrl ? (
                <div className="mt-3 flex w-full justify-center overflow-hidden rounded-xl border border-white/15 bg-zinc-950/90 shadow-inner [html[data-theme='light']_&]:bg-zinc-900">
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
              <p className="mt-1.5 text-[11px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
                직접 업로드가 어렵다면 영상 URL로도 등록할 수 있습니다.
              </p>
            </>
          )}

          {previewUrl ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
              <span className={LABEL}>썸네일 장면</span>
              <p className="mb-3 text-[11px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                슬라이더로 장면을 맞추면 등록 시 그 화면이 썸네일로 저장됩니다.
                일부 외부 URL은 보안 정책으로 썸네일 추출이 안 될 수 있어요(그때는
                기본 이미지가 들어갑니다).
              </p>
              <input
                type="range"
                min={0}
                max={
                  durationSec != null && durationSec > 0
                    ? durationSec
                    : 1
                }
                step={0.05}
                value={
                  durationSec != null && durationSec > 0
                    ? Math.min(thumbTimeSec, durationSec)
                    : thumbTimeSec
                }
                onChange={(e) => setThumbTimeSec(parseFloat(e.target.value))}
                className="w-full accent-reels-cyan"
                aria-label="썸네일 시점(초)"
              />
              <div className="mt-1 flex justify-between text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                <span>0초</span>
                <span className="font-mono">{thumbTimeSec.toFixed(2)}초</span>
                <span>
                  {durationSec != null && durationSec > 0
                    ? `총 ${durationSec}초`
                    : "길이 로딩…"}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
              className={`${INPUT} min-h-[100px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 상황에 쓰기 좋은지, 분위기, 촬영 정보 등을 적어 주세요."
              maxLength={2000}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor={`${hid}-tags`}>
              해시태그
            </label>
            <input
              id={`${hid}-tags`}
              className={INPUT}
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#일상 #브이로그 #카페 또는 쉼표로 구분"
            />
            <p className="mt-1 text-[11px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
              저장 시 #태그 형태로 정리됩니다.
            </p>
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

          <div>
            <span className={LABEL}>영상 비율 (자동 추정)</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrientation("portrait")}
                className={`flex-1 rounded-xl border px-3 py-2 text-[13px] font-bold transition ${
                  orientation === "portrait"
                    ? "border-reels-cyan/50 bg-reels-cyan/15 text-zinc-100"
                    : "border-white/12 bg-black/20 text-zinc-400 hover:border-white/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50"
                }`}
              >
                세로 (릴스형)
              </button>
              <button
                type="button"
                onClick={() => setOrientation("landscape")}
                className={`flex-1 rounded-xl border px-3 py-2 text-[13px] font-bold transition ${
                  orientation === "landscape"
                    ? "border-reels-cyan/50 bg-reels-cyan/15 text-zinc-100"
                    : "border-white/12 bg-black/20 text-zinc-400 hover:border-white/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50"
                }`}
              >
                가로 (와이드)
              </button>
            </div>
          </div>

          <div className="sm:col-span-2 rounded-xl border border-white/10 bg-black/20 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-white/25 bg-black/40 text-reels-cyan focus:ring-reels-cyan/40"
                checked={isAi}
                onChange={(e) => setIsAi(e.target.checked)}
              />
              <span className="text-[13px] font-semibold leading-snug text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
                이 영상은 AI로 생성·합성된 콘텐츠입니다
                <span className="mt-1 block text-[11px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                  직접 촬영·편집한 실사면 체크하지 마세요. 마켓 필터(AI/Real)에
                  반영됩니다.
                </span>
              </span>
            </label>
          </div>

          <div className="sm:col-span-2 space-y-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-4 [html[data-theme='light']_&]:border-amber-400/35 [html[data-theme='light']_&]:bg-amber-50">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-amber-400/50 bg-black/30 text-amber-500"
                checked={rights}
                onChange={(e) => setRights(e.target.checked)}
                required
              />
              <span className="text-[13px] font-semibold leading-snug text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
                이 파일에 대한 재판매·배포 권한을 보유했거나, 권리자의 동의를
                받았습니다.
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-amber-400/50 bg-black/30 text-amber-500"
                checked={confirmOriginal}
                onChange={(e) => setConfirmOriginal(e.target.checked)}
                required
              />
              <span className="text-[13px] font-semibold leading-snug text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
                타인의 초상·음원·상표 등 제3자 권리를 침해하지 않습니다.
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
          제출 시{" "}
          <span className="font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
            심사·노출 정책
          </span>
          에 동의한 것으로 간주됩니다.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-reels-crimson px-7 py-3 text-[14px] font-extrabold text-white shadow-reels-crimson transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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
