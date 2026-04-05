import { PrismaClient } from "@prisma/client";
import { scanStaleListings } from "../src/lib/staleListingScanner";

const prisma = new PrismaClient();

const SELLER = process.env.SEED_SELLER_ID ?? "seller-demo";

async function main() {
  await prisma.notification.deleteMany();
  await prisma.video.deleteMany();

  const eightDaysAgo = new Date(Date.now() - 8 * 86400000);

  await prisma.video.create({
    data: {
      title: "골목 끝, 느린 오후",
      creator: "@dna_seller",
      src: "https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_30fps.mp4",
      poster:
        "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=640",
      orientation: "portrait",
      durationSec: 15,
      price: 500,
      views: 120,
      salesCount: 0,
      editionKind: "open",
      sellerId: SELLER,
      createdAt: eightDaysAgo,
    },
  });

  await prisma.video.create({
    data: {
      title: "창문 너머 빗소리",
      creator: "@dna_seller",
      src: "https://videos.pexels.com/video-files/2491284/2491284-hd_1920_1080_30fps.mp4",
      poster:
        "https://images.pexels.com/photos/1520760/pexels-photo-1520760.jpeg?auto=compress&cs=tinysrgb&w=640",
      orientation: "portrait",
      durationSec: 20,
      price: 800,
      views: 200,
      salesCount: 0,
      editionKind: "batch",
      editionCap: 10,
      sellerId: SELLER,
      createdAt: eightDaysAgo,
    },
  });

  const r = await scanStaleListings();
  console.log("Stale scan after seed:", r);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
