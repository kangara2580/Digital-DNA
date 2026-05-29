"use client";

import { useEffect, useMemo, useState } from "react";
import type { FeedVideo } from "@/data/videos";
import {
  feedVideoGradientPosterDataUrl,
  resolveFeedVideoThumbnailSrc,
} from "@/lib/feedVideoThumbnail";

export function CartVideoThumbnail({
  video,
  className = "",
}: {
  video: FeedVideo;
  className?: string;
}) {
  const primary = useMemo(() => resolveFeedVideoThumbnailSrc(video), [video]);
  const gradient = useMemo(
    () => feedVideoGradientPosterDataUrl(video.id),
    [video.id],
  );
  const [src, setSrc] = useState(primary);

  useEffect(() => {
    setSrc(resolveFeedVideoThumbnailSrc(video));
  }, [video]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (src === gradient) return;
        setSrc(gradient);
      }}
    />
  );
}
