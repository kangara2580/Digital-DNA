"use client";

import { useCallback, useEffect, useState } from "react";

type RefundRequestInfo = {
  id: string;
  status: string;
  reason: string;
  adminMemo: string | null;
  createdAt: string;
};

type PurchaseItem = {
  id: string;
  videoId: string;
  price: number;
  status: string;
  createdAt: string;
  refundRequest: RefundRequestInfo | null;
};

type PaymentItem = {
  id: string;
  orderName: string | null;
  productType: string;
  productKey: string;
  status: string;
  amountCents: number;
  currency: string;
  credits: number;
  paidAt: string | null;
  createdAt: string;
  refundRequest: RefundRequestInfo | null;
};

const REFUND_REASONS = [
  "콘텐츠 품질 불만족",
  "잘못 구매",
  "중복 결제",
  "서비스 이용 불가",
  "기타",
];

function statusBadge(status: string) {
  switch (status) {
    case "requested":
      return (
        <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">
          검토 중
        </span>
      );
    case "reviewing":
      return (
        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
          검토 중
        </span>
      );
    case "refunded":
      return (
        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
          환불 완료
        </span>
      );
    case "rejected":
      return (
        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
          거부됨
        </span>
      );
    default:
      return null;
  }
}

function formatAmount(amount: number, currency: string) {
  if (currency === "KRW") return `${amount.toLocaleString("ko-KR")}원`;
  return `$${(amount / 100).toFixed(2)}`;
}

export function RefundRequestPageClient() {
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refund form state
  const [refundTarget, setRefundTarget] = useState<{
    type: "purchase" | "payment";
    id: string;
    label: string;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/me/purchases");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setPurchases(data.purchases ?? []);
      setPayments(data.payments ?? []);
    } catch {
      setError("구매 내역을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitRefund = async () => {
    if (!refundTarget || !reason) return;
    setSubmitting(true);

    try {
      // Get CSRF token
      const csrfRes = await fetch("/api/csrf-token");
      const csrfData = await csrfRes.json();

      const body: Record<string, string> = { reason };
      if (detail.trim()) body.detail = detail.trim();
      if (refundTarget.type === "purchase") body.purchaseId = refundTarget.id;
      else body.paymentId = refundTarget.id;

      const res = await fetch("/api/refunds/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfData.csrfToken,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "refund_failed");
      }

      // Reset form and refresh data
      setRefundTarget(null);
      setReason("");
      setDetail("");
      await fetchData();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "환불 요청에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-zinc-400">불러오는 중...</div>;
  }

  if (error) {
    return <div className="py-12 text-center text-red-400">{error}</div>;
  }

  const hasPurchases = purchases.length > 0;
  const hasPayments = payments.length > 0;

  if (!hasPurchases && !hasPayments) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 py-16 text-center text-zinc-500 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-400">
        구매 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Refund form modal */}
      {refundTarget && (
        <div className="rounded-xl border border-[#FF2D8D]/30 bg-[#FF2D8D]/5 p-5">
          <h3 className="mb-3 font-semibold">
            환불 요청 — {refundTarget.label}
          </h3>

          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium">사유 선택</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white"
            >
              <option value="">사유를 선택해주세요</option>
              {REFUND_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">
              상세 내용 (선택)
            </label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="추가 설명이 있다면 적어주세요."
              className="w-full resize-none rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmitRefund}
              disabled={!reason || submitting}
              className="rounded-lg bg-[#FF2D8D] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#e0267d] disabled:opacity-50"
            >
              {submitting ? "제출 중..." : "환불 요청"}
            </button>
            <button
              onClick={() => {
                setRefundTarget(null);
                setReason("");
                setDetail("");
              }}
              className="rounded-lg border border-white/20 px-5 py-2 text-sm transition hover:bg-white/5 [html[data-theme='light']_&]:border-zinc-300"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Video purchases */}
      {hasPurchases && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">영상 구매</h2>
          <div className="space-y-3">
            {purchases.map((p) => {
              const canRefund =
                p.status === "paid" && !p.refundRequest;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50"
                >
                  <div>
                    <div className="text-sm font-medium">
                      영상 ID: {p.videoId.slice(0, 12)}...
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      <span>{formatAmount(p.price, "KRW")}</span>
                      <span>·</span>
                      <span>
                        {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                      {p.refundRequest && statusBadge(p.refundRequest.status)}
                    </div>
                    {p.refundRequest?.status === "rejected" &&
                      p.refundRequest.adminMemo && (
                        <div className="mt-1 text-xs text-red-400">
                          사유: {p.refundRequest.adminMemo}
                        </div>
                      )}
                  </div>

                  {canRefund && (
                    <button
                      onClick={() =>
                        setRefundTarget({
                          type: "purchase",
                          id: p.id,
                          label: `영상 (${p.videoId.slice(0, 8)}...)`,
                        })
                      }
                      className="shrink-0 rounded-lg border border-[#FF2D8D]/50 px-3 py-1.5 text-xs font-semibold text-[#FF2D8D] transition hover:bg-[#FF2D8D]/10"
                    >
                      환불 요청
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Credit pack payments */}
      {hasPayments && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">크레딧 결제</h2>
          <div className="space-y-3">
            {payments.map((p) => {
              const canRefund =
                p.status === "paid" && !p.refundRequest;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {p.orderName || p.productKey}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      <span>
                        {formatAmount(p.amountCents, p.currency)}
                      </span>
                      {p.credits > 0 && (
                        <>
                          <span>·</span>
                          <span>{p.credits.toLocaleString()}C</span>
                        </>
                      )}
                      <span>·</span>
                      <span>
                        {new Date(
                          p.paidAt ?? p.createdAt,
                        ).toLocaleDateString("ko-KR")}
                      </span>
                      {p.refundRequest && statusBadge(p.refundRequest.status)}
                    </div>
                    {p.refundRequest?.status === "rejected" &&
                      p.refundRequest.adminMemo && (
                        <div className="mt-1 text-xs text-red-400">
                          사유: {p.refundRequest.adminMemo}
                        </div>
                      )}
                  </div>

                  {canRefund && (
                    <button
                      onClick={() =>
                        setRefundTarget({
                          type: "payment",
                          id: p.id,
                          label: p.orderName || p.productKey,
                        })
                      }
                      className="shrink-0 rounded-lg border border-[#FF2D8D]/50 px-3 py-1.5 text-xs font-semibold text-[#FF2D8D] transition hover:bg-[#FF2D8D]/10"
                    >
                      환불 요청
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
