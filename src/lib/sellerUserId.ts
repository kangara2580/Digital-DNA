/** Supabase `auth.users` id — 클라이언트·서버 공용 (Prisma 등 서버 의존 없음) */
export function isProbablySellerUserId(key: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
}
