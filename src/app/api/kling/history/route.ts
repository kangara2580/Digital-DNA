import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const p = path.join(process.cwd(), "kling_tasks_db.json");
    if (!fs.existsSync(p)) return NextResponse.json([]);
    const db = JSON.parse(fs.readFileSync(p, "utf-8"));
    const validTasks = db.filter((t: any) => t.taskId).reverse().slice(0, 10); // Check latest 10 tasks

    const accessKey = process.env.KLING_ACCESS_KEY;
    const secretKey = process.env.KLING_SECRET_KEY;
    if (!accessKey || !secretKey) return NextResponse.json({ error: "Missing keys" }, { status: 500 });
    
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      { iss: accessKey, exp: now + 1800, nbf: now - 5 },
      secretKey,
      { algorithm: "HS256", header: { alg: "HS256", typ: "JWT" } }
    );

    const checkPromises = validTasks.map(async (task: any) => {
        try {
            const res = await fetch(`https://api-singapore.klingai.com/v1/videos/motion-control/${task.taskId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const d = await res.json();
            return {
                ...task,
                status: d?.data?.task_status,
                videoUrl: d?.data?.task_result?.videos?.[0]?.url || null
            };
        } catch(e) {
            return task;
        }
    });

    const results = await Promise.all(checkPromises);
    return NextResponse.json(results);
  } catch(e) {
    return NextResponse.json([]);
  }
}

