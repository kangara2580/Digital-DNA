import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const TIKTOK_SESSION_COOKIE = "tiktok_session";
export const TIKTOK_OAUTH_STATE_COOKIE = "tiktok_oauth_state";

export type TikTokSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope?: string;
  openId?: string;
  tokenType?: string;
};

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
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
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
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function setTikTokSessionCookie(res: NextResponse, session: TikTokSession) {
  const payload = encryptPayload(JSON.stringify(session));
  const ttl = Math.max(60, session.expiresAt - nowSec());
  res.cookies.set({
    name: TIKTOK_SESSION_COOKIE,
    value: payload,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
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
    if (!parsed.accessToken || typeof parsed.accessToken !== "string") return null;
    if (!parsed.expiresAt || typeof parsed.expiresAt !== "number") return null;
    return {
      accessToken: parsed.accessToken,
      refreshToken:
        typeof parsed.refreshToken === "string" ? parsed.refreshToken : undefined,
      expiresAt: parsed.expiresAt,
      scope: typeof parsed.scope === "string" ? parsed.scope : undefined,
      openId: typeof parsed.openId === "string" ? parsed.openId : undefined,
      tokenType: typeof parsed.tokenType === "string" ? parsed.tokenType : undefined,
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
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
