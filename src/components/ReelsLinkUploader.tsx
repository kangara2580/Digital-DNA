"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { parseSocialReelsUrl } from "@/lib/socialReelsUrl";

export function ReelsLinkUploader() {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  /** 서버 전송 시 JSON 키 `is_ai_generated`로 매핑 */
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  const parsed = useMemo(() => parseSocialReelsUrl(url), [url]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = url.trim();
      if (!trimmed) {
        setSubmitMessage({
          kind: "err",
          text: t("upload.link.errEmpty"),
        });
        return;
      }

      setIsSubmitting(true);
      setSubmitMessage(null);
      try {
        const res = await fetch("/api/upload/reels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: trimmed,
            is_ai_generated: isAiGenerated,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          message?: string;
        };
        if (!res.ok) {
          setSubmitMessage({
            kind: "err",
            text: data.message ?? t("upload.link.errFail"),
          });
          return;
        }
        setSubmitMessage({
          kind: "ok",
          text: isAiGenerated ? t("upload.link.okAi") : t("upload.link.ok"),
        });
      } catch {
        setSubmitMessage({
          kind: "err",
          text: t("upload.link.errNetwork"),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [url, isAiGenerated, t],
  );

  return (
    <div className="reels-border-gradient rounded-2xl p-5 sm:p-7">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-reels-cyan">
        {t("upload.link.kicker")}
      </p>
      <h1 className="mt-1 text-xl font-extrabold tracking-tight text-zinc-100 sm:text-2xl">
        {t("upload.link.title")}
      </h1>
      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-500">
        {t("upload.link.lead")}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              id="ai-generated-label"
              className="text-[14px] font-medium leading-snug text-zinc-200"
            >
              {t("upload.link.aiQuestion")}
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={isAiGenerated}
              aria-labelledby="ai-generated-label"
              onClick={() => {
                setIsAiGenerated((v) => !v);
                setSubmitMessage(null);
              }}
              className={`relative inline-flex h-8 w-[52px] shrink-0 cursor-pointer rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-reels-cyan/50 ${
                isAiGenerated
                  ? "border-reels-cyan/50 bg-reels-cyan/25"
                  : "border-white/15 bg-zinc-800/90"
              }`}
            >
              <span className="sr-only">
                {isAiGenerated ? t("upload.link.aiSrOn") : t("upload.link.aiSrOff")}
              </span>
              <span
                aria-hidden
                className={`pointer-events-none absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  isAiGenerated ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          {isAiGenerated ? (
            <p className="mt-2.5 text-[12px] leading-relaxed text-reels-cyan/90">
              {t("upload.link.aiNote")}
            </p>
          ) : null}
        </div>

        <label htmlFor="reels-url" className="sr-only">
          {t("upload.link.urlSr")}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <input
            id="reels-url"
            type="url"
            name="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setSubmitMessage(null);
            }}
            placeholder={t("upload.link.placeholder")}
            className="min-w-0 flex-1 rounded-xl border border-white/12 bg-black/35 px-4 py-3 text-[14px] text-zinc-100 placeholder:text-zinc-600 focus:border-reels-cyan/45 focus:outline-none focus:ring-1 focus:ring-reels-cyan/35"
            autoComplete="url"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="shrink-0 rounded-xl bg-reels-crimson px-6 py-3 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t("upload.link.submitting") : t("upload.link.submit")}
          </button>
        </div>
        {submitMessage ? (
          <p
            role="status"
            className={
              submitMessage.kind === "ok"
                ? "text-[13px] font-medium text-emerald-400/95"
                : "text-[13px] font-medium text-amber-300/95"
            }
          >
            {submitMessage.text}
          </p>
        ) : null}
      </form>

      <div className="mt-8">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {t("upload.link.preview")}
        </p>
        {!parsed ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-black/25 px-4 py-12 text-center text-[13px] text-zinc-500">
            {t("upload.link.previewEmpty")}
          </div>
        ) : parsed.platform === "unknown" || parsed.platform === "twitter" ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-6 text-[13px] leading-relaxed text-zinc-300">
            <p className="font-semibold text-amber-200/95">
              {parsed.platform === "twitter"
                ? t("upload.link.unsupportedTwitter")
                : t("upload.link.unsupportedUnknown")}
            </p>
            <p className="mt-2 text-zinc-400">{t("upload.link.unsupportedHint")}</p>
            <a
              href={parsed.href.startsWith("http") ? parsed.href : `https://${parsed.href}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-reels-cyan hover:underline"
            >
              {t("upload.link.openNewTab")}
            </a>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
            <div
              className={
                parsed.platform === "youtube"
                  ? "aspect-video w-full max-w-[min(100%,560px)]"
                  : "aspect-[9/16] w-full max-w-[min(100%,320px)] sm:aspect-[10/16]"
              }
            >
              <iframe
                title={t("upload.link.iframeTitle")}
                src={parsed.embedUrl}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="border-t border-white/10 px-3 py-2 font-mono text-[10px] text-zinc-500">
              {parsed.platform === "tiktok"
                ? t("upload.link.footerTiktok", { id: String(parsed.videoId ?? "") })
                : parsed.platform === "youtube"
                  ? t("upload.link.footerYoutube", { id: String(parsed.videoId ?? "") })
                  : t("upload.link.footerInstagram", { code: String(parsed.shortcode ?? "") })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
