/**
 * 판매 분석 테스트 — 지정 판매자에 최대 365일치 구매·수익 시드 (고/중/저 구간).
 *
 * 사용:
 *   node --env-file=.env --env-file=.env.local scripts/seed-seller-analytics-demo.mjs
 *   SELLER_NICKNAME=천국복숭아 node --env-file=.env --env-file=.env.local scripts/seed-seller-analytics-demo.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sellerNickname = (process.env.SELLER_NICKNAME ?? "천국복숭아").trim();
const sellerEmailOverride = process.env.SELLER_EMAIL?.trim().toLowerCase() || null;
const HISTORY_DAYS = Math.min(
  365,
  Math.max(30, Number(process.env.SEED_HISTORY_DAYS ?? 365) || 365),
);

const BUYER_PREFIX = "seed-analytics-buyer-";
const PURCHASE_NOTE = "seed-seller-analytics-demo";

/** 기간 표 조회수 = 판매 건수 × 95 (sellerAnalyticsFromDb) */
const VIEWS_PER_SALE_PERIOD = 95;
/** Video.views 누적 = 판매 × 120 */
const VIEWS_PER_SALE_LIFETIME = 120;

function utcDayStart(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysAgoDate(daysAgo, hour = 14) {
  const d = utcDayStart(new Date());
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, 30, 0, 0);
  return d;
}

function salesCountForDay(daysAgo) {
  if (daysAgo <= 28) {
    return 5 + (daysAgo % 4);
  }
  if (daysAgo <= 90) {
    return daysAgo % 4 === 0 ? 1 : daysAgo % 7 === 0 ? 2 : 0;
  }
  if (daysAgo <= 240) {
    return 2 + (daysAgo % 3);
  }
  return 1 + (daysAgo % 2);
}

async function resolveSellerId() {
  if (sellerEmailOverride) {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((u) => (u.email ?? "").toLowerCase() === sellerEmailOverride);
    if (!user) throw new Error(`Supabase 사용자 없음 (email): ${sellerEmailOverride}`);
    return { id: user.id, email: user.email, nickname: sellerNickname };
  }

  const sb = createSupabaseAdmin();
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

  const reservation = await prisma.nicknameReservation.findFirst({
    where: {
      OR: [
        { displayNickname: sellerNickname },
        { nickname: sellerNickname },
      ],
    },
    select: { reservedByEmail: true, displayNickname: true },
  });

  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;

  const needle = sellerNickname.toLowerCase();
  const byMeta = data.users.find((u) => {
    const meta = u.user_metadata ?? {};
    const nick =
      typeof meta.nickname === "string"
        ? meta.nickname
        : typeof meta.display_name === "string"
          ? meta.display_name
          : "";
    return nick.trim().toLowerCase() === needle;
  });
  if (byMeta) {
    return { id: byMeta.id, email: byMeta.email, nickname: sellerNickname };
  }

  if (reservation?.reservedByEmail) {
    const email = reservation.reservedByEmail.trim().toLowerCase();
    const user = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (user) {
      return { id: user.id, email: user.email, nickname: reservation.displayNickname };
    }
  }

  throw new Error(
    `판매자를 찾지 못했습니다: 닉네임 "${sellerNickname}". SELLER_EMAIL=... 로 지정할 수 있어요.`,
  );
}

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function buyerId(index) {
  return `${BUYER_PREFIX}${String(index).padStart(12, "0")}`;
}

const LIKER_EMAIL_PREFIX = "seed-analytics-liker-";

function likeUserPool(adminUsers, sellerId) {
  return adminUsers.filter((u) => u.id && u.id !== sellerId).map((u) => u.id);
}

/** 영상당 (user, video) 유니크 제약 — 좋아요 수만큼 서로 다른 UUID 필요 */
async function ensureLikerPool(sb, sellerId, minSize) {
  const { data: authList, error } = await sb.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;

  const pool = new Set(likeUserPool(authList.users, sellerId));

  for (const u of authList.users) {
    const email = (u.email ?? "").toLowerCase();
    if (email.startsWith(LIKER_EMAIL_PREFIX)) {
      pool.add(u.id);
    }
  }

  let nextIdx = 0;
  while (pool.size < minSize) {
    const email = `${LIKER_EMAIL_PREFIX}${String(nextIdx).padStart(4, "0")}@ddna-seed.invalid`;
    nextIdx += 1;
    const { data, error } = await sb.auth.admin.createUser({
      email,
      email_confirm: true,
      password: `Seed-${crypto.randomUUID()}`,
    });
    if (error) {
      const { data: list2 } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = list2?.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (found?.id) pool.add(found.id);
      else throw new Error(`좋아요 테스트 계정 생성 실패: ${error.message}`);
    } else if (data.user?.id) {
      pool.add(data.user.id);
    }
  }

  return [...pool];
}

/** user_id는 auth.users UUID — 구매 buyerId(문자열)와 별도 */
async function seedVideoLikes(sb, videoIds, purchaseRows, userPool) {
  if (userPool.length === 0) {
    console.warn("[warn] 좋아요 시드 스킵 — Supabase에 판매자 외 사용자가 없습니다.");
    return 0;
  }

  const table = process.env.NEXT_PUBLIC_SUPABASE_FAVORITES_TABLE?.trim() || "favorites";

  const { error: delErr } = await sb
    .from(table)
    .delete()
    .eq("kind", "like")
    .in("video_id", videoIds);
  if (delErr) {
    console.warn("[warn] 기존 좋아요 삭제 실패:", delErr.message);
  }

  const used = new Set();
  const likeRows = [];
  let poolIdx = 0;

  const tryPushLike = (videoId, createdAt, attempt = 0) => {
    if (attempt >= userPool.length) return;
    const userId = userPool[poolIdx % userPool.length];
    poolIdx += 1;
    const key = `${userId}:${videoId}`;
    if (used.has(key)) {
      tryPushLike(videoId, createdAt, attempt + 1);
      return;
    }
    used.add(key);
    likeRows.push({
      user_id: userId,
      video_id: videoId,
      kind: "like",
      created_at: createdAt.toISOString(),
    });
  };

  for (let i = 0; i < purchaseRows.length; i++) {
    const p = purchaseRows[i];
    if (i % 2 === 0) tryPushLike(p.videoId, p.createdAt);
  }

  for (let i = 0; i < purchaseRows.length; i++) {
    if (i % 3 !== 0) continue;
    const p = purchaseRows[i];
    const extraAt = new Date(p.createdAt.getTime() - 86_400_000 * (1 + (i % 3)));
    tryPushLike(p.videoId, extraAt);
  }

  const BATCH = 150;
  for (let i = 0; i < likeRows.length; i += BATCH) {
    const slice = likeRows.slice(i, i + BATCH);
    const { error } = await sb.from(table).insert(slice);
    if (error) throw new Error(`좋아요 시드 실패: ${error.message}`);
  }

  return likeRows.length;
}

async function main() {
  const seller = await resolveSellerId();
  console.log(`[seller] ${seller.nickname} (${seller.email ?? seller.id})`);

  const videos = await prisma.video.findMany({
    where: { sellerId: seller.id, status: "approved" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, price: true, createdAt: true },
  });

  if (videos.length === 0) {
    throw new Error("판매자에게 approved 영상이 없습니다. 먼저 영상을 등록해 주세요.");
  }

  const deleted = await prisma.purchase.deleteMany({
    where: {
      sellerId: seller.id,
      buyerId: { startsWith: BUYER_PREFIX },
    },
  });
  console.log(`[clean] 이전 시드 구매 ${deleted.count}건 삭제`);

  const purchaseRows = [];
  let buyerIndex = 0;
  let totalSales = 0;

  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
    const count = salesCountForDay(daysAgo);
    for (let i = 0; i < count; i++) {
      const video = videos[(totalSales + i) % videos.length];
      const createdAt = daysAgoDate(daysAgo, 9 + (i % 10));
      purchaseRows.push({
        buyerId: buyerId(buyerIndex++),
        sellerId: seller.id,
        videoId: video.id,
        price: video.price,
        status: "paid",
        createdAt,
        updatedAt: createdAt,
      });
      totalSales++;
    }
  }

  const BATCH = 200;
  for (let i = 0; i < purchaseRows.length; i += BATCH) {
    await prisma.purchase.createMany({ data: purchaseRows.slice(i, i + BATCH) });
  }

  const salesByVideo = new Map();
  const viewsByVideo = new Map();
  for (const row of purchaseRows) {
    salesByVideo.set(row.videoId, (salesByVideo.get(row.videoId) ?? 0) + 1);
  }
  const sb = createSupabaseAdmin();
  const targetLikes = Math.min(
    Math.floor(purchaseRows.length * 0.55),
    videos.length * 400,
  );
  const likerPool = await ensureLikerPool(sb, seller.id, Math.max(80, targetLikes));
  const likeCount = await seedVideoLikes(
    sb,
    videos.map((v) => v.id),
    purchaseRows,
    likerPool,
  );

  for (const v of videos) {
    const sales = salesByVideo.get(v.id) ?? 0;
    const views = Math.max(
      sales * VIEWS_PER_SALE_LIFETIME,
      sales > 0 ? 800 : v.views ?? 0,
    );
    viewsByVideo.set(v.id, views);
    const oldestSale = purchaseRows.find((p) => p.videoId === v.id)?.createdAt;
    await prisma.video.update({
      where: { id: v.id },
      data: {
        salesCount: sales,
        views,
        ...(oldestSale && sales > 0
          ? {
              createdAt:
                oldestSale < v.createdAt ? oldestSale : v.createdAt,
            }
          : {}),
      },
    });
  }

  const periodHigh = purchaseRows.filter((p) => {
    const ago = Math.floor((Date.now() - p.createdAt.getTime()) / 86_400_000);
    return ago <= 28;
  }).length;
  const periodLow = purchaseRows.filter((p) => {
    const ago = Math.floor((Date.now() - p.createdAt.getTime()) / 86_400_000);
    return ago > 28 && ago <= 90;
  }).length;
  const periodMid = purchaseRows.filter((p) => {
    const ago = Math.floor((Date.now() - p.createdAt.getTime()) / 86_400_000);
    return ago > 90;
  }).length;

  console.log("");
  console.log(`[ok] ${PURCHASE_NOTE}`);
  console.log(`     구매(테스트) ${purchaseRows.length}건 · 좋아요(테스트) ${likeCount}건`);
  console.log(`     영상 ${videos.length}개 — DB views = 판매×${VIEWS_PER_SALE_LIFETIME}`);
  console.log(
    `     분석 표 조회 = 기간 판매×${VIEWS_PER_SALE_PERIOD} (예: 22건 → 약 2.1천)`,
  );
  console.log(`     최근 28일(높음): ${periodHigh}건`);
  console.log(`     29~90일(낮음): ${periodLow}건`);
  console.log(`     91~${HISTORY_DAYS}일(중간·과거): ${periodMid}건`);
  console.log("");
  console.log("※ 수익·조회·좋아요 모두 출시 전 테스트용 가짜 데이터입니다.");
  console.log("마이페이지 → 판매 분석에서 7일 / 한달 / 1년으로 확인하세요.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
