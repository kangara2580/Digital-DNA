import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { decodeDevUserIdFromJwt } from "@/lib/devJwtFallback";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type KlingMotionBody = {
  imageUrl?: string;
  videoUrl?: string;
  prompt?: string;
  characterOrientation?: string;
};

function resolveBearerUserId(request: Request): string {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  if (!token) return "anonymous";
  return decodeDevUserIdFromJwt(token) ?? "authenticated";
}

function absoluteUrl(url: string | undefined, baseUrl: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${baseUrl.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}

function extractOutputUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const candidates: unknown[] = [
    root.output_url,
    root.video_url,
    root.result_url,
    (root.data as Record<string, unknown> | undefined)?.output_url,
    (root.data as Record<string, unknown> | undefined)?.video_url,
    (root.data as Record<string, unknown> | undefined)?.result_url,
  ];

  const taskResult = (root.data as Record<string, unknown> | undefined)?.task_result as
    | Record<string, unknown>
    | undefined;
  if (taskResult) {
    candidates.push(taskResult.video_url, taskResult.url);
    const videos = taskResult.videos;
    if (Array.isArray(videos)) {
      for (const item of videos) {
        if (item && typeof item === "object") {
          candidates.push((item as Record<string, unknown>).url);
        }
      }
    }
  }

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.startsWith("http")) return candidate;
  }
  return null;
}

function extractTaskId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const direct = root.task_id;
  const nested = (root.data as Record<string, unknown> | undefined)?.task_id;
  if (typeof direct === "string") return direct;
  if (typeof nested === "string") return nested;
  return null;
}

async function createOrUpdateKlingJob(input: {
  jobId: string;
  userId: string;
  status: "queued" | "running" | "succeeded" | "failed";
  stage: string;
  progress: number;
  imageUrl: string;
  videoUrl: string;
  prompt: string;
  characterOrientation: string;
  externalTaskId: string;
  klingTaskId: string | null;
  responseJson?: unknown;
  outputUrl?: string | null;
  errorMessage?: string | null;
}) {
  const providerJson = {
    primaryProvider: "kling",
    externalTaskId: input.externalTaskId,
    externalPredictionIds: input.klingTaskId ? { motion: input.klingTaskId } : {},
    ...(input.responseJson ? { rawResponse: input.responseJson } : {}),
  };

  await prisma.generationJob.upsert({
    where: { id: input.jobId },
    create: {
      id: input.jobId,
      userId: input.userId,
      sourceVideoId: null,
      status: input.status,
      stage: input.stage,
      progress: input.progress,
      inputJson: {
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl,
        prompt: input.prompt,
        characterOrientation: input.characterOrientation,
      },
      providerJson: {
        ...providerJson,
      },
      outputUrl: input.outputUrl ?? null,
      errorMessage: input.errorMessage ?? null,
    },
    update: {
      status: input.status,
      stage: input.stage,
      progress: input.progress,
      providerJson: {
        ...providerJson,
      },
      outputUrl: input.outputUrl ?? null,
      errorMessage: input.errorMessage ?? null,
    },
  });
}

export async function POST(req: Request) {
  const userId = resolveBearerUserId(req);
  const body = (await req.json().catch(() => null)) as KlingMotionBody | null;
  if (!body) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;
  const legacyToken = process.env.KLING_API_TOKEN;
  if (!legacyToken && (!accessKey || !secretKey)) {
    return NextResponse.json(
      { error: "KLING_ACCESS_KEY and KLING_SECRET_KEY are not configured in .env.local" },
      { status: 500 },
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    new URL(req.url).origin;
  const imageUrl = absoluteUrl(body.imageUrl, baseUrl);
  const videoUrl = absoluteUrl(body.videoUrl, baseUrl);
  const prompt = body.prompt ?? "";
  const characterOrientation = body.characterOrientation || "image";
  const externalTaskId = `kling_${Date.now()}`;
  const jobId = `kling-${randomUUID()}`;

  await createOrUpdateKlingJob({
    jobId,
    userId,
    status: "queued",
    stage: "motion-kling",
    progress: 5,
    imageUrl,
    videoUrl,
    prompt,
    characterOrientation,
    externalTaskId,
    klingTaskId: null,
  });

  let token = legacyToken;
  if (!token && accessKey && secretKey) {
    const now = Math.floor(Date.now() / 1000);
    token = jwt.sign(
      { iss: accessKey, exp: now + 1800, nbf: now - 5 },
      secretKey,
      { algorithm: "HS256", header: { alg: "HS256", typ: "JWT" } },
    );
  }

  const payload = {
    model_name: "kling-v3",
    image_url: imageUrl,
    prompt,
    negative_prompt:
      "tiktok watermark, logos, text, typography, UI elements, user interface, icons, deformed face, bad anatomy, missing fingers, extra limbs, blurry, extra legs, bad face, disfigured, mutated, poor lighting",
    video_url: videoUrl,
    keep_original_sound: "yes",
    character_orientation: characterOrientation,
    mode: "pro",
    callback_url: "",
    external_task_id: externalTaskId,
  };

  try {
    const response = await fetch("https://api-singapore.klingai.com/v1/videos/motion-control", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    const klingTaskId = extractTaskId(data);
    const outputUrl = extractOutputUrl(data);
    const failed = !response.ok || Boolean((data as { error?: unknown })?.error);

    await createOrUpdateKlingJob({
      jobId,
      userId,
      status: failed ? "failed" : outputUrl ? "succeeded" : "running",
      stage: failed ? "failed" : outputUrl ? "done" : "motion-kling",
      progress: failed ? 100 : outputUrl ? 100 : 30,
      imageUrl,
      videoUrl,
      prompt,
      characterOrientation,
      externalTaskId,
      klingTaskId,
      responseJson: data,
      outputUrl,
      errorMessage: failed ? JSON.stringify(data).slice(0, 1000) : null,
    });

    return NextResponse.json({ ...data, araJobId: jobId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "kling_request_failed";
    await createOrUpdateKlingJob({
      jobId,
      userId,
      status: "failed",
      stage: "failed",
      progress: 100,
      imageUrl,
      videoUrl,
      prompt,
      characterOrientation,
      externalTaskId,
      klingTaskId: null,
      errorMessage: message,
    });
    return NextResponse.json({ error: message, araJobId: jobId }, { status: 500 });
  }
}
