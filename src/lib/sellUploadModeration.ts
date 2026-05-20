/**
 * 판매 등록·수정 시 검수 상태.
 *
 * 기본: 자동 승인 (`approved`) — 초기 운영·소규모 서비스용.
 * 수동 검수가 필요하면 `.env`에 `SELL_UPLOAD_REQUIRE_REVIEW=1` 설정.
 */
export function sellUploadRequiresAdminReview(): boolean {
  return process.env.SELL_UPLOAD_REQUIRE_REVIEW === "1";
}

export type SellUploadModerationFields = {
  status: "approved" | "pending";
  moderationReason: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
};

export function sellUploadModerationFields(): SellUploadModerationFields {
  if (sellUploadRequiresAdminReview()) {
    return {
      status: "pending",
      moderationReason: "Awaiting admin review.",
      approvedAt: null,
      approvedBy: null,
    };
  }
  return {
    status: "approved",
    moderationReason: null,
    approvedAt: new Date(),
    approvedBy: "system:auto",
  };
}

export function sellUploadSuccessMessage(): string {
  if (sellUploadRequiresAdminReview()) {
    return "등록이 접수되었습니다. 검수 후 마켓에 노출됩니다.";
  }
  return "등록되었습니다. 마켓에 노출됩니다.";
}

export function sellEditSuccessMessage(): string {
  if (sellUploadRequiresAdminReview()) {
    return "수정이 저장되었습니다. 검수 후 다시 노출됩니다.";
  }
  return "수정이 저장되었습니다.";
}
