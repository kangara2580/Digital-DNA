import { Resend } from "resend";

let _client: Resend | null = null;

/**
 * Returns the Resend client singleton, or null if RESEND_API_KEY is not set.
 * Graceful degradation: callers should check for null and skip sending.
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  if (!_client) {
    _client = new Resend(apiKey);
  }
  return _client;
}

/**
 * Default "from" address. Resend requires a verified domain.
 * Falls back to Resend's onboarding address if env is not set.
 */
export function getFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() || "ARA <onboarding@resend.dev>"
  );
}
