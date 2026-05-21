/**
 * Tests for email sending system (src/lib/email/send.ts)
 * - Graceful degradation when Resend is not configured
 * - Correct subject lines
 * - Fire-and-forget behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSend = vi.fn();

// Mock Resend client
vi.mock("@/lib/email/resend", () => ({
  getResendClient: () => {
    if (process.env.__TEST_RESEND_DISABLED === "true") return null;
    return {
      emails: {
        send: mockSend,
      },
    };
  },
  getFromEmail: () => "noreply@ara.pink",
}));

// Mock templates
vi.mock("@/lib/email/templates", () => ({
  purchaseReceiptHtml: (params: any) => `<html>receipt:${JSON.stringify(params)}</html>`,
  refundRequestConfirmHtml: (params: any) => `<html>refund-req:${JSON.stringify(params)}</html>`,
  refundApprovedHtml: (params: any) => `<html>refund-ok:${JSON.stringify(params)}</html>`,
  saleNotificationHtml: (params: any) => `<html>sale:${JSON.stringify(params)}</html>`,
  settlementNoticeHtml: (params: any) => `<html>settle:${JSON.stringify(params)}</html>`,
  accountDeletionConfirmHtml: () => `<html>deletion</html>`,
}));

import {
  sendPurchaseReceipt,
  sendRefundRequestConfirm,
  sendRefundApproved,
  sendSaleNotification,
  sendSettlementNotice,
  sendAccountDeletionConfirm,
} from "@/lib/email/send";

describe("Email Send Module", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockSend.mockReset();
    mockSend.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("when Resend is not configured", () => {
    beforeEach(() => {
      process.env.__TEST_RESEND_DISABLED = "true";
    });

    it("sendPurchaseReceipt should return false", async () => {
      const result = await sendPurchaseReceipt({
        to: "user@test.com",
        orderName: "Starter Pack",
        amount: 9900,
        currency: "KRW",
      });
      expect(result).toBe(false);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("sendRefundRequestConfirm should return false", async () => {
      const result = await sendRefundRequestConfirm({
        to: "user@test.com",
        refundRequestId: "rr_123",
        reason: "잘못 구매",
      });
      expect(result).toBe(false);
    });

    it("sendAccountDeletionConfirm should return false", async () => {
      const result = await sendAccountDeletionConfirm({ to: "user@test.com" });
      expect(result).toBe(false);
    });
  });

  describe("when Resend is configured", () => {
    beforeEach(() => {
      delete process.env.__TEST_RESEND_DISABLED;
    });

    it("sendPurchaseReceipt should call Resend with correct subject", async () => {
      await sendPurchaseReceipt({
        to: "user@test.com",
        orderName: "Creator Pack",
        amount: 24900,
        currency: "KRW",
      });

      expect(mockSend).toHaveBeenCalledOnce();
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe("user@test.com");
      expect(call.from).toBe("noreply@ara.pink");
      expect(call.subject).toContain("Creator Pack");
      expect(call.subject).toContain("[ARA]");
    });

    it("sendRefundRequestConfirm should use correct subject", async () => {
      await sendRefundRequestConfirm({
        to: "user@test.com",
        refundRequestId: "rr_123",
        reason: "중복 결제",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("환불 요청");
    });

    it("sendRefundApproved should include correct data", async () => {
      await sendRefundApproved({
        to: "user@test.com",
        amount: 9900,
        currency: "KRW",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("환불이 완료");
    });

    it("sendSaleNotification should include video title in subject", async () => {
      await sendSaleNotification({
        to: "seller@test.com",
        videoTitle: "쇼핑 릴스",
        grossAmount: 5000,
        netAmount: 4500,
        currency: "KRW",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("쇼핑 릴스");
    });

    it("sendSettlementNotice should be callable", async () => {
      await sendSettlementNotice({
        to: "seller@test.com",
        amount: 50000,
        currency: "KRW",
        bankName: "신한은행",
      });

      expect(mockSend).toHaveBeenCalledOnce();
    });

    it("sendAccountDeletionConfirm should be callable", async () => {
      const result = await sendAccountDeletionConfirm({ to: "user@test.com" });
      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledOnce();
    });

    it("should return false when Resend API returns error", async () => {
      mockSend.mockResolvedValue({ error: { message: "Rate limited" } });

      const result = await sendPurchaseReceipt({
        to: "user@test.com",
        orderName: "Test",
        amount: 1000,
        currency: "KRW",
      });

      expect(result).toBe(false);
    });

    it("should return false when send throws", async () => {
      mockSend.mockRejectedValue(new Error("Network error"));

      const result = await sendPurchaseReceipt({
        to: "user@test.com",
        orderName: "Test",
        amount: 1000,
        currency: "KRW",
      });

      expect(result).toBe(false);
    });
  });
});
