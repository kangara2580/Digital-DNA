import { parseExternalMediaUrl } from "@/lib/externalEmbed/parseUrl";
import { isDirectVideoFileUrl } from "@/lib/videoExtract/ytDlpDownload";

/** 판매 등록 직후 DB에 넣을 Kling용 MP4 처리 상태 */
export function getInitialProcessedFieldsForSell(params: {
  publicSrc: string;
  fromFile: boolean;
}): {
  processedVideoUrl: string | null;
  processedVideoStatus: string;
  processedVideoError: null;
} {
  if (params.fromFile) {
    return {
      processedVideoUrl: params.publicSrc,
      processedVideoStatus: "ready",
      processedVideoError: null,
    };
  }
  if (isDirectVideoFileUrl(params.publicSrc)) {
    return {
      processedVideoUrl: params.publicSrc,
      processedVideoStatus: "ready",
      processedVideoError: null,
    };
  }
  if (parseExternalMediaUrl(params.publicSrc)) {
    return {
      processedVideoUrl: null,
      processedVideoStatus: "pending",
      processedVideoError: null,
    };
  }
  return {
    processedVideoUrl: null,
    processedVideoStatus: "skipped",
    processedVideoError: null,
  };
}
