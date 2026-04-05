import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = { sellerId?: string };

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }
  const sellerId = body.sellerId?.trim();
  if (!sellerId) {
    return NextResponse.json({ error: "sellerId required" }, { status: 400 });
  }

  const notif = await prisma.notification.findUnique({
    where: { id },
    include: { video: true },
  });

  if (!notif || notif.sellerId !== sellerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (notif.status !== "PENDING") {
    return NextResponse.json({ error: "Already handled" }, { status: 409 });
  }

  const flashUntil = new Date(Date.now() + 7 * 86400000);

  await prisma.$transaction([
    prisma.video.update({
      where: { id: notif.videoId },
      data: {
        price: notif.newPrice,
        flashSaleUntil: flashUntil,
      },
    }),
    prisma.notification.update({
      where: { id },
      data: { status: "ACCEPTED", read: true },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    videoId: notif.videoId,
    newPrice: notif.newPrice,
    flashSaleUntil: flashUntil.toISOString(),
  });
}
