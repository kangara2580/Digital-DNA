/**
 * Supabase PostgREST / PostgreSQL `public` 테이블 식별자.
 *
 * 앞으로도 테이블 이름을 snake_case로 바꿀 필요 없습니다. 대시보드 이름과 여기 폴백(또는 env)만 맞으면 됩니다.
 * AI가 “이름을 짧게 바꾸라”고 해도 선택 사항일 뿐, 안 바꿔도 동작에는 문제 없습니다.
 *
 * - **supabase-js `.from(...)`**: URL에는 **테이블 실제 이름**만 넣습니다. SQL용 `"..."` 는 넣지 않습니다.
 * - **SQL Editor**: `pgQuotedIdentifier()` 또는 수동으로 `"이름"` (내부 `"` 는 `""`).
 *
 * 테이블 이름을 바꾼 경우에만 `.env.local` 의 NEXT_PUBLIC_SUPABASE_*_TABLE 을 설정합니다(공백 있으면 값을 따옴표로 감쌈).
 */

function tableFromEnv(envKey: string, fallback: string): string {
  const v =
    typeof process !== "undefined" ? process.env[envKey]?.trim() : undefined;
  return v && v.length > 0 ? v : fallback;
}

/**
 * PostgreSQL 식별자를 SQL용으로 큰따옴표로 감쌉니다. (Supabase SQL Editor, `rpc`로 넘기는 raw SQL 등)
 * `.from()`에는 사용하지 마세요. 이미 전체가 `"..."` 형태면 그대로 둡니다.
 */
export function pgQuotedIdentifier(unquoted: string): string {
  const t = unquoted.trim();
  if (!t) return t;
  if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) {
    return t;
  }
  return `"${t.replace(/"/g, '""')}"`;
}

/** PostgREST `.from(relation)`에 넣을 이름 — 따옴표 없이 DB에 저장된 relation 이름과 동일 */
function T(envKey: string, fallback: string): string {
  return tableFromEnv(envKey, fallback);
}

/** PostgREST `.from()` 에 넣을 테이블 이름 (큰따옴표 문자열 아님) */
export const supabaseTables = {
  cart: T("NEXT_PUBLIC_SUPABASE_CART_TABLE", "user_cart_items"),
  /** supabase/favorites.sql → `public.favorites` (에디터 탭 제목과 혼동 금지) */
  favorites: T("NEXT_PUBLIC_SUPABASE_FAVORITES_TABLE", "favorites"),
  /** supabase/profiles.sql → `public.profiles` */
  profiles: T("NEXT_PUBLIC_SUPABASE_PROFILES_TABLE", "profiles"),
  recentViews: T(
    "NEXT_PUBLIC_SUPABASE_RECENT_VIEWS_TABLE",
    "user_recent_views",
  ),
  demoPurchases: T(
    "NEXT_PUBLIC_SUPABASE_DEMO_PURCHASES_TABLE",
    "user_demo_purchases",
  ),
  customizeDrafts: T(
    "NEXT_PUBLIC_SUPABASE_CUSTOMIZE_DRAFTS_TABLE",
    "user_customize_drafts",
  ),
  dataBlobs: T(
    "NEXT_PUBLIC_SUPABASE_DATA_BLOBS_TABLE",
    "user_data_blobs",
  ),
  sellerUploadDrafts: T(
    "NEXT_PUBLIC_SUPABASE_SELLER_UPLOAD_DRAFTS_TABLE",
    "seller_upload_drafts",
  ),
  /** 스크린샷의 요약 테이블 — 코드에서 참조 시 사용 */
  videoThumbnailStorageSummary: T(
    "NEXT_PUBLIC_SUPABASE_VIDEO_THUMBNAIL_SUMMARY_TABLE",
    "Video Thumbnail Storage Summary",
  ),
} as const;

export function getCartTableName(): string {
  return supabaseTables.cart;
}

export function getProfilesTableName(): string {
  return supabaseTables.profiles;
}
