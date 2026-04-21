import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { imageUrl } = (await req.json()) as { imageUrl?: string };
    if (!imageUrl) {
      return NextResponse.json({ error: "no_image_provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "gemini_token_missing" }, { status: 500 });
    }
    if (!imageUrl.startsWith("data:image")) {
      return NextResponse.json(
        { error: "data_image_required", message: "imageUrl은 data:image/... 형식이어야 합니다." },
        { status: 400 },
      );
    }

    const mimeType = imageUrl.split(";")[0]?.split(":")[1] ?? "image/jpeg";
    const base64Data = imageUrl.split(",")[1] ?? "";
    if (!base64Data) {
      return NextResponse.json({ error: "invalid_data_image" }, { status: 400 });
    }

    const systemPrompt = `[Role: Strict Orthographic 3-Way Character Sheet Expert]
당신은 업로드된 인물/캐릭터 이미지를 분석하여 영상 합성용 초고화질 얼굴 캐릭터 시트를 생성하는 전문가입니다.
오직 인물의 얼굴과 두부(어깨 위)에만 집중된 C.U(Close Up) 3면도 1장만 생성하세요.
NO 3/4 View: 정면(0°), 완전 측면(90°), 후면(180°)만 허용합니다.
세 얼굴 사이 여백을 충분히 두고 겹치지 않게 배치하세요.
원본 얼굴/헤어/이목구비/피부질감을 최대한 보존하세요.
배경은 단색(white or neutral gray), 출력은 고해상도로 생성하세요.`;

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
                { text: systemPrompt },
                { inline_data: { mime_type: mimeType, data: base64Data } },
              ],
            },
          ],
          generationConfig: { temperature: 0.1 },
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

    const resultImages: string[] = [];
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        resultImages.push(
          `data:${part.inlineData.mimeType ?? "image/png"};base64,${part.inlineData.data}`,
        );
      } else if (part.inline_data?.data) {
        resultImages.push(
          `data:${part.inline_data.mime_type ?? "image/png"};base64,${part.inline_data.data}`,
        );
      }
    }

    if (resultImages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Gemini did not return image output." },
        { status: 400 },
      );
    }

    const returnedImage = resultImages[0]!;
    return NextResponse.json({
      success: true,
      resultAngles: [returnedImage, returnedImage, returnedImage],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "generate_angles_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
