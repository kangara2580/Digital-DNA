import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { imageUrl, videoUrl, prompt, characterOrientation } = await req.json();

    const accessKey = process.env.KLING_ACCESS_KEY;
    const secretKey = process.env.KLING_SECRET_KEY;
    // Fallback if they defined KLING_API_TOKEN manually
    const legacyToken = process.env.KLING_API_TOKEN;

    if (!legacyToken && (!accessKey || !secretKey)) {
      return NextResponse.json(
        { error: "KLING_ACCESS_KEY and KLING_SECRET_KEY are not configured in .env.local" },
        { status: 500 }
      );
    }

    let token = legacyToken;
    if (!token && accessKey && secretKey) {
      const now = Math.floor(Date.now() / 1000);
      token = jwt.sign(
        {
          iss: accessKey,
          exp: now + 1800,
          nbf: now - 5
        },
        secretKey,
        {
          algorithm: "HS256",
          header: { alg: "HS256", typ: "JWT" }
        }
      );
    }

    // Process base64 image if needed
    let finalImageUrl = imageUrl;
    if (finalImageUrl && finalImageUrl.startsWith("data:image/")) {
        const matches = finalImageUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
            const ext = matches[1];
            const base64Data = matches[2];
            const fileName = `kling_upload_${Date.now()}.${ext}`;
            const uploadDir = path.join(process.cwd(), "public", "uploads");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
            finalImageUrl = `/uploads/${fileName}`;
        }
    }

    // Kling 서버가 다운로드할 수 있도록 로컬 상대 경로를 절대 경로(터널 URL 등)로 변환합니다.
    // 로컬 경로 파일일 경우 터널/퍼블릭 URL을 붙여줍니다. 
    // 나중에 Supabase/S3 주소로 넘어오게 되면 이 로직은 http를 그대로 통과시킵니다.
    const baseUrl = process.env.NEXTAUTH_URL || "https://1d45b42ed2109d.lhr.life";
    const resolveUrl = (u: string) => {
      if (!u || u.startsWith("http")) return u;
      return `${baseUrl.replace(/\/$/, "")}${u.startsWith("/") ? "" : "/"}${u}`;
    };

    const payload = {
      model_name: "kling-v3",
      image_url: resolveUrl(finalImageUrl),
      prompt: prompt || "",
      negative_prompt: "tiktok watermark, logos, text, typography, UI elements, user interface, icons, deformed face, bad anatomy, missing fingers, extra limbs, blurry, extra legs, bad face, disfigured, mutated, poor lighting",
      video_url: resolveUrl(videoUrl),
      keep_original_sound: "yes",
      character_orientation: characterOrientation || "image",
      mode: "pro",
      callback_url: "",
      external_task_id: `kling_${Date.now()}`
    };

    console.log("Kling Payload:", payload);

    const response = await fetch("https://api-singapore.klingai.com/v1/videos/motion-control", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    // ⭐ SAFETY NET: Log the task ID assigned by Kling to the console
    console.log("Kling API Response:", JSON.stringify(data, null, 2));

    // ⭐ SAFETY NET: Save to a local makeshift database file to prevent volatility
    try {
        const fs = require('fs');
        const path = require('path');
        const dbPath = path.join(process.cwd(), 'kling_tasks_db.json');
        let db = [];
        if (fs.existsSync(dbPath)) {
            db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        }
        db.push({
            time: new Date().toISOString(),
            taskId: data?.data?.task_id,
            externalId: payload.external_task_id,
            imageUrl: finalImageUrl,
            prompt: payload.prompt
        });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    } catch (e) {
        console.error("Failed to save to local task DB:", e);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

