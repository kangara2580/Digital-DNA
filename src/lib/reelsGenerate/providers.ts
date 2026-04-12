/**
 * Gemini / Kling / FFmpeg / Upscale 연동 모듈.
 *
 * 설계 목표:
 * - URL/경로를 endpoints.ts에서 중앙 관리
 * - 나중에 자체 AI 서버 연결 시 REELS_AI_BASE_URL만 바꿔도 동작
 */

import {
  joinEndpoint,
  REELS_OWN_AI_BASE_URL,
  REELS_OWN_AI_TOKEN,
  REELS_PROVIDER_ENDPOINTS,
  isOwnAiServerEnabled,
} from "@/lib/reelsGenerate/endpoints";
import type { ReelsCustomizeDraft } from "@/lib/reelsGenerate/types";
import { getReplicateApiToken } from "@/lib/replicateToken";

export type StartResult = { externalId: string };

export type PollResult = {
  done: boolean;
  outputUrl?: string;
  error?: string;
};

type OwnStartResponse = {
  jobId?: string;
  externalId?: string;
};

type OwnPollResponse = {
  status?: string;
  outputUrl?: string;
  error?: string;
};

function hasEnv(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

const PROMPT_SUFFIX =
  "high quality, cinematic lighting, matching original character style";

export function buildNormalizedBackgroundPrompt(userPrompt: string): string {
  const base = userPrompt.trim();
  if (!base) return PROMPT_SUFFIX;
  if (base.toLowerCase().includes("cinematic lighting")) {
    return base;
  }
  return `${base}, ${PROMPT_SUFFIX}`;
}

/** 1~2단계: Gemini (Nano Banana 2) — 얼굴+배경 보정 합성 */
export async function startGeminiCompositeJob(params: {
  sourceVideoUrl: string;
  faceImageUrl: string;
  normalizedPrompt: string;
  draft: ReelsCustomizeDraft;
}): Promise<StartResult> {
  if (isOwnAiServerEnabled()) {
    const url = joinEndpoint(REELS_OWN_AI_BASE_URL, REELS_PROVIDER_ENDPOINTS.geminiStart);
    const res = await postJson<OwnStartResponse>(url, params, ownServerHeaders());
    return { externalId: res.jobId ?? res.externalId ?? `own-gemini-${Date.now()}` };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    await sleep(400);
    return { externalId: `gemini-mock-${Date.now()}` };
  }

  // TODO: direct Gemini API 연동 (필요 시)
  void params;
  await sleep(200);
  return { externalId: `gemini-${Date.now()}` };
}

/** 3단계: Kling Motion Control */
export async function startKlingMotionControlJob(params: {
  sourceVideoUrl: string;
  draft: ReelsCustomizeDraft;
}): Promise<StartResult> {
  if (isOwnAiServerEnabled()) {
    const url = joinEndpoint(REELS_OWN_AI_BASE_URL, REELS_PROVIDER_ENDPOINTS.klingStart);
    const res = await postJson<OwnStartResponse>(url, params, ownServerHeaders());
    return { externalId: res.jobId ?? res.externalId ?? `own-kling-${Date.now()}` };
  }

  const apiKey = process.env.KLING_API_KEY;
  if (!apiKey) {
    await sleep(400);
    return { externalId: `kling-motion-mock-${Date.now()}` };
  }

  // TODO: direct Kling API 연동 (필요 시)
  void params;
  await sleep(200);
  return { externalId: `kling-motion-${Date.now()}` };
}

/** 4단계: FFmpeg 인코딩 + 텍스트/LUT */
export async function runFfmpegEncodeJob(params: {
  sourceVideoUrl: string;
  draft: ReelsCustomizeDraft;
}): Promise<{ outputUrl: string }> {
  if (isOwnAiServerEnabled()) {
    const url = joinEndpoint(REELS_OWN_AI_BASE_URL, REELS_PROVIDER_ENDPOINTS.ffmpegEncode);
    const res = await postJson<{ outputUrl?: string }>(url, params, ownServerHeaders());
    if (res.outputUrl) return { outputUrl: res.outputUrl };
  }

  // TODO: ffmpeg worker/container 실연동
  void params;
  await sleep(500);
  return { outputUrl: "https://example.invalid/ffmpeg-output-placeholder.mp4" };
}

/** 5단계: 업스케일링 */
export async function startUpscaleJob(params: {
  sourceVideoUrl: string;
}): Promise<StartResult> {
  if (isOwnAiServerEnabled()) {
    const url = joinEndpoint(REELS_OWN_AI_BASE_URL, REELS_PROVIDER_ENDPOINTS.upscaleStart);
    const res = await postJson<OwnStartResponse>(url, params, ownServerHeaders());
    return { externalId: res.jobId ?? res.externalId ?? `own-upscale-${Date.now()}` };
  }

  if (!getReplicateApiToken()) {
    await sleep(350);
    return { externalId: `upscale-mock-${Date.now()}` };
  }

  // TODO: direct upscale provider 연동 (필요 시)
  void params;
  await sleep(200);
  return { externalId: `upscale-${Date.now()}` };
}

/** Gemini 폴링 */
export async function pollGeminiJob(externalId: string): Promise<PollResult> {
  if (isOwnAiServerEnabled()) {
    const url = joinEndpoint(
      REELS_OWN_AI_BASE_URL,
      `${REELS_PROVIDER_ENDPOINTS.geminiPoll}/${encodeURIComponent(externalId)}`,
    );
    const res = await getJson<OwnPollResponse>(url, ownServerHeaders());
    return pollFromOwnResponse(res);
  }

  if (!process.env.GEMINI_API_KEY) {
    await sleep(600);
    return {
      done: true,
      outputUrl: "https://example.invalid/gemini-composite-placeholder.mp4",
    };
  }

  // TODO: direct Gemini status polling
  await sleep(300);
  return { done: false };
}

/** Kling 폴링 */
export async function pollKlingMotionJob(externalId: string): Promise<PollResult> {
  if (isOwnAiServerEnabled()) {
    const url = joinEndpoint(
      REELS_OWN_AI_BASE_URL,
      `${REELS_PROVIDER_ENDPOINTS.klingPoll}/${encodeURIComponent(externalId)}`,
    );
    const res = await getJson<OwnPollResponse>(url, ownServerHeaders());
    return pollFromOwnResponse(res);
  }

  if (!process.env.KLING_API_KEY) {
    await sleep(500);
    return {
      done: true,
      outputUrl: "https://example.invalid/kling-motion-placeholder.mp4",
    };
  }

  // TODO: direct Kling status polling
  await sleep(300);
  return { done: false };
}

/** 업스케일 폴링 */
export async function pollUpscaleJob(externalId: string): Promise<PollResult> {
  if (isOwnAiServerEnabled()) {
    const url = joinEndpoint(
      REELS_OWN_AI_BASE_URL,
      `${REELS_PROVIDER_ENDPOINTS.upscalePoll}/${encodeURIComponent(externalId)}`,
    );
    const res = await getJson<OwnPollResponse>(url, ownServerHeaders());
    return pollFromOwnResponse(res);
  }

  if (!getReplicateApiToken()) {
    await sleep(500);
    return {
      done: true,
      outputUrl: "https://example.invalid/upscale-placeholder.mp4",
    };
  }

  // TODO: direct upscale status polling
  await sleep(300);
  return { done: false };
}

function ownServerHeaders(): Record<string, string> {
  if (!REELS_OWN_AI_TOKEN) return {};
  return { Authorization: `Bearer ${REELS_OWN_AI_TOKEN}` };
}

function pollFromOwnResponse(res: OwnPollResponse): PollResult {
  const s = (res.status ?? "").toLowerCase();
  if (s === "failed" || s === "error") {
    return { done: true, error: res.error ?? "own_server_failed" };
  }
  if (s === "done" || s === "completed" || s === "succeeded") {
    return { done: true, outputUrl: res.outputUrl };
  }
  return { done: false };
}

async function postJson<T>(
  url: string,
  body: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(extraHeaders ?? {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`request_failed:${res.status}`);
  }
  return (await res.json()) as T;
}

async function getJson<T>(url: string, extraHeaders?: Record<string, string>): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(extraHeaders ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`request_failed:${res.status}`);
  }
  return (await res.json()) as T;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
