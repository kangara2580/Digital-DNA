/**
 * Tests for email templates (src/lib/email/templates.ts)
 * - HTML structure
 * - Template parameters
 * - Brand consistency
 */

import { describe, it, expect } from "vitest";
import {
  purchaseReceiptHtml,
  refundRequestConfirmHtml,
  refundApprovedHtml,
  saleNotificationHtml,
  settlementNoticeHtml,
  accountDeletionConfirmHtml,
} from "@/lib/email/templates";

describe("Email Templates", () => {
  describe("purchaseReceiptHtml", () => {
    it("should return valid HTML", () => {
      const html = purchaseReceiptHtml({
        orderName: "Starter Pack",
        amount: 9900,
        currency: "KRW",
      });
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("should contain ARA branding", () => {
      const html = purchaseReceiptHtml({
        orderName: "Test",
        amount: 1000,
        currency: "KRW",
      });
      expect(html).toContain("ARA");
      expect(html).toContain("ara.pink");
      expect(html).toContain("#FF2D8D");
    });

    it("should include order name", () => {
      const html = purchaseReceiptHtml({
        orderName: "Creator Pack",
        amount: 24900,
        currency: "KRW",
      });
      expect(html).toContain("Creator Pack");
    });

    it("should format KRW amount correctly", () => {
      const html = purchaseReceiptHtml({
        orderName: "Test",
        amount: 9900,
        currency: "KRW",
      });
      expect(html).toContain("9,900");
    });

    it("should show credits when provided", () => {
      const html = purchaseReceiptHtml({
        orderName: "Test",
        amount: 9900,
        currency: "KRW",
        credits: 2200,
      });
      expect(html).toContain("2,200");
    });
  });

  describe("refundRequestConfirmHtml", () => {
    it("should contain request ID", () => {
      const html = refundRequestConfirmHtml({
        refundRequestId: "rr_abc123",
        reason: "잘못 구매",
      });
      expect(html).toContain("rr_abc123");
    });

    it("should contain reason", () => {
      const html = refundRequestConfirmHtml({
        refundRequestId: "rr_test",
        reason: "중복 결제",
      });
      expect(html).toContain("중복 결제");
    });
  });

  describe("refundApprovedHtml", () => {
    it("should return valid HTML", () => {
      const html = refundApprovedHtml({
        amount: 9900,
        currency: "KRW",
      });
      expect(html).toContain("<!DOCTYPE html>");
    });

    it("should contain amount", () => {
      const html = refundApprovedHtml({
        amount: 24900,
        currency: "KRW",
      });
      expect(html).toContain("24,900");
    });
  });

  describe("saleNotificationHtml", () => {
    it("should contain video title", () => {
      const html = saleNotificationHtml({
        videoTitle: "뷰티 릴스 #5",
        grossAmount: 5000,
        netAmount: 4500,
        currency: "KRW",
      });
      expect(html).toContain("뷰티 릴스 #5");
    });

    it("should show both gross and net amounts", () => {
      const html = saleNotificationHtml({
        videoTitle: "Test",
        grossAmount: 10000,
        netAmount: 9000,
        currency: "KRW",
      });
      expect(html).toContain("10,000");
      expect(html).toContain("9,000");
    });
  });

  describe("settlementNoticeHtml", () => {
    it("should contain bank name", () => {
      const html = settlementNoticeHtml({
        amount: 50000,
        currency: "KRW",
        bankName: "신한은행",
      });
      expect(html).toContain("신한은행");
    });
  });

  describe("accountDeletionConfirmHtml", () => {
    it("should return valid HTML", () => {
      const html = accountDeletionConfirmHtml();
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("ARA");
    });

    it("should contain deletion confirmation text", () => {
      const html = accountDeletionConfirmHtml();
      expect(html).toContain("삭제");
    });
  });
});
