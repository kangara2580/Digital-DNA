import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function fetchAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  let base64 = "";
  let mimeType = "image/jpeg";
  if (url.startsWith("data:")) {
    const parts = url.split(";base64,");
    base64 = parts[1] ?? "";
    mimeType = parts[0]?.split(":")[1]?.split(";")[0] ?? mimeType;
  } else if (url.startsWith("http")) {
    const imgRes = await fetch(url);
    if (imgRes.ok) {
      const arrayBuffer = await imgRes.arrayBuffer();
      base64 = Buffer.from(arrayBuffer).toString("base64");
      mimeType = imgRes.headers.get("content-type") || mimeType;
    }
  }
  return { base64, mimeType };
}

export async function POST(req: NextRequest) {
  try {
    const { avatarUrl, backgroundUrl, orientation, outfitPrompt, backgroundPrompt } =
      (await req.json()) as {
        avatarUrl?: string;
        backgroundUrl?: string;
        orientation?: "portrait" | "landscape";
        outfitPrompt?: string;
        backgroundPrompt?: string;
      };

    if (!avatarUrl || !backgroundUrl) {
      return NextResponse.json({ error: "missing_inputs" }, { status: 400 });
    }
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "gemini_token_missing" }, { status: 500 });
    }

    const { base64: avatarBase64, mimeType: avatarMime } = await fetchAsBase64(avatarUrl);
    const { base64: bgBase64, mimeType: bgMime } = await fetchAsBase64(backgroundUrl);
    if (!avatarBase64 || !bgBase64) {
      throw new Error("failed_to_process_source_images");
    }

    const aspectRatioInstruction = orientation === "portrait" ? "9:16" : "16:9";
    const outfitInstruction =
      typeof outfitPrompt === "string" && outfitPrompt.trim().length > 0
        ? `ADDITIONAL SPECIFIC INSTRUCTIONS: ${outfitPrompt.trim()}`
        : "NO SPECIFIC OUTFIT PROVIDED (Maintain Image B outfit)";
    const bgInstruction =
      typeof backgroundPrompt === "string" && backgroundPrompt.trim().length > 0
        ? `The scene takes place in: "${backgroundPrompt.trim()}". You MUST relight the character (Image A) to perfectly blend with this specific environment's shadows and color temperature.`
        : "";

    const finalPrompt = `CRITICAL FACE CONSISTENCY REQUIRED: The face MUST 100% perfectly match the PERSON from the FIRST image (Image A) without any alteration to facial features, age, gender, or identity. Under NO circumstances should the face change.

A high-resolution, photorealistic BUST SHOT (chest/waist up portrait).
Image A = FACE IDENTITY REFERENCE.
Image B = POSTURE AND BACKGROUND REFERENCE.

The BODY, POSTURE, and EXACT BACKGROUND must be identical to the SECOND image provided (Image B). Do NOT change the camera angle, framing, or background elements of Image B. CRITICAL: The framing MUST be a BUST SHOT / CLOSE-UP portrait.
${bgInstruction}
${outfitInstruction}. (SEVERE WARNING: When applying this outfit, DO NOT alter the face identity from Image A!).
Ensure the final image is exactly a ${aspectRatioInstruction} vertical aspect ratio.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { inline_data: { data: avatarBase64, mime_type: avatarMime } },
                { inline_data: { data: bgBase64, mime_type: bgMime } },
                { text: finalPrompt },
              ],
            },
          ],
          generationConfig: { temperature: 0.7 },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }
    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { mimeType?: string; data?: string };
            inline_data?: { mime_type?: string; data?: string };
          }>;
        };
      }>;
    };

    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    let fusionOutputUrl: string | null = null;
    for (const part of parts) {
      if (part.inlineData?.data) {
        fusionOutputUrl = `data:${part.inlineData.mimeType ?? "image/png"};base64,${part.inlineData.data}`;
        break;
      }
      if (part.inline_data?.data) {
        fusionOutputUrl = `data:${part.inline_data.mime_type ?? "image/png"};base64,${part.inline_data.data}`;
        break;
      }
    }
    if (!fusionOutputUrl) {
      throw new Error("no_image_generated");
    }

    return NextResponse.json({ ok: true, fusionOutputUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "dna_fusion_failed";
    return NextResponse.json({ error: "fusion_failed", message }, { status: 502 });
  }
}
