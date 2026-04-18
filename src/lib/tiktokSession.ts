import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
} from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const TIKTOK_SESSION_COOKIE = "tiktok_sid";
export const TIKTOK_OAUTH_STATE_COOKIE = "tiktok_oauth_state";
/** PKCE code_verifier (authorize → token 교환까지 보관) */
export const TIKTOK_OAUTH_PKCE_COOKIE = "tiktok_oauth_pkce";

const PKCE_VERIFIER_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

/**
 * TikTok Login Kit: PKCE S256 이되 code_challenge는 RFC7636의 Base64URL이 아니라
 * SHA256(code_verifier)의 **hex** 문자열입니다.
 * @see https://developers.tiktok.com/doc/login-kit-desktop/
 */
export function createTikTokPkcePair(): {
  codeVerifier: string;
  codeChallenge: string;
} {
  const len = 64;
  let codeVerifier = "";
  for (let i = 0; i < len; i++) {
    codeVerifier += PKCE_VERIFIER_CHARS[randomInt(0, PKCE_VERIFIER_CHARS.length)]!;
  }
  const codeChallenge = createHash("sha256")
    .update(codeVerifier, "utf8")
    .digest("hex");
  return { codeVerifier, codeChallenge };
}

export type TikTokSession = {
  /** access token은 길이가 길어 쿠키 4KB 제한을 넘길 수 있어 선택적으로 저장 */
  accessToken?: string;
  /** refresh token은 장기 세션 유지용(선택) — 너무 길면 쿠키 저장이 실패할 수 있음 */
  refreshToken?: string;
  /** access token 만료 시각(초). accessToken을 저장하지 않으면 즉시 refresh 유도 */
  expiresAt: number;
};

export function createTikTokSessionId(): string {
  return randomBytes(24).toString("base64url");
}

function shouldUseSecureCookies(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function cookieSameSite(): "lax" {
  return "lax";
}

function cookieDomain(): string | undefined {
  const d = process.env.TIKTOK_COOKIE_DOMAIN?.trim();
  if (!d) return undefined;
  if (d.includes(":")) return undefined;
  if (d.includes("/")) return undefined;
  const lowered = d.toLowerCase();
  if (lowered === "vercel.app") return undefined;
  if (lowered.endsWith(".vercel.app")) return undefined;
  return d;
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

type OAuthStatePayload = {
  v: 1;
  ts: number;
  nonce: string;
  pkceVerifier?: string;
};

export function createOAuthState(options?: { pkceVerifier?: string }): string {
  const payload: OAuthStatePayload = {
    v: 1,
    ts: Date.now(),
    nonce: randomBytes(16).toString("base64url"),
  };
  const pkceVerifier = options?.pkceVerifier?.trim();
  if (pkceVerifier) payload.pkceVerifier = pkceVerifier;
  const payloadRaw = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", getSessionSecret()).update(payloadRaw).digest("base64url");
  return `${payloadRaw}.${sig}`;
}

export function readOAuthStatePayload(state: string): OAuthStatePayload | null {
  const [payloadRaw, sig] = state.split(".");
  if (!payloadRaw || !sig) return null;
  const expected = createHmac("sha256", getSessionSecret()).update(payloadRaw).digest("base64url");
  if (expected !== sig) return null;
  try {
    const json = Buffer.from(payloadRaw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as OAuthStatePayload;
    const ts = typeof parsed.ts === "number" ? parsed.ts : 0;
    if (!ts) return null;
    const ageMs = Date.now() - ts;
    if (!(ageMs >= 0 && ageMs <= 10 * 60 * 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function verifyOAuthState(state: string): boolean {
  return Boolean(readOAuthStatePayload(state));
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

export function setPkceVerifierCookie(res: NextResponse, codeVerifier: string) {
  assertCookieSizeSafe(codeVerifier);
  res.cookies.set({
    name: TIKTOK_OAUTH_PKCE_COOKIE,
    value: codeVerifier,
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: cookieSameSite(),
    path: "/",
    maxAge: 10 * 60,
  });
}

export function readPkceVerifier(req: NextRequest): string | null {
  return req.cookies.get(TIKTOK_OAUTH_PKCE_COOKIE)?.value ?? null;
}

export function clearPkceVerifierCookie(res: NextResponse) {
  res.cookies.set({
    name: TIKTOK_OAUTH_PKCE_COOKIE,
    value: "",
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: cookieSameSite(),
    path: "/",
    maxAge: 0,
  });
}

export function setTikTokSessionCookie(res: NextResponse, session: TikTokSession) {
  void session;
  throw new Error("deprecated_use_setTikTokSidCookie");
}

export function setTikTokSidCookie(res: NextResponse, sessionId: string) {
  res.cookies.set({
    name: TIKTOK_SESSION_COOKIE,
    value: sessionId,
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: cookieSameSite(),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function readTikTokSession(req: NextRequest): TikTokSession | null {
  void req;
  throw new Error("deprecated_use_readTikTokSid");
}

export function readTikTokSid(req: NextRequest): string | null {
  return req.cookies.get(TIKTOK_SESSION_COOKIE)?.value ?? null;
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

