/**
 * POST /api/reels/generate 및 작업 상태 조회용 타입.
 * PurchaseCustomizeStudio 로컬 draft와 동일한 스키마를 유지합니다.
 */
export type ReelsTextOverlay = {
  id: string;
  text: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  topPct: number;
};

export type ReelsCustomizeDraft = {
  faceOptionId: string | null;
  backgroundPrompt: string;
  trimStart: number;
  trimEnd: number;
  overlays: ReelsTextOverlay[];
};

/** 클라이언트 → POST 본문 */
export type ReelsGenerateRequestBody = {
  videoId: string;
  /** 선택한 얼굴 이미지 — https URL 또는 data:image/... (서버가 소스 영상과 합성 파이프라인에 전달) */
  faceImageUrl: string;
  draft: ReelsCustomizeDraft;
};

export type ReelsJobStatus = "queued" | "running" | "succeeded" | "failed";

export type ReelsGenerateJob = {
  id: string;
  status: ReelsJobStatus;
  createdAt: string;
  updatedAt: string;
  videoId: string;
  sourceVideoUrl: string;
  /** 0–100, UI 폴링용 */
  progress: number;
  /** 어떤 백엔드가 실제 추론을 담당하는지 */
  primaryProvider: "kling" | "replicate" | "gemini" | "ffmpeg" | "pending";
  /** 소비자 화면 표시용 단계 */
  stage:
    | "queued"
    | "bg-face-gemini"
    | "motion-kling"
    | "encode-text"
    | "upscale"
    | "done"
    | "failed";
  /** 외부 플랫폼 작업 ID (폴링·웹훅 연동용) */
  externalPredictionIds: {
    faceOrReskin?: string;
    background?: string;
    motion?: string;
    upscale?: string;
  };
  /** 실제 백엔드로 전달한 보정 프롬프트 */
  normalizedBackgroundPrompt?: string;
  outputVideoUrl?: string;
  error?: string;
};
