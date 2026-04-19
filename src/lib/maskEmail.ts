/** 로그인 아이디(이메일) 힌트용 — 전체 주소는 노출하지 않음 */
export function maskEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at < 1) return "***";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!domain) return "***";
  const head = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${head}***@${domain}`;
}
