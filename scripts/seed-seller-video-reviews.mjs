/**
 * 판매자 영상에 테스트 구매평 6개를 넣습니다 (리뷰 관리 / 상세 노출 확인용).
 *
 * 사용:
 *   node --env-file=.env --env-file=.env.local scripts/seed-seller-video-reviews.mjs
 *   SELLER_EMAIL=you@example.com TEST_VIDEO_ID=cmp... node --env-file=.env --env-file=.env.local scripts/seed-seller-video-reviews.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sellerEmail = (process.env.SELLER_EMAIL ?? "kingah2580@gmail.com").trim().toLowerCase();
const videoIdOverride = process.env.TEST_VIDEO_ID?.trim() || null;
const videoTitleHint = process.env.TEST_VIDEO_TITLE?.trim() || null;

const REVIEW_SEED_PREFIX = "seed-review-buyer-";

const SAMPLE_REVIEWS = [
  {
    nickname: "쇼핑러버",
    rating: 5,
    body: "영상 퀄리티가 생각보다 훨씬 좋아요. 바로 쇼츠에 올렸는데 반응도 괜찮습니다.",
    sellerReply: "소중한 리뷰 감사합니다! 다음 작품도 기대해 주세요.",
    daysAgo: 2,
  },
  {
    nickname: "브이로그지니",
    rating: 4,
    body: "전체적으로 만족해요. 컷 전환이 자연스럽고 음악 톤도 잘 맞습니다.",
    sellerReply: null,
    daysAgo: 5,
  },
  {
    nickname: "contact",
    rating: 5,
    body:
      "받자마자 테스트 쇼츠에 바로 붙여봤는데 반응이 생각보다 훨씬 좋았어요.\n" +
      "컷 타이밍이 자연스럽고 자막 톤도 통일돼 있어서 팀 공유용으로도 손색이 없습니다.\n" +
      "다음에도 비슷한 무드로 부탁드릴게요.",
    sellerReply: null,
    daysAgo: 7,
  },
  {
    nickname: "재구매각",
    rating: 3,
    body: "나쁘지 않은데 기대보다는 조금 아쉬웠어요. 길이만 조금 짧았으면 더 좋겠습니다.",
    sellerReply: null,
    daysAgo: 9,
  },
  {
    nickname: "데모유저",
    rating: 2,
    body: "테스트 구매 후 확인했습니다. 톤은 괜찮은데 자막 위치가 살짝 어색했어요.",
    sellerReply: null,
    daysAgo: 11,
  },
  {
    nickname: "만족구매",
    rating: 5,
    body: "가성비 좋고 바로 활용 가능합니다. 재구매 의사 있습니다.",
    sellerReply: null,
    daysAgo: 14,
  },
];

async function resolveSellerId() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요");
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((u) => (u.email ?? "").toLowerCase() === sellerEmail);
  if (!user) throw new Error(`Supabase 판매자 없음: ${sellerEmail}`);
  return user.id;
}

async function pickVideo(sellerId) {
  if (videoIdOverride) {
    const v = await prisma.video.findUnique({
      where: { id: videoIdOverride },
      select: { id: true, title: true, sellerId: true },
    });
    if (!v) throw new Error(`영상 없음: ${videoIdOverride}`);
    if (v.sellerId !== sellerId) {
      throw new Error(`영상 sellerId 불일치 (기대 ${sellerId}, 실제 ${v.sellerId})`);
    }
    return v;
  }

  const videos = await prisma.video.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, sellerId: true, createdAt: true },
  });
  if (videos.length === 0) throw new Error("판매자 업로드 영상이 없습니다.");

  if (videoTitleHint) {
    const hit = videos.find((v) => v.title.includes(videoTitleHint));
    if (hit) return hit;
  }

  return videos[0];
}

function daysAgoDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  const sellerId = await resolveSellerId();
  const video = await pickVideo(sellerId);

  await prisma.videoReview.deleteMany({
    where: {
      videoId: video.id,
      userId: { startsWith: REVIEW_SEED_PREFIX },
    },
  });

  const now = new Date();
  for (let i = 0; i < SAMPLE_REVIEWS.length; i++) {
    const sample = SAMPLE_REVIEWS[i];
    const createdAt = daysAgoDate(sample.daysAgo);
    const userId = `${REVIEW_SEED_PREFIX}${i}-${video.id.slice(0, 8)}`;
    const sellerReplyAt = sample.sellerReply ? createdAt : null;

    await prisma.videoReview.create({
      data: {
        videoId: video.id,
        userId,
        nickname: sample.nickname,
        rating: sample.rating,
        body: sample.body,
        createdAt,
        updatedAt: createdAt,
        sellerReply: sample.sellerReply,
        sellerReplyAt,
        sellerReplyUpdatedAt: sample.sellerReply ? createdAt : null,
        isReported: false,
      },
    });
  }

  const count = await prisma.videoReview.count({ where: { videoId: video.id } });
  const sellerCount = await prisma.videoReview.count({
    where: { videoId: { in: (await prisma.video.findMany({ where: { sellerId }, select: { id: true } })).map((v) => v.id) } },
  });

  console.log(`[ok] 테스트 리뷰 ${SAMPLE_REVIEWS.length}개 생성`);
  console.log(`     판매자: ${sellerEmail} (${sellerId})`);
  console.log(`     영상: ${video.id} — ${video.title}`);
  console.log(`     이 영상 리뷰 총 ${count}개 · 판매자 전체 리뷰 ${sellerCount}개`);
  console.log("");
  console.log("확인: /seller/reviews · /video/" + encodeURIComponent(video.id));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
