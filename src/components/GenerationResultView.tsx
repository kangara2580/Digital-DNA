"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { GlobalLoading } from "@/components/GlobalLoading";
import { useStudioHistory } from "@/context/StudioHistoryContext";
import { useTranslation } from "@/hooks/useTranslation";
import { localizeApiError } from "@/lib/i18n/localizeApiError";
import type { SiteLocale } from "@/lib/sitePreferences";

type JobPayload = {
  id: string;
  status: string;
  progress: number;
  videoId: string;
  outputVideoUrl?: string;
  error?: string;
  normalizedBackgroundPrompt?: string;
};

export function GenerationResultView({ jobId }: { jobId: string }) {
  const { t, locale } = useTranslation();
  const { append: appendStudioHistory } = useStudioHistory();
  const [job, setJob] = useState<JobPayload | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const studioHistoryAppendedRef = useRef<string | null>(null);

  const statusLabel = useCallback(
    (status: string): string => {
      switch (status) {
        case "queued":
          return t("generation.status.queued");
        case "running":
          return t("generation.status.running");
        case "succeeded":
          return t("generation.status.succeeded");
        case "failed":
          return t("generation.status.failed");
        default:
          return status;
      }
    },
    [t],
  );

  const fetchJob = useCallback(async () => {
    const res = await fetch(
      `/api/reels/generate?jobId=${encodeURIComponent(jobId)}`,
    );
    const data = (await res.json()) as { job?: JobPayload; error?: string };
    if (!res.ok) {
      if (data.error === "job_not_found") {
        throw new Error(t("generation.err.jobNotFound"));
      }
      throw new Error(t("generation.err.loadFail"));
    }
    if (!data.job) throw new Error(t("generation.err.badResponse"));
    return data.job;
  }, [jobId, t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await fetchJob();
        if (cancelled) return;
        setJob(j);
        setPhase("ready");
      } catch (e) {
        if (cancelled) return;
        setPhase("error");
        setErrorMessage(
          e instanceof Error
            ? localizeApiError(locale as SiteLocale, e.message)
            : t("generation.err.generic"),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchJob, locale, t]);

  useEffect(() => {
    if (!job || job.status !== "succeeded" || !job.outputVideoUrl) return;
    if (studioHistoryAppendedRef.current === job.id) return;
    studioHistoryAppendedRef.current = job.id;
    appendStudioHistory({
      jobId: job.id,
      videoId: job.videoId,
      outputVideoUrl: job.outputVideoUrl,
      normalizedBackgroundPrompt: job.normalizedBackgroundPrompt,
    });
  }, [job, appendStudioHistory]);

  const pollStatus = job?.status;
  useEffect(() => {
    if (
      !pollStatus ||
      (pollStatus !== "queued" && pollStatus !== "running")
    ) {
      return;
    }
    const id = window.setInterval(async () => {
      try {
        const j = await fetchJob();
        setJob(j);
      } catch {
        /* keep last known */
      }
    }, 1400);
    return () => window.clearInterval(id);
  }, [fetchJob, pollStatus]);

  const busy = job && (job.status === "queued" || job.status === "running");
  const pct = Math.max(0, Math.min(100, Number(job?.progress) || 0));

  return (
    <div className="mx-auto max-w-[900px]">
      <header className="mb-8 text-center sm:mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-reels-cyan/90">
          {t("generation.badge")}
        </p>
        <h1 className="mt-2 text-[22px] font-extrabold tracking-tight text-zinc-100 sm:text-[26px] [html[data-theme='light']_&]:text-zinc-900">
          {t("generation.title")}
        </h1>
      </header>

      {phase === "loading" ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 py-20 text-zinc-400">
          <GlobalLoading size="lg" label={t("generation.loading")} />
        </div>
      ) : null}

      {phase === "error" ? (
        <div
          className="rounded-2xl border border-reels-crimson/35 bg-reels-crimson/10 px-5 py-8 text-center text-[14px] text-zinc-200"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      {phase === "ready" && job ? (
        <div className="space-y-6">
          {busy ? (
            <div className="rounded-2xl border border-reels-cyan/25 bg-gradient-to-br from-black/50 to-black/25 px-5 py-6 text-center">
              <p className="text-[13px] font-semibold text-zinc-200">
                {statusLabel(job.status)} — {pct}%
              </p>
              <p className="mt-2 text-[12px] text-zinc-500">
                {t("generation.progressHint")}
              </p>
              <div className="mx-auto mt-4 h-2 max-w-md overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-reels-cyan/85 to-reels-crimson/70 transition-[width] duration-700"
                  style={{ width: `${Math.max(8, pct)}%` }}
                />
              </div>
            </div>
          ) : null}

          {job.status === "failed" ? (
            <p className="rounded-2xl border border-reels-crimson/35 bg-reels-crimson/10 px-5 py-6 text-center text-[14px] text-zinc-200">
              {localizeApiError(locale as SiteLocale, job.error) ||
                t("generation.err.failed")}
            </p>
          ) : null}

          {job.status === "succeeded" && job.outputVideoUrl ? (
            <div className="overflow-hidden rounded-2xl border border-white/12 bg-black/40 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.75)] ring-1 ring-white/5">
              <div className="aspect-video w-full max-h-[min(72vh,920px)] bg-black">
                <video
                  key={job.outputVideoUrl}
                  className="h-full w-full object-contain"
                  controls
                  playsInline
                  preload="metadata"
                  src={job.outputVideoUrl}
                />
              </div>
              {job.normalizedBackgroundPrompt ? (
                <p className="border-t border-white/10 px-4 py-3 text-[12px] text-zinc-500">
                  {t("generation.bgPromptLabel")}{" "}
                  <span className="text-zinc-400">{job.normalizedBackgroundPrompt}</span>
                </p>
              ) : null}
            </div>
          ) : null}

          {job.status === "succeeded" && !job.outputVideoUrl ? (
            <p className="text-center text-[13px] text-zinc-500">
              {t("generation.err.noOutputUrl")}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={`/video/${job.videoId}/customize`}
              className="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-[13px] font-bold text-zinc-200 transition hover:border-reels-cyan/35 hover:text-white"
            >
              {t("generation.cta.customize")}
            </Link>
            <Link
              href="/mypage?tab=drafts"
              className="inline-flex rounded-full border border-reels-cyan/35 bg-reels-cyan/12 px-5 py-2.5 text-[13px] font-bold text-reels-cyan hover:bg-reels-cyan/20"
            >
              {t("generation.cta.drafts")}
            </Link>
            <Link
              href="/explore"
              className="inline-flex rounded-full px-4 py-2.5 text-[13px] font-semibold text-zinc-500 hover:text-zinc-300"
            >
              {t("generation.cta.explore")}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
