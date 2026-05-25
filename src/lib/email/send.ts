/**
 * High-level email sending functions.
 * All functions are fire-and-forget: they log errors but never throw,
 * so callers don't need to handle email failures.
 *
 * If RESEND_API_KEY is not set, sending is silently skipped with a console.warn.
 */

import { getResendClient, getFromEmail } from "./resend";
import {
  purchaseReceiptHtml,
  refundRequestConfirmHtml,
  refundApprovedHtml,
  saleNotificationHtml,
  settlementNoticeHtml,
  accountDeletionConfirmHtml,
} from "./templates";

async function safeSend(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set — skipping email:", params.subject);
    return false;
  }

  try {
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error("[email] Resend API error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}

// ─── Public API ──────────────────────────────────────────────

export async function sendPurchaseReceipt(params: {
  to: string;
  orderName: string;
  amount: number;
  currency: string;
  credits?: number;
}): Promise<boolean> {
  return safeSend({
    to: params.to,
    subject: `[ARA] 결제 완료 — ${params.orderName}`,
    html: purchaseReceiptHtml({
      orderName: params.orderName,
      amount: params.amount,
      currency: params.currency,
      credits: params.credits,
    }),
  });
}

export async function sendRefundRequestConfirm(params: {
  to: string;
  refundRequestId: string;
  reason: string;
}): Promise<boolean> {
  return safeSend({
    to: params.to,
    subject: "[ARA] 환불 요청이 접수되었습니다",
    html: refundRequestConfirmHtml({
      refundRequestId: params.refundRequestId,
      reason: params.reason,
    }),
  });
}

export async function sendRefundApproved(params: {
  to: string;
  amount: number;
  currency: string;
}): Promise<boolean> {
  return safeSend({
    to: params.to,
    subject: "[ARA] 환불이 완료되었습니다",
    html: refundApprovedHtml({
      amount: params.amount,
      currency: params.currency,
    }),
  });
}

export async function sendSaleNotification(params: {
  to: string;
  videoTitle: string;
  grossAmount: number;
  netAmount: number;
  currency: string;
}): Promise<boolean> {
  return safeSend({
    to: params.to,
    subject: `[ARA] 영상이 판매되었습니다 — ${params.videoTitle}`,
    html: saleNotificationHtml({
      videoTitle: params.videoTitle,
      grossAmount: params.grossAmount,
      netAmount: params.netAmount,
      currency: params.currency,
    }),
  });
}

export async function sendSettlementNotice(params: {
  to: string;
  amount: number;
  currency: string;
  bankName: string;
}): Promise<boolean> {
  return safeSend({
    to: params.to,
    subject: "[ARA] 정산이 완료되었습니다",
    html: settlementNoticeHtml({
      amount: params.amount,
      currency: params.currency,
      bankName: params.bankName,
    }),
  });
}

export async function sendAccountDeletionConfirm(params: {
  to: string;
}): Promise<boolean> {
  return safeSend({
    to: params.to,
    subject: "[ARA] 계정이 삭제되었습니다",
    html: accountDeletionConfirmHtml(),
  });
}
