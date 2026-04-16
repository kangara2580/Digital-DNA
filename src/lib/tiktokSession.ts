import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const TIKTOK_SESSION_COOKIE = "tiktok_session";
export const TIKTOK_OAUTH_STATE_COOKIE = "tiktok_oauth_state";

export type TikTokSession = {
  /** access token은 길이가 길어 쿠키 4KB 제한을 넘길 수 있어 선택적으로 저장 */
  accessToken?: string;
  /** refresh token은 장기 세션 유지용(선택) — 너무 길면 쿠키 저장이 실패할 수 있음 */
  refreshToken?: string;
  /** access token 만료 시각(초). accessToken을 저장하지 않으면 즉시 refresh 유도 */
  expiresAt: number;
};

function shouldUseSecureCookies(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function cookieSameSite(): "lax" | "none" {
  return shouldUseSecureCookies() ? "none" : "lax";
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

function getSessionSecret(): string {
  const raw =
    process.env.TIKTOK_SESSION_SECRET?.trim() ||
    process.env.TIKTOK_CLIENT_SECRET?.trim() ||
    "";
  if (!raw) {
    throw new Error("missing_tiktok_session_secret");
  }
  return raw;
}

function getKey(): Buffer {
  return createHash("sha256").update(getSessionSecret()).digest();
}

function encodePart(buf: Buffer): string {
  return buf.toString("base64url");
}

function decodePart(raw: string): Buffer {
  return Buffer.from(raw, "base64url");
}

function encryptPayload(payload: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${encodePart(iv)}.${encodePart(tag)}.${encodePart(encrypted)}`;
}

function assertCookieSizeSafe(value: string) {
  // 브라우저별 쿠키 제한(대략 4KB) 대비 여유값.
  if (value.length > 3600) {
    throw new Error("tiktok_session_cookie_too_large");
  }
}

function decryptPayload(value: string): string | null {
  try {
    const [ivRaw, tagRaw, dataRaw] = value.split(".");
    if (!ivRaw || !tagRaw || !dataRaw) return null;
    const key = getKey();
    const iv = decodePart(ivRaw);
    const tag = decodePart(tagRaw);
    const encrypted = decodePart(dataRaw);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return out.toString("utf8");
  } catch {
    return null;
  }
}

export function createOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

export function setOAuthStateCookie(res: NextResponse, state: string) {
  res.cookies.set({
    name: TIKTOK_OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: cookieSameSite(),
    path: "/",
    maxAge: 10 * 60,
  });
}

export function readOAuthState(req: NextRequest): string | null {
  return req.cookies.get(TIKTOK_OAUTH_STATE_COOKIE)?.value ?? null;
}

export function clearOAuthStateCookie(res: NextResponse) {
  res.cookies.set({
    name: TIKTOK_OAUTH_STATE_COOKIE,
    value: "",
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: cookieSameSite(),
    path: "/",
    maxAge: 0,
  });
}

export function setTikTokSessionCookie(res: NextResponse, session: TikTokSession) {
  const minimal: TikTokSession = {
    expiresAt: session.expiresAt,
    ...(session.accessToken ? { accessToken: session.accessToken } : null),
    ...(session.refreshToken ? { refreshToken: session.refreshToken } : null),
  };
  const payload = encryptPayload(JSON.stringify(minimal));
  assertCookieSizeSafe(payload);
  const ttl = Math.max(60, minimal.expiresAt - nowSec());
  res.cookies.set({
    name: TIKTOK_SESSION_COOKIE,
    value: payload,
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: cookieSameSite(),
    path: "/",
    maxAge: ttl,
  });
}

export function readTikTokSession(req: NextRequest): TikTokSession | null {
  const raw = req.cookies.get(TIKTOK_SESSION_COOKIE)?.value;
  if (!raw) return null;
  const json = decryptPayload(raw);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Partial<TikTokSession>;
    if (!parsed.expiresAt || typeof parsed.expiresAt !== "number") return null;
    const hasAccess = typeof parsed.accessToken === "string" && parsed.accessToken.trim().length > 0;
    const hasRefresh = typeof parsed.refreshToken === "string" && parsed.refreshToken.trim().length > 0;
    if (!hasAccess && !hasRefresh) return null;
    return {
      accessToken:
        typeof parsed.accessToken === "string" ? parsed.accessToken : undefined,
      refreshToken: parsed.refreshToken,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function clearTikTokSessionCookie(res: NextResponse) {
  res.cookies.set({
    name: TIKTOK_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: cookieSameSite(),
    path: "/",
    maxAge: 0,
  });
}

