import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
/** Prisma·SQLite는 Node 런타임에서만 안전 */
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get("sellerId");
  if (!sellerId?.trim()) {
    return NextResponse.json({ error: "sellerId required" }, { status: 400 });
  }

  try {
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

    const visible = items.filter((n) => n.video != null);
    const unreadPending = visible.filter(
      (n) => n.status === "PENDING" && !n.read,
    ).length;

    return NextResponse.json({
      notifications: visible.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        status: n.status,
        oldPrice: n.oldPrice,
        newPrice: n.newPrice,
        createdAt: n.createdAt.toISOString(),
        video: n.video!,
      })),
      unreadPending,
    });
  } catch (err) {
    console.error("[GET /api/notifications]", err);

    const isDev = process.env.NODE_ENV === "development";
    const message =
      err instanceof Error ? err.message : "notifications query failed";

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          error: "database_error",
          code: err.code,
          ...(isDev ? { message: err.message } : {}),
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "internal_error",
        ...(isDev ? { message } : {}),
      },
      { status: 500 },
    );
  }
}
