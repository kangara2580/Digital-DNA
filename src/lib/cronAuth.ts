/**
 * 프로덕션에서는 CRON_SECRET과 Authorization: Bearer … 일치 시에만 허용.
 * 로컬 개발에서는 secret 미설정 시 허용(수동 호출 편의).
 */
export function isAuthorizedCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  if (req.headers.get("x-cron-secret") === secret) return true;
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;
  return false;
}
