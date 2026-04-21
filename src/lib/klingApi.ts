import { createHmac, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const KLING_BASE_URL = "https://api-singapore.klingai.com/v1/videos/motion-control";

type KlingTaskRecord = {
  time: string;
  taskId: string;
  externalId: string;
  imageUrl: string;
  prompt: string;
};

type KlingCredentialState =
  | { ok: true; token: string }
  | { ok: false; reason: "missing_keys" };

function base64UrlEncode(raw: string | Buffer): string {
  return Buffer.from(raw).toString("base64url");
}

function buildHs256Jwt(accessKey: string, secretKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { iss: accessKey, exp: now + 1800, nbf: now - 5 };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", secretKey).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}

export function getKlingBearerToken(): KlingCredentialState {
  const legacyToken = process.env.KLING_API_TOKEN?.trim();
  if (legacyToken) return { ok: true, token: legacyToken };

  const accessKey = process.env.KLING_ACCESS_KEY?.trim();
  const secretKey = process.env.KLING_SECRET_KEY?.trim();
  if (!accessKey || !secretKey) {
    return { ok: false, reason: "missing_keys" };
  }
  return { ok: true, token: buildHs256Jwt(accessKey, secretKey) };
}

export function getKlingCreateTaskUrl(): string {
  return KLING_BASE_URL;
}

export function getKlingTaskStatusUrl(taskId: string): string {
  return `${KLING_BASE_URL}/${encodeURIComponent(taskId)}`;
}

export function resolvePublicAssetUrl(inputUrl: string): string {
  if (inputUrl.startsWith("http://") || inputUrl.startsWith("https://")) return inputUrl;
  const appBase =
    process.env.NEXTAUTH_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
  if (!appBase) return inputUrl;
  return `${appBase.replace(/\/$/, "")}${inputUrl.startsWith("/") ? "" : "/"}${inputUrl}`;
}

function taskDbPath(): string {
  return path.join(process.cwd(), "kling_tasks_db.json");
}

export async function readKlingTasksFromDisk(): Promise<KlingTaskRecord[]> {
  try {
    const raw = await readFile(taskDbPath(), "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is KlingTaskRecord =>
        Boolean(
          row &&
            typeof row === "object" &&
            typeof (row as { taskId?: unknown }).taskId === "string",
        ),
    );
  } catch {
    return [];
  }
}

export async function appendKlingTask(task: Omit<KlingTaskRecord, "time">): Promise<void> {
  const current = await readKlingTasksFromDisk();
  current.push({
    time: new Date().toISOString(),
    ...task,
  });
  await writeFile(taskDbPath(), JSON.stringify(current, null, 2), "utf8");
}

export function buildExternalTaskId(): string {
  return `kling_${Date.now()}_${randomUUID().slice(0, 8)}`;
}
