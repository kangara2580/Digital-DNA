import type { VideoContentSource } from "@/lib/videoSourcePlatform";

type Props = {
  source: VideoContentSource;
  className?: string;
};

/**
 * 예전에는 URL 임베드 vs 직접 업로드를 아이콘으로 구분했습니다.
 * 플로우가 직접 업로드 중심으로 통합되어 더 이상 표시하지 않습니다.
 */
export function VideoSourcePlatformIcon(_props: Props) {
  return null;
}
