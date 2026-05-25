import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function readOutputUrl(providerJson: unknown): string | null {
  if (!providerJson || typeof providerJson !== "object") return null;
  const raw = (providerJson as { rawResponse?: unknown }).rawResponse;
  if (!raw || typeof raw !== "object") return null;
  const data = (raw as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const result = (data as { task_result?: unknown }).task_result;
  if (!result || typeof result !== "object") return null;
  const videos = (result as { videos?: unknown }).videos;
  if (!Array.isArray(videos)) return null;
  const first = videos[0];
  if (!first || typeof first !== "object") return null;
  const url = (first as { url?: unknown }).url;
  return typeof url === "string" ? url : null;
}

export async function GET() {
  try {
    const jobs = await prisma.generationJob.findMany({
      where: {
        stage: { in: ["motion-kling", "done"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        progress: true,
        outputUrl: true,
        errorMessage: true,
        inputJson: true,
        providerJson: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      jobs.map((job) => ({
        id: job.id,
        taskId: job.id,
        externalId: job.id,
        status: job.status,
        progress: job.progress,
        videoUrl: job.outputUrl ?? readOutputUrl(job.providerJson),
        outputUrl: job.outputUrl ?? readOutputUrl(job.providerJson),
        error: job.errorMessage,
        input: job.inputJson,
        provider: job.providerJson,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      })),
    );
  } catch (err) {
    console.error("[kling/history]", err);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
