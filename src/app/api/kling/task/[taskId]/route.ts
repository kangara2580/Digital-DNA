import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

function extractOutputUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const taskResult = (root.data as Record<string, unknown> | undefined)?.task_result as
    | Record<string, unknown>
    | undefined;
  const videos = taskResult?.videos;
  if (Array.isArray(videos)) {
    for (const item of videos) {
      if (item && typeof item === "object") {
        const url = (item as Record<string, unknown>).url;
        if (typeof url === "string" && url.startsWith("http")) return url;
      }
    }
  }
  return null;
}

async function updateKlingJobFromStatus(taskId: string, data: unknown) {
  if (!data || typeof data !== "object") return;
  const root = data as Record<string, unknown>;
  const status = (root.data as Record<string, unknown> | undefined)?.task_status;
  const outputUrl = extractOutputUrl(data);
  const failed = status === 100 || root.code !== 0;
  const succeeded = status === 99 || Boolean(outputUrl);
  const nextStatus = failed ? "failed" : succeeded ? "succeeded" : "running";
  const nextStage = failed ? "failed" : succeeded ? "done" : "motion-kling";
  const progress = failed || succeeded ? 100 : status === 50 ? 70 : 35;
  const errorMessage = failed ? JSON.stringify(data).slice(0, 1000) : null;

  await prisma.$executeRaw`
    update generation_jobs
    set
      status = ${nextStatus},
      stage = ${nextStage},
      progress = ${progress},
      output_url = coalesce(${outputUrl}, output_url),
      error_message = ${errorMessage},
      updated_at = now()
    where provider_json #>> '{externalPredictionIds,motion}' = ${taskId}
  `;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    if (!taskId) {
      return NextResponse.json({ error: "Missing task_id parameters" }, { status: 400 });
    }

    const accessKey = process.env.KLING_ACCESS_KEY;
    const secretKey = process.env.KLING_SECRET_KEY;
    const legacyToken = process.env.KLING_API_TOKEN;

    if (!legacyToken && (!accessKey || !secretKey)) {
      return NextResponse.json(
        { error: "KLING_ACCESS_KEY and KLING_SECRET_KEY are not configured" },
        { status: 500 }
      );
    }

    let token = legacyToken;
    if (!token && accessKey && secretKey) {
      const now = Math.floor(Date.now() / 1000);
      token = jwt.sign(
        { iss: accessKey, exp: now + 1800, nbf: now - 5 },
        secretKey,
        { algorithm: "HS256", header: { alg: "HS256", typ: "JWT" } }
      );
    }

    const response = await fetch(`https://api-singapore.klingai.com/v1/videos/motion-control/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    await updateKlingJobFromStatus(taskId, data);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
