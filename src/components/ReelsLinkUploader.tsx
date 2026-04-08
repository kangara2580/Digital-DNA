"use client";

import { useCallback, useMemo, useState } from "react";
import { parseSocialReelsUrl } from "@/lib/socialReelsUrl";

export function ReelsLinkUploader() {
  const [url, setUrl] = useState("");
  const parsed = useMemo(() => parseSocialReelsUrl(url), [url]);

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="reels-border-gradient rounded-2xl p-5 sm:p-7">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-reels-cyan">
        Seller · Reels URL
      </p>
      <h1 className="mt-1 text-xl font-extrabold tracking-tight text-zinc-100 sm:text-2xl">
        릴스 링크 등록
      </h1>
      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-500">
        TikTok·Instagram 릴스 URL을 붙여 넣으면 아래에서 미리 재생할 수 있어요. 원본 파일이
        없을 때는 서버에서 다운로드·정규화한 뒤 카탈로그에 올리는 파이프라인과 연결하면
        됩니다.
      </p>

      <form onSubmit={onSubmit} className="mt-6">
        <label htmlFor="reels-url" className="sr-only">
          릴스 URL
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <input
            id="reels-url"
            type="url"
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@user/video/… 또는 instagram.com/reel/…"
            className="min-w-0 flex-1 rounded-xl border border-white/12 bg-black/35 px-4 py-3 text-[14px] text-zinc-100 placeholder:text-zinc-600 focus:border-reels-cyan/45 focus:outline-none focus:ring-1 focus:ring-reels-cyan/35"
            autoComplete="url"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-reels-crimson px-6 py-3 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
          >
            미리보기
          </button>
        </div>
      </form>

      <div className="mt-8">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          미리보기
        </p>
        {!parsed ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-black/25 px-4 py-12 text-center text-[13px] text-zinc-500">
            링크를 입력하면 TikTok·Instagram은 임베드로 재생됩니다.
          </div>
        ) : parsed.platform === "unknown" ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-6 text-[13px] leading-relaxed text-zinc-300">
            <p className="font-semibold text-amber-200/95">지원 형식을 확인하지 못했어요</p>
            <p className="mt-2 text-zinc-400">
              TikTok <code className="rounded bg-black/40 px-1 text-[12px]">…/video/숫자</code> 또는
              Instagram{" "}
              <code className="rounded bg-black/40 px-1 text-[12px]">/reel/쇼트코드</code> 형식을
              사용해 주세요. 서버 단에서 링크 다운로드(참고: 외부 다운로더 파이프라인)는 별도
              API로 붙입니다.
            </p>
            <a
              href={parsed.href.startsWith("http") ? parsed.href : `https://${parsed.href}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-reels-cyan hover:underline"
            >
              새 탭에서 링크 열기
            </a>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
            <div className="aspect-[9/16] w-full max-w-[min(100%,320px)] sm:aspect-[10/16]">
              <iframe
                title="릴스 미리보기"
                src={parsed.embedUrl}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="border-t border-white/10 px-3 py-2 font-mono text-[10px] text-zinc-500">
              {parsed.platform === "tiktok"
                ? `TikTok · video ${parsed.videoId}`
                : `Instagram · reel ${parsed.shortcode}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
