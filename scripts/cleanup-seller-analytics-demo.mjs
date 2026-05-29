/**
 * 판매 분석 테스트 시드 되돌리기 — 가짜 구매·좋아요·영상 집계 수치 정리
 *
 * 사용:
 *   node --env-file=.env --env-file=.env.local scripts/cleanup-seller-analytics-demo.mjs
 *   SELLER_NICKNAME=천국복숭아 node --env-file=.env --env-file=.env.local scripts/cleanup-seller-analytics-demo.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sellerNickname = (process.env.SELLER_NICKNAME ?? "천국복숭아").trim();
const sellerEmailOverride = process.env.SELLER_EMAIL?.trim().toLowerCase() || null;

const BUYER_PREFIX = "seed-analytics-buyer-";
const LIKER_EMAIL_PREFIX = "seed-analytics-liker-";

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function resolveSeller(sb) {
  if (sellerEmailOverride) {
    const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((u) => (u.email ?? "").toLowerCase() === sellerEmailOverride);
    if (!user) throw new Error(`Supabase 사용자 없음: ${sellerEmailOverride}`);
    return { id: user.id, email: user.email, nickname: sellerNickname };
  }

  const { data: profileRows, error: profileErr } = await sb
    .from("profiles")
    .select("user_id, nickname, email")
    .or(`nickname.eq.${sellerNickname},nickname.ilike.%${sellerNickname}%`);
  if (!profileErr && profileRows?.length) {
    const row =
      profileRows.find((r) => r.nickname === sellerNickname) ?? profileRows[0];
    return {
      id: row.user_id,
      email: row.email,
      nickname: row.nickname ?? sellerNickname,
    };
  }

  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const needle = sellerNickname.toLowerCase();
  const byMeta = data.users.find((u) => {
    const nick =
      typeof u.user_metadata?.nickname === "string" ? u.user_metadata.nickname : "";
    return nick.trim().toLowerCase() === needle;
  });
  if (byMeta) {
    return { id: byMeta.id, email: byMeta.email, nickname: sellerNickname };
  }

  throw new Error(`판매자를 찾지 못했습니다: "${sellerNickname}"`);
}

async function main() {
  const sb = createSupabaseAdmin();
  const seller = await resolveSeller(sb);
  const favoritesTable =
    process.env.NEXT_PUBLIC_SUPABASE_FAVORITES_TABLE?.trim() || "favorites";

  console.log(`[seller] ${seller.nickname} (${seller.email ?? seller.id})`);

  const videos = await prisma.video.findMany({
    where: { sellerId: seller.id },
    select: { id: true, title: true },
  });
  const videoIds = videos.map((v) => v.id);

  const deletedPurchases = await prisma.purchase.deleteMany({
    where: {
      sellerId: seller.id,
      buyerId: { startsWith: BUYER_PREFIX },
    },
  });
  console.log(`[ok] 테스트 구매 ${deletedPurchases.count}건 삭제`);

  if (videoIds.length > 0) {
    const { error: likeDelErr, count: likeCount } = await sb
      .from(favoritesTable)
      .delete({ count: "exact" })
      .eq("kind", "like")
      .in("video_id", videoIds);
    if (likeDelErr) {
      console.warn("[warn] 좋아요 삭제 실패:", likeDelErr.message);
    } else {
      console.log(`[ok] 해당 영상 좋아요 ${likeCount ?? "?"}건 삭제 (시드 구간 전부)`);
    }
  }

  const { data: authList, error: authListErr } = await sb.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (authListErr) throw authListErr;

  const seedLikers = authList.users.filter((u) =>
    (u.email ?? "").toLowerCase().startsWith(LIKER_EMAIL_PREFIX),
  );
  let removedLikers = 0;
  for (const u of seedLikers) {
    const { error } = await sb.auth.admin.deleteUser(u.id);
    if (!error) removedLikers += 1;
  }
  if (seedLikers.length > 0) {
    console.log(`[ok] 테스트 좋아요 계정 ${removedLikers}/${seedLikers.length}개 삭제`);
  }

  for (const v of videos) {
    const realSales = await prisma.purchase.count({
      where: { videoId: v.id, sellerId: seller.id, status: "paid" },
    });
    await prisma.video.update({
      where: { id: v.id },
      data: {
        salesCount: realSales,
        views: 0,
      },
    });
  }

  const summary = await Promise.all(
    videos.map(async (v) => {
      const sales = await prisma.purchase.count({
        where: { videoId: v.id, status: "paid" },
      });
      const row = await prisma.video.findUnique({
        where: { id: v.id },
        select: { salesCount: true, views: true },
      });
      return { title: v.title, sales, views: row?.views ?? 0, salesCount: row?.salesCount ?? 0 };
    }),
  );

  console.log("");
  console.log("[ok] 영상 집계를 실제 구매 기준으로 맞춤");
  for (const s of summary) {
    console.log(`     · ${s.title}: 판매 ${s.salesCount}건, 조회 ${s.views}`);
  }
  console.log("");
  console.log("판매 분석 페이지를 새로고침하면 테스트 수치는 사라집니다.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
