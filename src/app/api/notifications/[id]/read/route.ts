import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/notifications/[id]/read
 * Mark a single notification as read. Auth-gated — only the owner can mark it.
 */
export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const notif = await prisma.notification.findUnique({ where: { id } });

    if (!notif || notif.sellerId !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (notif.read) {
      return NextResponse.json({ ok: true, alreadyRead: true });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/notifications/:id/read]", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
