"use client";

import Link from "next/link";
import { Clapperboard, Download, Pencil } from "lucide-react";
import { useStudioHistory } from "@/context/StudioHistoryContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getMarketVideoById } from "@/data/videoCommerce";
import { sanitizePosterSrc } from "@/lib/videoPoster";

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

export function MyPageStudioSection() {
  const { items, hydrated } = useStudioHistory();
  const { user } = useAuthSession();

  return (
    <section
      className="reels-glass-card rounded-2xl p-5 sm:p-6"
      aria-labelledby="my-studio-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clapperboard className="h-5 w-5 shrink-0 text-reels-cyan" aria-hidden />
          <div>
            <h2
              id="my-studio-heading"
              className="text-[15px] font-extrabold tracking-tight [html[data-theme='light']_&]:text-zinc-900"
            >
              My Studio
            </h2>
            <p className="mt-0.5 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              AI로 얼굴·배경을 적용해 만든 영상 기록입니다. 계정에 저장되며 기기를 바꿔도 같은 기록을 볼 수 있어요.
            </p>
          </div>
        </div>
        <Link
          href="/explore"
          className="text-[12px] font-semibold text-reels-cyan/90 hover:underline"
        >
          새 릴스 찾기
        </Link>
      </div>

      {!hydrated && user ? (
        <p className="mt-6 rounded-xl border border-white/10 bg-black/20 px-4 py-10 text-center text-[13px] text-zinc-500 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-600">
          기록을 불러오는 중…
        </p>
      ) : items.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-10 text-center text-[13px] text-zinc-500 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-600">
          {user
            ? "아직 저장된 스튜디오 결과가 없어요. 창작 스튜디오에서 생성이 완료되면 여기에 쌓입니다."
            : "로그인하면 생성 완료된 영상 기록이 계정에 쌓입니다."}
        </p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((row) => {
            const video = getMarketVideoById(row.videoId);
            const title = video?.title ?? `릴스 ${row.videoId}`;
            const poster = video ? sanitizePosterSrc(video.poster) : "";

            return (
              <li
                key={row.jobId}
                className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/30 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
              >
                <div className="relative aspect-video w-full bg-zinc-900/80">
                  {poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={poster}
                      alt=""
                      className="h-full w-full object-cover opacity-95"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[11px] text-zinc-500">
                      썸네일 없음
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-zinc-200 backdrop-blur-sm">
                    {formatWhen(row.createdAtIso)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="line-clamp-2 text-[13px] font-bold leading-snug text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                    {title}
                  </p>
                  {row.normalizedBackgroundPrompt ? (
                    <p className="line-clamp-2 text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                      배경: {row.normalizedBackgroundPrompt}
                    </p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <a
                      href={row.outputVideoUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 min-w-[8rem] items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-[12px] font-bold text-zinc-200 transition hover:border-reels-cyan/40 hover:text-white [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
                    >
                      <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      다시 다운로드
                    </a>
                    <Link
                      href={`/video/${row.videoId}/customize`}
                      className="inline-flex flex-1 min-w-[8rem] items-center justify-center gap-1.5 rounded-lg border border-reels-cyan/35 bg-reels-cyan/12 px-3 py-2 text-[12px] font-bold text-reels-cyan transition hover:bg-reels-cyan/20"
                    >
                      <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      다른 배경으로 재편집
                    </Link>
                  </div>
                  <Link
                    href={`/generation/result/${encodeURIComponent(row.jobId)}`}
                    className="text-center text-[11px] font-medium text-zinc-500 hover:text-reels-cyan [html[data-theme='light']_&]:text-zinc-600"
                  >
                    생성 결과 페이지 열기
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
