/**
 * 리뷰 테스트용 — 지정 이메일 계정에 임의 영상 "구매 완료" 기록을 넣습니다.
 *
 * 사용:
 *   node --env-file=.env --env-file=.env.local scripts/seed-review-test-purchase.mjs
 *   TEST_BUYER_EMAIL=other@example.com node --env-file=.env --env-file=.env.local scripts/seed-review-test-purchase.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = (process.env.TEST_BUYER_EMAIL ?? "kingah2580@gmail.com").trim().toLowerCase();
const videoIdOverride = process.env.TEST_VIDEO_ID?.trim() || null;

async function resolveBuyerId() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요");
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
  if (!user) throw new Error(`Supabase 사용자 없음: ${email}`);
  return user.id;
}

async function pickVideo() {
  if (videoIdOverride) {
    const v = await prisma.video.findUnique({
      where: { id: videoIdOverride },
      select: { id: true, title: true, sellerId: true, price: true },
    });
    if (!v) throw new Error(`영상 없음: ${videoIdOverride}`);
    return v;
  }
  const v = await prisma.video.findFirst({
    where: { status: "approved" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, sellerId: true, price: true },
  });
  if (!v) throw new Error("DB에 approved 영상이 없습니다.");
  return v;
}

async function main() {
  const buyerId = await resolveBuyerId();
  const video = await pickVideo();

  const existing = await prisma.purchase.findFirst({
    where: { buyerId, videoId: video.id, status: "paid" },
    select: { id: true },
  });

  if (existing) {
    console.log(`[ok] 이미 구매 기록 있음 (${email})`);
    console.log(`     video: ${video.id} — ${video.title}`);
    return;
  }

  await prisma.purchase.create({
    data: {
      buyerId,
      sellerId: video.sellerId,
      videoId: video.id,
      price: video.price,
      status: "paid",
    },
  });

  console.log(`[ok] 테스트 구매 생성 (${email})`);
  console.log(`     buyerId: ${buyerId}`);
  console.log(`     videoId: ${video.id}`);
  console.log(`     title: ${video.title}`);
  console.log("");
  console.log("브라우저에서 새로고침 후 마이페이지 → 리뷰쓰기 에서 확인하세요.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
