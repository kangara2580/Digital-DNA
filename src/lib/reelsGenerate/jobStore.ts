import { prisma } from "@/lib/prisma";
import type { ReelsGenerateJob, ReelsJobStatus } from "@/lib/reelsGenerate/types";
import type { Prisma } from "@prisma/client";

type JobInputJson = {
  videoId?: string;
  sourceVideoUrl?: string;
  normalizedBackgroundPrompt?: string;
};

type JobProviderJson = {
  primaryProvider?: ReelsGenerateJob["primaryProvider"];
  externalPredictionIds?: ReelsGenerateJob["externalPredictionIds"];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseInput(value: unknown): JobInputJson {
  const raw = asRecord(value);
  return {
    videoId: typeof raw.videoId === "string" ? raw.videoId : undefined,
    sourceVideoUrl:
      typeof raw.sourceVideoUrl === "string" ? raw.sourceVideoUrl : undefined,
    normalizedBackgroundPrompt:
      typeof raw.normalizedBackgroundPrompt === "string"
        ? raw.normalizedBackgroundPrompt
        : undefined,
  };
}

function parseProvider(value: unknown): JobProviderJson {
  const raw = asRecord(value);
  const ids = asRecord(raw.externalPredictionIds);
  return {
    primaryProvider:
      raw.primaryProvider === "kling" ||
      raw.primaryProvider === "replicate" ||
      raw.primaryProvider === "gemini" ||
      raw.primaryProvider === "ffmpeg" ||
      raw.primaryProvider === "pending"
        ? raw.primaryProvider
        : "pending",
    externalPredictionIds: {
      faceOrReskin:
        typeof ids.faceOrReskin === "string" ? ids.faceOrReskin : undefined,
      background: typeof ids.background === "string" ? ids.background : undefined,
      motion: typeof ids.motion === "string" ? ids.motion : undefined,
      upscale: typeof ids.upscale === "string" ? ids.upscale : undefined,
    },
  };
}

function compactJson(
  value: Record<string, unknown>,
): Prisma.InputJsonObject {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Prisma.InputJsonObject;
}

function toReelsStatus(value: string): ReelsJobStatus {
  if (value === "running" || value === "succeeded" || value === "failed") return value;
  return "queued";
}

function toStage(value: string): ReelsGenerateJob["stage"] {
  if (
    value === "bg-face-gemini" ||
    value === "motion-kling" ||
    value === "encode-text" ||
    value === "upscale" ||
    value === "done" ||
    value === "failed"
  ) {
    return value;
  }
  return "queued";
}

function rowToJob(row: {
  id: string;
  status: string;
  stage: string;
  progress: number;
  inputJson: unknown;
  providerJson: unknown;
  outputUrl: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  sourceVideoId: string | null;
}): ReelsGenerateJob {
  const input = parseInput(row.inputJson);
  const provider = parseProvider(row.providerJson);

  return {
    id: row.id,
    status: toReelsStatus(row.status),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    videoId: input.videoId ?? row.sourceVideoId ?? "",
    sourceVideoUrl: input.sourceVideoUrl ?? "",
    progress: row.progress,
    primaryProvider: provider.primaryProvider ?? "pending",
    stage: toStage(row.stage),
    externalPredictionIds: provider.externalPredictionIds ?? {},
    normalizedBackgroundPrompt: input.normalizedBackgroundPrompt,
    outputVideoUrl: row.outputUrl ?? undefined,
    error: row.errorMessage ?? undefined,
  };
}

async function currentJson(id: string): Promise<{
  input: JobInputJson;
  provider: JobProviderJson;
} | null> {
  const row = await prisma.generationJob.findUnique({
    where: { id },
    select: { inputJson: true, providerJson: true },
  });
  if (!row) return null;
  return {
    input: parseInput(row.inputJson),
    provider: parseProvider(row.providerJson),
  };
}

export async function createJob(
  initial: Omit<ReelsGenerateJob, "updatedAt"> & { userId?: string },
): Promise<ReelsGenerateJob> {
  const row = await prisma.generationJob.create({
    data: {
      id: initial.id,
      userId: initial.userId ?? "anonymous",
      status: initial.status,
      stage: initial.stage,
      progress: initial.progress,
      inputJson: compactJson({
        videoId: initial.videoId,
        sourceVideoUrl: initial.sourceVideoUrl,
        normalizedBackgroundPrompt: initial.normalizedBackgroundPrompt,
      }),
      providerJson: compactJson({
        primaryProvider: initial.primaryProvider,
        externalPredictionIds: initial.externalPredictionIds,
      }),
      outputUrl: initial.outputVideoUrl ?? null,
      errorMessage: initial.error ?? null,
    },
  });
  return rowToJob(row);
}

export async function getJob(id: string): Promise<ReelsGenerateJob | undefined> {
  const row = await prisma.generationJob.findUnique({ where: { id } });
  return row ? rowToJob(row) : undefined;
}

export async function patchJob(
  id: string,
  patch: Partial<ReelsGenerateJob>,
): Promise<ReelsGenerateJob | undefined> {
  const current = await currentJson(id);
  if (!current) return undefined;

  const input: JobInputJson = {
    ...current.input,
    ...(patch.videoId ? { videoId: patch.videoId } : {}),
    ...(patch.sourceVideoUrl ? { sourceVideoUrl: patch.sourceVideoUrl } : {}),
    ...(patch.normalizedBackgroundPrompt
      ? { normalizedBackgroundPrompt: patch.normalizedBackgroundPrompt }
      : {}),
  };
  const provider: JobProviderJson = {
    ...current.provider,
    ...(patch.primaryProvider ? { primaryProvider: patch.primaryProvider } : {}),
    ...(patch.externalPredictionIds
      ? { externalPredictionIds: patch.externalPredictionIds }
      : {}),
  };

  const row = await prisma.generationJob.update({
    where: { id },
    data: {
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.stage ? { stage: patch.stage } : {}),
      ...(typeof patch.progress === "number" ? { progress: patch.progress } : {}),
      inputJson: compactJson(input),
      providerJson: compactJson(provider),
      ...(patch.outputVideoUrl !== undefined
        ? { outputUrl: patch.outputVideoUrl ?? null }
        : {}),
      ...(patch.error !== undefined ? { errorMessage: patch.error ?? null } : {}),
    },
  });
  return rowToJob(row);
}

export async function setJobStatus(
  id: string,
  status: ReelsJobStatus,
  extra?: Partial<ReelsGenerateJob>,
): Promise<void> {
  await patchJob(id, { ...extra, status });
}
