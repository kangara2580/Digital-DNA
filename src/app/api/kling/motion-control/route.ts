import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  appendKlingTask,
  buildExternalTaskId,
  getKlingBearerToken,
  getKlingCreateTaskUrl,
  resolvePublicAssetUrl,
} from "@/lib/klingApi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

async function storeDataImageAsPublicFile(imageUrl: string): Promise<string> {
  const matched = imageUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
  if (!matched) return imageUrl;
  const extension = matched[1] ?? "png";
  const base64Data = matched[2] ?? "";
  const fileName = `kling_upload_${Date.now()}.${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), Buffer.from(base64Data, "base64"));
  return `/uploads/${fileName}`;
}

export async function POST(req: Request) {
  try {
    const { imageUrl, videoUrl, prompt, characterOrientation } = (await req.json()) as {
      imageUrl?: string;
      videoUrl?: string;
      prompt?: string;
      characterOrientation?: "image" | "video";
    };
    if (!imageUrl || !videoUrl) {
      return NextResponse.json({ error: "imageUrl_and_videoUrl_required" }, { status: 400 });
    }

    const auth = getKlingBearerToken();
    if (!auth.ok) {
      return NextResponse.json(
        { error: "missing_kling_keys", message: "KLING_ACCESS_KEY / KLING_SECRET_KEY 확인" },
        { status: 500 },
      );
    }

    const normalizedImageUrl = await storeDataImageAsPublicFile(imageUrl);
    const externalTaskId = buildExternalTaskId();
    const payload = {
      model_name: "kling-v3",
      image_url: resolvePublicAssetUrl(normalizedImageUrl),
      prompt: prompt?.trim() || "",
      negative_prompt:
        "tiktok watermark, logos, text, typography, UI elements, icons, deformed face, bad anatomy, missing fingers, extra limbs, blurry, disfigured",
      video_url: resolvePublicAssetUrl(videoUrl),
      keep_original_sound: "yes",
      character_orientation: characterOrientation ?? "image",
      mode: "pro",
      callback_url: "",
      external_task_id: externalTaskId,
    };

    const response = await fetch(getKlingCreateTaskUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      data?: { task_id?: string };
      message?: string;
    };
    if (!response.ok) {
      return NextResponse.json(
        { error: "kling_api_failed", detail: data?.message ?? "unknown" },
        { status: response.status },
      );
    }

    const createdTaskId = data?.data?.task_id;
    if (createdTaskId) {
      await appendKlingTask({
        taskId: createdTaskId,
        externalId: externalTaskId,
        imageUrl: normalizedImageUrl,
        prompt: payload.prompt,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "kling_motion_control_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
