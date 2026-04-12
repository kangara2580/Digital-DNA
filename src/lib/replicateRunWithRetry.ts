/**
 * Replicate SDK가 던지는 ApiError( response.status )를 다룹니다.
 */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getReplicateErrorStatus(err: unknown): number | null {
  if (typeof err !== "object" || err === null) return null;
  const r = (err as { response?: { status?: number } }).response;
  return typeof r?.status === "number" ? r.status : null;
}

/** 에러 문자열에 포함된 JSON에서 retry_after(초) 추출 */
export function parseRetryAfterSeconds(message: string): number | null {
  const j = /"retry_after"\s*:\s*(\d+)/.exec(message);
  if (j) {
    return Math.min(120, Math.max(1, parseInt(j[1], 10)));
  }
  const t = /resets in ~(\d+)s/i.exec(message);
  if (t) {
    return Math.min(120, Math.max(1, parseInt(t[1], 10)));
  }
  return null;
}

/**
 * 429 Too Many Requests 시 한 번만: retry_after(+여유) 대기 후 재실행.
 */
export async function runReplicateWith429Retry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const st = getReplicateErrorStatus(e);
    const msg = e instanceof Error ? e.message : String(e);
    const looks429 =
      st === 429 ||
      msg.includes("429") ||
      msg.includes("Too Many Requests") ||
      msg.includes("throttled");
    if (!looks429) throw e;
    const sec = parseRetryAfterSeconds(msg) ?? 8;
    await sleep(sec * 1000 + 300);
    return await fn();
  }
}

/** UI에 그대로 노출되는 사용자 안내(코드·URL 없음) */
export const REPLICATE_RATE_LIMIT_USER_MESSAGE_KO =
  "현재 생성 요청이 많습니다. 잠시 후 다시 시도해 주세요.";
