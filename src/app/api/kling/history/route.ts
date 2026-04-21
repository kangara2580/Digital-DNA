import { NextResponse } from "next/server";
import {
  getKlingBearerToken,
  getKlingTaskStatusUrl,
  readKlingTasksFromDisk,
} from "@/lib/klingApi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type KlingTaskStatusPayload = {
  data?: {
    task_status?: string | number;
    task_result?: {
      videos?: Array<{ url?: string }>;
    };
  };
};

function normalizeTaskStatus(raw: string | number | undefined): string {
  if (typeof raw === "number") {
    if (raw === 99) return "succeed";
    if (raw === 100) return "failed";
    if (raw === 50) return "processing";
    if (raw === 10) return "submitted";
    return String(raw);
  }
  return raw ?? "unknown";
}

export async function GET() {
  try {
    const tasks = (await readKlingTasksFromDisk())
      .filter((task) => Boolean(task.taskId))
      .reverse()
      .slice(0, 10);
    if (tasks.length === 0) return NextResponse.json([]);

    const auth = getKlingBearerToken();
    if (!auth.ok) {
      return NextResponse.json({ error: "missing_kling_keys" }, { status: 500 });
    }

    const results = await Promise.all(
      tasks.map(async (task) => {
        try {
          const response = await fetch(getKlingTaskStatusUrl(task.taskId), {
            headers: { Authorization: `Bearer ${auth.token}` },
            cache: "no-store",
          });
          const payload = (await response.json()) as KlingTaskStatusPayload;
          return {
            ...task,
            status: normalizeTaskStatus(payload?.data?.task_status),
            videoUrl: payload?.data?.task_result?.videos?.[0]?.url ?? null,
          };
        } catch {
          return { ...task, status: "unknown", videoUrl: null };
        }
      }),
    );

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
