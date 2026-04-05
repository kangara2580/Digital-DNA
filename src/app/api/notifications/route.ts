import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get("sellerId");
  if (!sellerId?.trim()) {
    return NextResponse.json({ error: "sellerId required" }, { status: 400 });
  }

  const items = await prisma.notification.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      video: {
        select: {
          id: true,
          title: true,
          poster: true,
          price: true,
        },
      },
    },
  });

  const unreadPending = items.filter(
    (n) => n.status === "PENDING" && !n.read,
  ).length;

  return NextResponse.json({
    notifications: items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      status: n.status,
      oldPrice: n.oldPrice,
      newPrice: n.newPrice,
      createdAt: n.createdAt.toISOString(),
      video: n.video,
    })),
    unreadPending,
  });
}
