function decodeBase64Url(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + "=".repeat(padLen);
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

/**
 * 개발 환경 오프라인 폴백: JWT 서명 검증 없이 payload.sub 를 읽습니다.
 * 프로덕션에서는 절대 사용하지 않습니다.
 */
export function decodeDevUserIdFromJwt(token: string): string | null {
  if (process.env.NODE_ENV === "production") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payloadText = decodeBase64Url(parts[1]);
  if (!payloadText) return null;
  try {
    const payload = JSON.parse(payloadText) as { sub?: unknown };
    return typeof payload.sub === "string" && payload.sub.length > 0
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}
