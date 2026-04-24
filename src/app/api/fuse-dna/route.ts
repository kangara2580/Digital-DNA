import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // 60 seconds

export async function POST(req: NextRequest) {
  try {
    const { avatarUrl, backgroundUrl, orientation, outfitPrompt, backgroundPrompt } = await req.json();

    if (!avatarUrl || !backgroundUrl) {
      return NextResponse.json({ error: "Missing avatarUrl or backgroundUrl" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    // Helper to fetch and convert to base64
    async function fetchAsBase64(url: string) {
      let base64 = "";
      let mimeType = "image/jpeg";
      if (url.startsWith("data:")) {
        const parts = url.split(";base64,");
        base64 = parts[1];
        mimeType = parts[0].split(":")[1].split(";")[0];
      } else if (url.startsWith("http")) {
        const imgRes = await fetch(url);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          base64 = Buffer.from(arrayBuffer).toString("base64");
          mimeType = imgRes.headers.get("content-type") || "image/jpeg";
        }
      }
      return { base64, mimeType };
    }

    const { base64: avatarBase64, mimeType: avatarMime } = await fetchAsBase64(avatarUrl);
    const { base64: bgBase64, mimeType: bgMime } = await fetchAsBase64(backgroundUrl);

    if (!avatarBase64 || !bgBase64) {
       throw new Error("Failed to process source images");
    }

    const aspectRatioInstruction = orientation === "portrait" ? "9:16" : "16:9";
    const outfitInstruction = outfitPrompt && outfitPrompt.trim().length > 0 
        ? `ADDITIONAL SPECIFIC INSTRUCTIONS: ${outfitPrompt}` 
        : `NO SPECIFIC OUTFIT PROVIDED (Maintain Image B outfit)`;

    const bgInstruction = backgroundPrompt && backgroundPrompt.trim().length > 0 
        ? `The scene takes place in: "${backgroundPrompt}". You MUST relight the character (Image A) to perfectly blend with this specific environment's shadows and color temperature.` 
        : ``;

    // Stronger prompt to STRICTLY preserve pose and background
    const finalPrompt = `CRITICAL FACE CONSISTENCY REQUIRED: The face MUST 100% perfectly match the PERSON from the FIRST image (Image A) without any alteration to facial features, age, gender, or identity. Under NO circumstances should the face change.

A high-resolution, photorealistic BUST SHOT (chest/waist up portrait). 
Image A = FACE IDENTITY REFERENCE.
Image B = POSTURE AND BACKGROUND REFERENCE.

The BODY, POSTURE, and EXACT BACKGROUND must be identical to the SECOND image provided (Image B). Do NOT change the camera angle, framing, or background elements of Image B. CRITICAL: The framing MUST be a BUST SHOT / CLOSE-UP portrait. 
${bgInstruction} 
${outfitInstruction}. (SEVERE WARNING: When applying this outfit, DO NOT alter the face identity from Image A!). 
Ensure the final image is exactly a ${aspectRatioInstruction} vertical aspect ratio.`;

    const partsParam: any[] = [
        {
            inline_data: {
                data: avatarBase64,
                mime_type: avatarMime
            }
        },
        {
            inline_data: {
                data: bgBase64,
                mime_type: bgMime
            }
        },
        { text: finalPrompt }
    ];

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
        console.error("Gemini API Error (DNA Fusion):", errorText);
        throw new Error(errorText);
    }

    const data = await response.json();
    let fusionOutputUrl = null;

    const parts = data?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
        if (part.inlineData) {
            fusionOutputUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
        } else if (part.inline_data) {
            fusionOutputUrl = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
            break;
        }
    }

    if (!fusionOutputUrl) {
       throw new Error("No image generated from NanoBanana for DNA Fusion");
    }

    return NextResponse.json({
      ok: true,
      fusionOutputUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "dna_fusion_failed";
    return NextResponse.json(
      { error: "fusion_failed", message },
      { status: 502 }
    );
  }
}
