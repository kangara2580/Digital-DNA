/**
 * Inline-styled HTML email templates for ARA transactional emails.
 * Brand color: #FF2D8D (ARA pink)
 */

const BRAND_COLOR = "#FF2D8D";
const BG_COLOR = "#f7f8fb";
const TEXT_COLOR = "#111827";

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
  <tr><td style="padding:24px 32px 16px;border-bottom:2px solid ${BRAND_COLOR};">
    <span style="font-size:20px;font-weight:700;color:${BRAND_COLOR};">ARA</span>
    <span style="font-size:14px;color:#6b7280;margin-left:8px;">ara.pink</span>
  </td></tr>
  <tr><td style="padding:24px 32px;color:${TEXT_COLOR};font-size:15px;line-height:1.7;">
    ${bodyHtml}
  </td></tr>
  <tr><td style="padding:16px 32px;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;">
    본 메일은 ARA (ara.pink) 에서 자동 발송되었습니다. 문의: support@ara.pink
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Purchase receipt / confirmation email */
export function purchaseReceiptHtml(params: {
  orderName: string;
  amount: number;
  currency: string;
  credits?: number;
}): string {
  const amountStr =
    params.currency === "KRW"
      ? `${params.amount.toLocaleString("ko-KR")}💎`
      : `$${(params.amount / 100).toFixed(2)}`;

  return layout(
    "결제 완료",
    `
    <h2 style="margin:0 0 16px;font-size:18px;color:${TEXT_COLOR};">결제가 완료되었습니다</h2>
    <table width="100%" cellpadding="8" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:16px;">
      <tr style="background:#f9fafb;">
        <td style="font-weight:600;color:#374151;width:120px;">주문 내용</td>
        <td style="color:${TEXT_COLOR};">${params.orderName}</td>
      </tr>
      <tr>
        <td style="font-weight:600;color:#374151;">결제 금액</td>
        <td style="color:${BRAND_COLOR};font-weight:700;">${amountStr}</td>
      </tr>
      ${
        params.credits
          ? `<tr style="background:#f9fafb;">
        <td style="font-weight:600;color:#374151;">충전 크레딧</td>
        <td style="color:${TEXT_COLOR};">${params.credits.toLocaleString()}C</td>
      </tr>`
          : ""
      }
    </table>
    <p style="margin:0;color:#6b7280;">이용해 주셔서 감사합니다.</p>
  `,
  );
}

/** Refund request submitted confirmation */
export function refundRequestConfirmHtml(params: {
  refundRequestId: string;
  reason: string;
}): string {
  return layout(
    "환불 요청 접수",
    `
    <h2 style="margin:0 0 16px;font-size:18px;color:${TEXT_COLOR};">환불 요청이 접수되었습니다</h2>
    <table width="100%" cellpadding="8" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:16px;">
      <tr style="background:#f9fafb;">
        <td style="font-weight:600;color:#374151;width:120px;">요청 번호</td>
        <td style="color:${TEXT_COLOR};font-family:monospace;">${params.refundRequestId}</td>
      </tr>
      <tr>
        <td style="font-weight:600;color:#374151;">사유</td>
        <td style="color:${TEXT_COLOR};">${params.reason}</td>
      </tr>
    </table>
    <p style="margin:0;color:#6b7280;">관리자 검토 후 결과를 안내드리겠습니다. 처리까지 영업일 기준 1-3일이 소요될 수 있습니다.</p>
  `,
  );
}

/** Refund approved notification */
export function refundApprovedHtml(params: {
  amount: number;
  currency: string;
}): string {
  const amountStr =
    params.currency === "KRW"
      ? `${params.amount.toLocaleString("ko-KR")}💎`
      : `$${(params.amount / 100).toFixed(2)}`;

  return layout(
    "환불 완료",
    `
    <h2 style="margin:0 0 16px;font-size:18px;color:${TEXT_COLOR};">환불이 완료되었습니다</h2>
    <p style="margin:0 0 12px;">환불 금액: <strong style="color:${BRAND_COLOR};">${amountStr}</strong></p>
    <p style="margin:0;color:#6b7280;">결제 수단에 따라 실제 환불까지 3-5 영업일이 소요될 수 있습니다.</p>
  `,
  );
}

/** Sale notification for sellers */
export function saleNotificationHtml(params: {
  videoTitle: string;
  grossAmount: number;
  netAmount: number;
  currency: string;
}): string {
  const fmt = (v: number) =>
    params.currency === "KRW"
      ? `${v.toLocaleString("ko-KR")}💎`
      : `$${(v / 100).toFixed(2)}`;

  return layout(
    "판매 알림",
    `
    <h2 style="margin:0 0 16px;font-size:18px;color:${TEXT_COLOR};">영상이 판매되었습니다 🎉</h2>
    <table width="100%" cellpadding="8" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:16px;">
      <tr style="background:#f9fafb;">
        <td style="font-weight:600;color:#374151;width:120px;">영상</td>
        <td style="color:${TEXT_COLOR};">${params.videoTitle}</td>
      </tr>
      <tr>
        <td style="font-weight:600;color:#374151;">판매 금액</td>
        <td style="color:${TEXT_COLOR};">${fmt(params.grossAmount)}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="font-weight:600;color:#374151;">정산 예정</td>
        <td style="color:${BRAND_COLOR};font-weight:700;">${fmt(params.netAmount)}</td>
      </tr>
    </table>
    <p style="margin:0;color:#6b7280;">정산은 구매 확정 후 영업일 기준 7일 이내에 진행됩니다.</p>
  `,
  );
}

/** Settlement completed notification */
export function settlementNoticeHtml(params: {
  amount: number;
  currency: string;
  bankName: string;
}): string {
  const amountStr =
    params.currency === "KRW"
      ? `${params.amount.toLocaleString("ko-KR")}💎`
      : `$${(params.amount / 100).toFixed(2)}`;

  return layout(
    "정산 완료",
    `
    <h2 style="margin:0 0 16px;font-size:18px;color:${TEXT_COLOR};">정산이 완료되었습니다</h2>
    <p style="margin:0 0 8px;">정산 금액: <strong style="color:${BRAND_COLOR};">${amountStr}</strong></p>
    <p style="margin:0 0 16px;color:#6b7280;">입금 은행: ${params.bankName}</p>
    <p style="margin:0;color:#6b7280;">입금 확인까지 1-2 영업일이 소요될 수 있습니다.</p>
  `,
  );
}

/** Account deletion confirmation */
export function accountDeletionConfirmHtml(): string {
  return layout(
    "계정 삭제 완료",
    `
    <h2 style="margin:0 0 16px;font-size:18px;color:${TEXT_COLOR};">계정이 삭제되었습니다</h2>
    <p style="margin:0 0 12px;color:#6b7280;">ARA 계정이 성공적으로 삭제되었습니다. 모든 개인정보는 삭제 또는 익명화 처리되었습니다.</p>
    <p style="margin:0;color:#6b7280;">그동안 ARA를 이용해 주셔서 감사합니다.</p>
  `,
  );
}
