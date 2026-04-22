import crypto from "crypto";

export type SmsProofContext = "signup" | "forgot-password" | "find-email";

type Payload = {
  phone: string;
  context: SmsProofContext;
  exp: number;
};

function b64urlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlDecode(value: string): string {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(base64, "base64").toString("utf8");
}

function secret(): string {
  const s =
    process.env.SMS_VERIFICATION_SECRET?.trim() ||
    process.env.TIKTOK_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";
  return s;
}

export function createSmsProofToken(input: {
  phone: string;
  context: SmsProofContext;
  ttlMs?: number;
}): string | null {
  const s = secret();
  if (!s) return null;
  const payload: Payload = {
    phone: input.phone,
    context: input.context,
    exp: Date.now() + (input.ttlMs ?? 10 * 60 * 1000),
  };
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = b64urlEncode(
    crypto.createHmac("sha256", s).update(body).digest(),
  );
  return `${body}.${sig}`;
}

export function verifySmsProofToken(input: {
  token: string;
  context: SmsProofContext;
  phone: string;
}): { ok: true } | { ok: false; reason: string } {
  const s = secret();
  if (!s) return { ok: false, reason: "secret_unconfigured" };
  const token = input.token.trim();
  if (!token.includes(".")) return { ok: false, reason: "invalid_format" };
  const [body, sig] = token.split(".", 2);
  if (!body || !sig) return { ok: false, reason: "invalid_format" };
  const expected = b64urlEncode(
    crypto.createHmac("sha256", s).update(body).digest(),
  );
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { ok: false, reason: "invalid_signature" };
  }
  let parsed: Payload;
  try {
    parsed = JSON.parse(b64urlDecode(body)) as Payload;
  } catch {
    return { ok: false, reason: "invalid_payload" };
  }
  if (!parsed?.phone || !parsed?.context || !parsed?.exp) {
    return { ok: false, reason: "invalid_payload" };
  }
  if (parsed.exp < Date.now()) return { ok: false, reason: "expired" };
  if (parsed.context !== input.context) return { ok: false, reason: "context_mismatch" };
  if (parsed.phone !== input.phone) return { ok: false, reason: "phone_mismatch" };
  return { ok: true };
}
