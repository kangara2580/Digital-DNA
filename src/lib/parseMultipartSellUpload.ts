import busboy from "busboy";
import { Readable } from "node:stream";

/** 판매 업로드 폼 — 미들웨어 + request.formData() 조합에서 큰 본문이 잘릴 때를 피하기 위한 스트리밍 파서 */
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

export type ParsedSellUpload = {
  fields: Record<string, string>;
  video: { buffer: Buffer; filename: string; mime: string } | null;
};

export class MultipartParseError extends Error {
  constructor(
    message: string,
    readonly code:
      | "bad_content_type"
      | "empty_body"
      | "parse_failed"
      | "file_too_large",
  ) {
    super(message);
    this.name = "MultipartParseError";
  }
}

export function parseSellUploadMultipart(request: Request): Promise<ParsedSellUpload> {
  const ct = request.headers.get("content-type") || "";
  if (!ct.toLowerCase().includes("multipart/form-data")) {
    return Promise.reject(
      new MultipartParseError("multipart/form-data가 아닙니다.", "bad_content_type"),
    );
  }

  const body = request.body;
  if (!body) {
    return Promise.reject(new MultipartParseError("요청 본문이 비어 있습니다.", "empty_body"));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (result: ParsedSellUpload) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    const bb = busboy({
      headers: { "content-type": ct },
      limits: {
        fileSize: MAX_VIDEO_BYTES,
        fieldSize: 2 * 1024 * 1024,
      },
    });

    const fields: Record<string, string> = {};
    let video: ParsedSellUpload["video"] = null;

    bb.on("file", (name, file, info) => {
      if (name !== "video") {
        file.resume();
        return;
      }
      const chunks: Buffer[] = [];
      let truncated = false;
      file.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      file.on("limit", () => {
        truncated = true;
      });
      file.on("close", () => {
        if (truncated) {
          fail(new MultipartParseError("동영상 파일이 너무 큽니다.", "file_too_large"));
          return;
        }
        video = {
          buffer: Buffer.concat(chunks),
          filename: info.filename || "clip.mp4",
          mime: info.mimeType || "application/octet-stream",
        };
      });
    });

    bb.on("field", (name, val) => {
      fields[name] = val;
    });

    bb.on("error", (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      fail(new MultipartParseError(msg, "parse_failed"));
    });

    bb.on("close", () => {
      finish({ fields, video });
    });

    try {
      Readable.fromWeb(body as import("stream/web").ReadableStream).pipe(bb);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      fail(new MultipartParseError(msg, "parse_failed"));
    }
  });
}
