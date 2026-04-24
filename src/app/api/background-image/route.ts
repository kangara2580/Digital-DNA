import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "gemini_token_missing", message: "Gemini API Key가 없습니다." },
      { status: 500 }
    );
  }

  let body: { prompt?: string; sourceImageUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const sourceImageUrl = body.sourceImageUrl;
  const orientation = body.orientation || "portrait";
  
  if (!prompt) {
    return NextResponse.json({ error: "prompt_required" }, { status: 400 });
  }

  try {
    // 1. AI Helper: 단어/문장을 풍부한 묘사(영문)로 변환
    const textRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           contents: [{
               role: "user",
               parts: [{ text: `You are an expert prompt engineer. The user wants to change a video background to: "${prompt}". Describe this new environment in highly detailed, atmospheric English. Focus on the lighting, mood, neon signs, sun position, colors, shadows, and textures. Make it 2-3 sentences. Return ONLY the English description.` }]
           }]
        })
    });
    
    let expandedPrompt = prompt;
    if (textRes.ok) {
        const textData = await textRes.json();
        const expanded = textData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (expanded) {
            expandedPrompt = expanded.trim().replace(/^"|"$/g, '');
        }
    }

    // 2. Fetch and Convert Source Image to Base64
    let base64Image = null;
    let mimeType = "image/jpeg";

    if (sourceImageUrl) {
        if (sourceImageUrl.startsWith("data:image")) {
            const parts = sourceImageUrl.split(",");
            base64Image = parts[1];
            mimeType = parts[0].split(":")[1].split(";")[0];
        } else if (sourceImageUrl.startsWith("http")) {
            const imgRes = await fetch(sourceImageUrl);
            if (imgRes.ok) {
                const arrayBuffer = await imgRes.arrayBuffer();
                base64Image = Buffer.from(arrayBuffer).toString("base64");
                mimeType = imgRes.headers.get("content-type") || "image/jpeg";
            }
        }
    }

    // 3. User Template Injection
    const aspectRatioInstruction = orientation === "portrait" ? "portrait 9:16" : "horizontal 16:9";
    const finalPrompt = `A photorealistic, high-resolution image derived from image_0.png, depicting the exact same person in their original exact pose, expression, clothing, and hair as seen in the source image. The entire original background and all UI overlays are completely removed. She/He is now seamlessly integrated into ${expandedPrompt}. The crucial requirement is realistic re-lighting: the original backlighting is removed and replaced entirely by the specific light sources of this new environment. New, complex, natural-looking shadows and highlights from these light sources define their features with three-dimensional depth. They are realistically grounded on the new floor surface with matching contact shadows. The depth of field blurs the background appropriately for the camera depth. No text, logos, or UI overlays are present. Ensure the aspect ratio is ${aspectRatioInstruction}.`;

    const partsParam: any[] = [{ text: finalPrompt }];
    if (base64Image) {
        partsParam.unshift({
            inline_data: {
                data: base64Image,
                mime_type: mimeType
            }
        });
    }

    // 4. Nano Banana 2 API Call
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: partsParam
            }],
            generationConfig: {
                temperature: 0.7
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", errorText);
        throw new Error(errorText);
    }

    const data = await response.json();
    let backgroundOutputUrl = null;

    const parts = data?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
        if (part.inlineData) {
            backgroundOutputUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
        } else if (part.inline_data) {
            backgroundOutputUrl = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
            break;
        }
    }

    if (!backgroundOutputUrl) {
       throw new Error("No image generated from NanoBanana");
    }

    return NextResponse.json({
      ok: true,
      backgroundOutputUrl,
      backgroundWarning: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "nanobanana_background_failed";
    return NextResponse.json(
      { error: "background_failed", message },
      { status: 502 }
    );
  }
}
