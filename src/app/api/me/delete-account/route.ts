import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateCsrf } from "@/lib/csrf";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";
import { sendAccountDeletionConfirm } from "@/lib/email/send";

export const dynamic = "force-dynamic";

/**
 * POST /api/me/delete-account
 *
 * Self-service account deletion. Requires `{ confirmText: "DELETE" }` in the body.
 *
 * Flow:
 * 1. Validate CSRF + auth + rate limit
 * 2. Prisma transaction: soft-delete videos, clean up user data, anonymize records
 * 3. Delete Supabase auth user via admin API
 */
export async function POST(request: NextRequest) {
  // --- CSRF ---
  const csrf = validateCsrf(request);
  if (!csrf.ok) return csrf.response;

  // --- Rate limit ---
  const rl = checkRateLimit(request, {
    windowMs: 10 * 60_000,
    maxRequests: 3,
    prefix: "delete-account",
  });
  if (!rl.ok) return rl.response;

  // --- Auth ---
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "login_required" },
      { status: 401 },
    );
  }

  // --- Confirm ---
  let body: { confirmText?: string } | null = null;
  try {
    body = (await request.json()) as { confirmText?: string };
  } catch {
    body = null;
  }

  if (body?.confirmText !== "DELETE") {
    return NextResponse.json(
      { ok: false, error: "confirm_required", message: 'Body must include { confirmText: "DELETE" }' },
      { status: 400 },
    );
  }

  const userId = user.id;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Soft-delete seller's videos
      await tx.video.updateMany({
        where: { sellerId: userId },
        data: {
          status: "hidden",
          moderationReason: "account_deleted",
        },
      });

      // 2. Delete user-specific rows (no audit trail needed after deletion)
      await tx.userCreditBalance.deleteMany({ where: { userId } });
      await tx.creditLedger.deleteMany({ where: { userId } });
      await tx.userEntitlement.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { sellerId: userId } });
      await tx.sellerPayoutAccount.deleteMany({ where: { sellerId: userId } });
      await tx.videoReview.deleteMany({ where: { userId } });
      await tx.generationJob.deleteMany({ where: { userId } });
      await tx.nicknameReservation.deleteMany({
        where: { reservedByEmail: user.email },
      });

      // 3. Anonymize purchase records (keep for seller accounting)
      await tx.purchase.updateMany({
        where: { buyerId: userId },
        data: { buyerId: "deleted_user" },
      });

      // 4. Anonymize payment records
      await tx.payment.updateMany({
        where: { userId },
        data: { userEmail: null },
      });

      // 5. Anonymize refund requests
      await tx.refundRequest.updateMany({
        where: { requesterId: userId },
        data: { requesterId: "deleted_user" },
      });

      // 6. Anonymize seller earnings (buyer side)
      await tx.sellerEarning.updateMany({
        where: { buyerId: userId },
        data: { buyerId: "deleted_user" },
      });
    });

    // --- Delete Supabase auth user ---
    const admin = getSupabaseServiceRoleClient();
    if (admin) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error("[delete-account] Supabase auth delete failed:", deleteError.message);
        // Data is already cleaned up — log but don't fail the response.
        // The auth user is orphaned but harmless without data.
      }
    } else {
      console.warn("[delete-account] No service role client — Supabase auth user not deleted. Set SUPABASE_SERVICE_ROLE_KEY.");
    }

    // Send deletion confirmation email (fire-and-forget, before auth is gone)
    if (user.email) {
      sendAccountDeletionConfirm({ to: user.email }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[delete-account]", err);
    return NextResponse.json(
      { ok: false, error: "deletion_failed" },
      { status: 500 },
    );
  }
}
