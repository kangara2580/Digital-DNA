"use client";

import { useCallback, useState } from "react";

type Props = {
  title: string;
  downloadUrl: string;
  sharePageUrl: string;
};

export function PurchaseCompleteClient({ title, downloadUrl, sharePageUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [shareErr, setShareErr] = useState<string | null>(null);

  const onCopyLink = useCallback(async () => {
    setShareErr(null);
    try {
      await navigator.clipboard.writeText(sharePageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareErr("링크 복사에 실패했습니다. 주소창의 URL을 직접 복사해 주세요.");
    }
  }, [sharePageUrl]);

  const onShare = useCallback(async () => {
    setShareErr(null);
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `${title} — ARA에서 구매한 영상`,
          url: sharePageUrl,
        });
        return;
      }
      await onCopyLink();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setShareErr("공유를 완료하지 못했습니다. 링크 복사를 이용해 주세요.");
    }
  }, [onCopyLink, sharePageUrl, title]);

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <a
        href={downloadUrl}
        download
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-white/20 bg-white px-6 py-3 text-center text-[15px] font-bold text-zinc-950 transition hover:bg-zinc-100 sm:min-w-[200px] [html[data-theme='light']_&]:border-zinc-300"
      >
        원본 영상 다운로드
      </a>
      <button
        type="button"
        onClick={onShare}
        className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-white/25 bg-transparent px-6 py-3 text-[15px] font-semibold text-zinc-100 transition hover:bg-white/10 sm:min-w-[160px] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100"
      >
        공유하기
      </button>
      <button
        type="button"
        onClick={onCopyLink}
        className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-white/15 px-6 py-3 text-[14px] font-medium text-zinc-300 transition hover:bg-white/[0.06] sm:min-w-[140px] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-700"
      >
        {copied ? "링크 복사됨" : "페이지 링크 복사"}
      </button>
      {shareErr ? (
        <p className="w-full text-center text-[13px] text-amber-200 [html[data-theme='light']_&]:text-amber-800">
          {shareErr}
        </p>
      ) : null}
    </div>
  );
}
