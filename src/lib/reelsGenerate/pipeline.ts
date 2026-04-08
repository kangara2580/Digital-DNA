import { patchJob, setJobStatus } from "@/lib/reelsGenerate/jobStore";
import {
  buildNormalizedBackgroundPrompt,
  pollGeminiJob,
  pollKlingMotionJob,
  pollUpscaleJob,
  runFfmpegEncodeJob,
  startGeminiCompositeJob,
  startKlingMotionControlJob,
  startUpscaleJob,
} from "@/lib/reelsGenerate/providers";
import type { ReelsGenerateRequestBody } from "@/lib/reelsGenerate/types";

/**
 * 비동기 파이프라인 — route에서 fire-and-forget.
 * 순서:
 * 1) Gemini(Nano Banana 2): 얼굴+배경 합성
 * 2) Kling Motion Control: 동작 보존
 * 3) FFmpeg: 인코딩/텍스트/LUT
 * 4) Upscale: 최종 선명도 개선
 * 실제 제품에서는 단계별 웹훅/SQS로 분리하는 것이 안전합니다.
 */
export async function runReelsGenerationPipeline(
  jobId: string,
  payload: ReelsGenerateRequestBody & { sourceVideoUrl: string },
): Promise<void> {
  const { sourceVideoUrl, faceImageUrl, draft } = payload;

  try {
    setJobStatus(jobId, "running", {
      progress: 5,
      primaryProvider: "pending",
      stage: "bg-face-gemini",
    });
    const normalizedBackgroundPrompt = buildNormalizedBackgroundPrompt(
      draft.backgroundPrompt,
    );
    patchJob(jobId, { normalizedBackgroundPrompt });

    const gemini = await startGeminiCompositeJob({
      sourceVideoUrl,
      faceImageUrl,
      normalizedPrompt: normalizedBackgroundPrompt,
      draft,
    });

    patchJob(jobId, {
      progress: 25,
      primaryProvider: "gemini",
      stage: "bg-face-gemini",
      externalPredictionIds: {
        faceOrReskin: gemini.externalId,
      },
    });

    let intermediateVideo = sourceVideoUrl;
    let geminiPolls = 0;
    while (geminiPolls < 24) {
      const g = await pollGeminiJob(gemini.externalId);
      geminiPolls += 1;
      if (g.done) {
        if (g.outputUrl) intermediateVideo = g.outputUrl;
        break;
      }
      patchJob(jobId, { progress: Math.min(45, 25 + geminiPolls * 2) });
      await sleep(400);
    }

    patchJob(jobId, { progress: 50, stage: "motion-kling" });

    const motion = await startKlingMotionControlJob({
      sourceVideoUrl: intermediateVideo,
      draft,
    });
    patchJob(jobId, {
      progress: 62,
      primaryProvider: "kling",
      stage: "motion-kling",
      externalPredictionIds: {
        faceOrReskin: gemini.externalId,
        motion: motion.externalId,
      },
    });

    let motionVideo = intermediateVideo;
    let motionPolls = 0;
    while (motionPolls < 30) {
      const m = await pollKlingMotionJob(motion.externalId);
      motionPolls += 1;
      if (m.done) {
        if (m.outputUrl) motionVideo = m.outputUrl;
        break;
      }
      patchJob(jobId, { progress: Math.min(78, 62 + motionPolls) });
      await sleep(350);
    }

    patchJob(jobId, { progress: 80, stage: "encode-text", primaryProvider: "ffmpeg" });
    const encoded = await runFfmpegEncodeJob({
      sourceVideoUrl: motionVideo,
      draft,
    });

    patchJob(jobId, { progress: 88, stage: "upscale", primaryProvider: "replicate" });
    const upscale = await startUpscaleJob({ sourceVideoUrl: encoded.outputUrl });
    patchJob(jobId, {
      externalPredictionIds: {
        faceOrReskin: gemini.externalId,
        motion: motion.externalId,
        upscale: upscale.externalId,
      },
    });

    let finalVideo = encoded.outputUrl;
    let upPolls = 0;
    while (upPolls < 24) {
      const u = await pollUpscaleJob(upscale.externalId);
      upPolls += 1;
      if (u.done) {
        if (u.outputUrl) finalVideo = u.outputUrl;
        break;
      }
      patchJob(jobId, { progress: Math.min(98, 88 + upPolls) });
      await sleep(300);
    }

    patchJob(jobId, {
      status: "succeeded",
      progress: 100,
      outputVideoUrl: finalVideo,
      primaryProvider: "replicate",
      stage: "done",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "pipeline_error";
    patchJob(jobId, {
      status: "failed",
      error: message,
      progress: 0,
      stage: "failed",
    });
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
