import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** 최신 크롬 계열 UA — 플랫폼 차단 완화 */
export const YTDLP_BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export type YtdlpDownloadResult = {
  buffer: Buffer;
  /** 파일 확장자(소문자, 점 없음) */
  ext: string;
};

/**
 * yt-dlp 바이너리 필요: `brew install yt-dlp` 또는 `YTDLP_PATH` 환경변수.
 * HTTP(S) 프록시: `VIDEO_DOWNLOAD_PROXY` (예: http://host:port)
 */
export async function downloadMediaWithYtDlp(pageUrl: string): Promise<YtdlpDownloadResult> {
  const bin = process.env.YTDLP_PATH?.trim() || "yt-dlp";
  const workDir = await mkdtemp(join(tmpdir(), "dna-ytdlp-"));
  const outTemplate = join(workDir, "media.%(ext)s");

  const args: string[] = [
    "-f",
    "best[ext=mp4]/best",
    "--no-playlist",
    "-o",
    outTemplate,
    "--newline",
    "--no-warnings",
    "--add-header",
    `User-Agent:${YTDLP_BROWSER_UA}`,
    "--add-header",
    "Accept-Language:en-US,en;q=0.9,ko;q=0.8",
  ];

  const proxy = process.env.VIDEO_DOWNLOAD_PROXY?.trim();
  if (proxy) {
    args.push("--proxy", proxy);
  }

  args.push(pageUrl);

  let stderr = "";
  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    child.stderr?.on("data", (c: Buffer) => {
      stderr += c.toString();
    });
    child.on("error", (e) => reject(e));
    child.on("close", (c) => resolve(c ?? 1));
  });

  try {
    if (exitCode !== 0) {
      throw new Error(stderr.trim() || `yt-dlp exited with code ${exitCode}`);
    }

    const files = await readdir(workDir);
    const media = files.find(
      (f) =>
        /\.(mp4|webm|mkv|mov)(\?|$)/i.test(f) ||
        f.endsWith(".mp4") ||
        f.endsWith(".webm"),
    );
    if (!media) {
      throw new Error("yt-dlp did not produce a video file in temp dir");
    }
    const full = join(workDir, media);
    const buffer = await readFile(full);
    const ext = (media.split(".").pop() || "mp4").toLowerCase();
    return { buffer, ext };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

export function isDirectVideoFileUrl(url: string): boolean {
  const t = url.trim();
  if (t.startsWith("/")) return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(t);
  try {
    const u = new URL(t);
    return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u.pathname);
  } catch {
    return false;
  }
}
