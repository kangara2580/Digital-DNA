import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
