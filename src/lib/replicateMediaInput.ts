import { readFile } from "node:fs/promises";
import path from "node:path";

const DATA_URL_RE = /^data:([^;]+);base64,([\s\S]+)$/i;

function isHttpsPublicUrl(url: string): boolean {
  return /^https:\/\//i.test(url.trim());
}

function isLocalhostUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function dataUrlToBuffer(dataUrl: string): Buffer {
  const m = DATA_URL_RE.exec(dataUrl.trim());
  if (!m) {
    throw new Error("invalid_data_url");
  }
  return Buffer.from(m[2], "base64");
}

/**
 * Replicate는 클라우드에서 입력 미디어를 직접 받아야 합니다.
 * - `https://...` 공개 URL: 그대로 전달
 * - `data:image/...;base64,...`: Buffer로 디코드 (SDK가 업로드)
 * - `/videos/clip.mp4`, `http://localhost:3000/...` 등 로컬 자산: `public/`에서 읽어 Buffer로 전달
 */
export async function resolveMediaInputForReplicate(
  raw: string,
  label: string,
): Promise<string | Buffer> {
  const t = raw.trim();
  if (!t) {
    throw new Error(`${label}_empty`);
  }

  if (t.startsWith("data:")) {
    return dataUrlToBuffer(t);
  }

  if (isHttpsPublicUrl(t) && !isLocalhostUrl(t)) {
    return t;
  }

  let pathname = t;
  if (t.startsWith("http://") || t.startsWith("https://")) {
    pathname = new URL(t).pathname || "/";
  }

  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  const rel = pathname.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!rel || rel.includes("..")) {
    throw new Error(`${label}_invalid_path`);
  }

  const abs = path.normalize(path.join(process.cwd(), "public", rel));
  const pubRoot = path.normalize(path.join(process.cwd(), "public"));
  if (!abs.startsWith(pubRoot + path.sep) && abs !== pubRoot) {
    throw new Error(`${label}_path_outside_public`);
  }

  try {
    return await readFile(abs);
  } catch {
    throw new Error(`${label}_file_not_found`);
  }
}
