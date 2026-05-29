"use client";

import { useEffect, useState } from "react";

function fallbackPoster(videoId: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(videoId)}/720/1280`;
}

/** `/api/embed/poster` 등 — next/image 최적화 대상이 아닌 포스터용 */
export function ReviewVideoThumbnail({
  videoId,
  poster,
  className = "",
}: {
  videoId: string;
  poster?: string | null;
  className?: string;
}) {
  const primary = poster?.trim() || fallbackPoster(videoId);
  const [src, setSrc] = useState(primary);

  useEffect(() => {
    setSrc(poster?.trim() || fallbackPoster(videoId));
  }, [poster, videoId]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        const fb = fallbackPoster(videoId);
        if (src !== fb) setSrc(fb);
      }}
    />
  );
}
