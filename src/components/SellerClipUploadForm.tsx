"use client";

import { AlertCircle, CheckCircle2, Film, Loader2, Upload } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const INPUT =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[14px] text-zinc-100 outline-none transition focus:border-reels-cyan/45 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-[#24163b]";

const LABEL = "mb-1.5 block text-[12px] font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600";

export function SellerClipUploadForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const hid = useId();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [price, setPrice] = useState("1000");
  const [isAi, setIsAi] = useState(false);
  const [editionKind, setEditionKind] = useState<"open" | "limited">("open");
  const [editionCap, setEditionCap] = useState("50");
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
  }, [previewUrl]);

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
    }
    setOrientation(el.videoWidth >= el.videoHeight ? "landscape" : "portrait");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!file) {
      setMessage({ ok: false, text: "동영상 파일을 선택해 주세요." });
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
    if (!supabase) {
      setMessage({
        ok: false,
        text: "Supabase 설정이 없어 업로드할 수 없습니다.",
      });
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session?.access_token) {
      setMessage({ ok: false, text: "로그인 세션이 만료되었습니다. 다시 로그인해 주세요." });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("video", file);
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("hashtags", hashtags.trim());
      fd.append("price", price.trim());
      fd.append("orientation", orientation);
      fd.append("isAiGenerated", isAi ? "true" : "false");
      fd.append("editionKind", editionKind);
      if (editionKind === "limited") {
        fd.append("editionCap", editionCap.trim());
      }
      fd.append("rightsConfirmed", rights ? "true" : "false");
      fd.append("confirmOriginal", confirmOriginal ? "true" : "false");
      if (durationSec != null) {
        fd.append("durationSec", String(durationSec));
      }

      const res = await fetch("/api/sell/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
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

      setMessage({
        ok: true,
        text: data.message ?? "등록이 완료되었습니다.",
      });
      setTitle("");
      setDescription("");
      setHashtags("");
      setPrice("1000");
      setIsAi(false);
      setEditionKind("open");
      setEditionCap("50");
      setRights(false);
      setConfirmOriginal(false);
      resetPreview();
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          조각 등록 · 메타데이터
        </h2>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        파일은 서버에 저장되며 DB에 목록이 생성됩니다. 썸네일은 심사·노출 단계에서
        교체될 수 있어요.
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
          <label className={LABEL} htmlFor={`${hid}-video`}>
            동영상 파일 (필수)
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <input
              id={`${hid}-video`}
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
              className="block w-full text-[13px] text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-reels-crimson/90 file:px-3 file:py-2 file:text-[13px] file:font-bold file:text-white [html[data-theme='light']_&]:text-zinc-800"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            {previewUrl ? (
              <div className="w-full max-w-[200px] shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/50">
                <video
                  ref={videoPreviewRef}
                  className="aspect-[9/16] w-full object-cover sm:aspect-video"
                  src={previewUrl}
                  muted
                  playsInline
                  controls
                  onLoadedMetadata={onVideoMeta}
                />
              </div>
            ) : null}
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
            MP4·MOV·WebM 권장. 미리보기에서 재생 길이·가로/세로를 자동 추정합니다.
          </p>
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

          <div className="sm:col-span-2">
            <span className={LABEL}>판매 방식</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditionKind("open")}
                className={`rounded-xl border px-3 py-2 text-[13px] font-bold transition ${
                  editionKind === "open"
                    ? "border-reels-cyan/50 bg-reels-cyan/15 text-zinc-100"
                    : "border-white/12 bg-black/20 text-zinc-400 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
                }`}
              >
                무제한(오픈)
              </button>
              <button
                type="button"
                onClick={() => setEditionKind("limited")}
                className={`rounded-xl border px-3 py-2 text-[13px] font-bold transition ${
                  editionKind === "limited"
                    ? "border-reels-cyan/50 bg-reels-cyan/15 text-zinc-100"
                    : "border-white/12 bg-black/20 text-zinc-400 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
                }`}
              >
                한정 판매(수량 제한)
              </button>
            </div>
            {editionKind === "limited" ? (
              <div className="mt-3">
                <label className={LABEL} htmlFor={`${hid}-cap`}>
                  판매 가능 수량
                </label>
                <input
                  id={`${hid}-cap`}
                  className={INPUT}
                  inputMode="numeric"
                  value={editionCap}
                  onChange={(e) =>
                    setEditionCap(e.target.value.replace(/[^\d]/g, ""))
                  }
                />
              </div>
            ) : null}
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
