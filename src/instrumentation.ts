/**
 * 서버(Node) 기동 시 한 번 실행 — 외부 HTTPS(Supabase 등)로의 fetch가
 * IPv6 우선 해석으로 간헐 실패하는 환경에서 IPv4를 먼저 쓰도록 합니다.
 * @see https://nodejs.org/api/dns.html#dnssetdefaultresultorderorder
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
