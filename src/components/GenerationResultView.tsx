"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { syncStudioHistoryToSupabase } from "@/lib/supabaseUserSync";
import { appendMyStudioHistory } from "@/lib/myStudioHistoryStorage";

type JobPayload = {
  id: string;
  status: string;
  progress: number;
  videoId: string;
  outputVideoUrl?: string;
  error?: string;
  normalizedBackgroundPrompt?: string;
};

function statusLabel(status: string): string {
  switch (status) {
    case "queued":
      return "대기 중";
    case "running":
      return "생성 중";
    case "succeeded":
      return "완료";
    case "failed":
      return "실패";
    default:
      return status;
  }
}

export function GenerationResultView({ jobId }: { jobId: string }) {
  const { user } = useAuthSession();
  const [job, setJob] = useState<JobPayload | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const studioHistoryAppendedRef = useRef<string | null>(null);

  const fetchJob = useCallback(async () => {
    const res = await fetch(
      `/api/reels/generate?jobId=${encodeURIComponent(jobId)}`,
    );
    const data = (await res.json()) as { job?: JobPayload; error?: string };
    if (!res.ok) {
      if (data.error === "job_not_found") {
        throw new Error(
          "작업을 찾을 수 없어요. 서버가 재시작됐거나 링크가 잘못됐을 수 있어요.",
        );
      }
      throw new Error("작업 정보를 불러오지 못했습니다.");
    }
    if (!data.job) throw new Error("응답이 올바르지 않습니다.");
    return data.job;
  }, [jobId]);

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
        setErrorMessage(e instanceof Error ? e.message : "오류가 발생했습니다.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchJob]);

  useEffect(() => {
    if (!job || job.status !== "succeeded" || !job.outputVideoUrl) return;
    if (studioHistoryAppendedRef.current === job.id) return;
    studioHistoryAppendedRef.current = job.id;
    appendMyStudioHistory({
      jobId: job.id,
      videoId: job.videoId,
      outputVideoUrl: job.outputVideoUrl,
      normalizedBackgroundPrompt: job.normalizedBackgroundPrompt,
    });
    if (user) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) void syncStudioHistoryToSupabase(supabase, user.id);
    }
  }, [job, user]);

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
          AI 생성
        </p>
        <h1 className="mt-2 text-[22px] font-extrabold tracking-tight text-zinc-100 sm:text-[26px] [html[data-theme='light']_&]:text-zinc-900">
          생성 결과
        </h1>
      </header>

      {phase === "loading" ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/30 py-20 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-reels-cyan/80" aria-hidden />
          <p className="text-[13px]">불러오는 중…</p>
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
                완료되면 아래에 자동으로 표시됩니다. 이 탭을 닫아도 서버 작업은
                계속됩니다.
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
              {job.error?.trim() || "생성에 실패했습니다."}
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
                  배경 프롬프트:{" "}
                  <span className="text-zinc-400">{job.normalizedBackgroundPrompt}</span>
                </p>
              ) : null}
            </div>
          ) : null}

          {job.status === "succeeded" && !job.outputVideoUrl ? (
            <p className="text-center text-[13px] text-zinc-500">
              완료되었지만 결과 URL이 없습니다. 임시 저장에서 다시 확인해 주세요.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={`/video/${job.videoId}/customize`}
              className="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-[13px] font-bold text-zinc-200 transition hover:border-reels-cyan/35 hover:text-white"
            >
              맞춤 리스킨으로 돌아가기
            </Link>
            <Link
              href="/mypage?tab=drafts"
              className="inline-flex rounded-full border border-reels-cyan/35 bg-reels-cyan/12 px-5 py-2.5 text-[13px] font-bold text-reels-cyan hover:bg-reels-cyan/20"
            >
              마이페이지 · 임시 저장
            </Link>
            <Link
              href="/explore"
              className="inline-flex rounded-full px-4 py-2.5 text-[13px] font-semibold text-zinc-500 hover:text-zinc-300"
            >
              탐색 탭
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
