/**
 * 서버(Node) 기동 시 한 번 실행 — 외부 HTTPS(Supabase 등)로의 fetch가
 * IPv6 우선 해석으로 간헐 실패하는 환경에서 IPv4를 먼저 쓰도록 합니다.
 * @see https://nodejs.org/api/dns.html#dnssetdefaultresultorderorder
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
      enabled: Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN),
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
      environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
    });
    dns.setDefaultResultOrder("ipv4first");
    return;
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
      enabled: Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN),
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
      environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
    });
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
