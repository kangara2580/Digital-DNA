import { Clapperboard } from "lucide-react";
import { SellerSocialPlatformIcon } from "@/components/SellerSocialPlatformIcon";
import {
  type VideoContentSource,
  videoContentSourceAriaLabel,
} from "@/lib/videoSourcePlatform";

type Props = {
  source: VideoContentSource;
  className?: string;
};

/**
 * 영상 출처 아이콘 — TikTok·YouTube·Instagram·직접 업로드(클래퍼보드).
 */
export function VideoSourcePlatformIcon({ source, className }: Props) {
  const cls = className ?? "h-3.5 w-3.5";
  if (source === "upload") {
    return (
      <span
        className="inline-flex shrink-0 text-current"
        title={videoContentSourceAriaLabel(source)}
        aria-label={videoContentSourceAriaLabel(source)}
      >
        <Clapperboard className={cls} strokeWidth={2} aria-hidden />
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 text-current"
      title={videoContentSourceAriaLabel(source)}
      aria-label={videoContentSourceAriaLabel(source)}
    >
      <SellerSocialPlatformIcon platform={source} className={cls} />
    </span>
  );
}
