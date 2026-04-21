import { NextResponse } from "next/server";
import { getKlingBearerToken, getKlingTaskStatusUrl } from "@/lib/klingApi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;
    if (!taskId) {
      return NextResponse.json({ error: "missing_task_id" }, { status: 400 });
    }
    const auth = getKlingBearerToken();
    if (!auth.ok) {
      return NextResponse.json({ error: "missing_kling_keys" }, { status: 500 });
    }

    const response = await fetch(getKlingTaskStatusUrl(taskId), {
      method: "GET",
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.ok ? 200 : response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "kling_task_fetch_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
