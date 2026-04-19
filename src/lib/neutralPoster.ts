import { Buffer } from "node:buffer";

/**
 * 최소 유효 JPEG(단색) — 스톡 풍경 이미지로 오해를 줄 수 있는 외부 URL 대신 폴백용.
 * (썸네일이 꼭 필요하지만 클라이언트에서 프레임을 못 뽑은 극히 드문 경우에만 사용)
 */
const NEUTRAL_GRAY_JPEG_B64 =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

export function getNeutralPosterBuffer(): Buffer {
  return Buffer.from(NEUTRAL_GRAY_JPEG_B64, "base64");
}

/** 스토리지 업로드 실패 등 극히 드문 경우 DB에 넣는 최후의 문자열 (외부 풍경 스톡 URL 사용 안 함) */
export const NEUTRAL_POSTER_DATA_URL = `data:image/jpeg;base64,${NEUTRAL_GRAY_JPEG_B64}`;
