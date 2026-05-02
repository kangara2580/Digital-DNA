import { prisma } from "@/lib/prisma";

export type PurchaseStatus = "paid" | "refunded" | "canceled";

export async function hasPaidPurchase(params: {
  userId: string;
  videoId: string;
}): Promise<boolean> {
  const count = await prisma.purchase.count({
    where: {
      buyerId: params.userId,
      videoId: params.videoId,
      status: "paid",
    },
  });
  return count > 0;
}

export async function upsertDemoPurchase(params: {
  buyerId: string;
  sellerId: string;
  videoId: string;
  price: number;
}): Promise<void> {
  const existing = await prisma.purchase.findFirst({
    where: {
      buyerId: params.buyerId,
      videoId: params.videoId,
      status: "paid",
    },
    select: { id: true },
  });
  if (existing) return;

  await prisma.purchase.create({
    data: {
      buyerId: params.buyerId,
      sellerId: params.sellerId,
      videoId: params.videoId,
      price: params.price,
      status: "paid",
    },
  });
}
