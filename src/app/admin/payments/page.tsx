import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { getAdminAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function formatMoney(amount: number, currency: string): string {
  if (currency.toUpperCase() === "KRW") {
    return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
  }
  return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function statusClass(status: string): string {
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "pending") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "refunded" || status === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function AdminPaymentsPage() {
  const access = await getAdminAccess();
  if (!access.ok) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
        <section className="mx-auto max-w-lg rounded-lg border border-rose-200 bg-white p-8">
          <h1 className="text-2xl font-black">관리자 접근이 필요합니다</h1>
          <p className="mt-3 text-sm text-slate-600">{access.reason}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-bold text-white"
          >
            로그인으로 이동
          </Link>
        </section>
      </main>
    );
  }

  const [payments, totals, balanceCount] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        userId: true,
        userEmail: true,
        provider: true,
        providerCheckoutId: true,
        providerOrderId: true,
        productKey: true,
        status: true,
        amountCents: true,
        currency: true,
        credits: true,
        createdAt: true,
        paidAt: true,
      },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { amountCents: true, credits: true },
    }),
    prisma.userCreditBalance.count(),
  ]);

  const paidTotal =
    totals.find((row) => row.status === "paid")?._sum.amountCents ?? 0;
  const paidCredits = totals.find((row) => row.status === "paid")?._sum.credits ?? 0;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
        <Link
          href="/admin"
          className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950"
        >
          <ArrowLeft size={16} />
          Admin 대시보드
        </Link>
        <div className="flex items-center gap-2">
          <CreditCard size={24} className="text-slate-500" />
          <h1 className="text-2xl font-black">Toss 결제 / 크레딧 관리</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          실제 Toss 결제, 결제 확정 상태, 적립 크레딧을 확인합니다.
        </p>
      </header>

      <div className="space-y-5 px-5 py-6 lg:px-8">
        <section className="grid gap-3 md:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-500">결제 건수</p>
            <p className="mt-2 text-2xl font-black">{formatNumber(payments.length)}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-500">성공 결제액</p>
            <p className="mt-2 text-2xl font-black">{formatMoney(paidTotal, "KRW")}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-500">지급 크레딧</p>
            <p className="mt-2 text-2xl font-black">{formatNumber(paidCredits)}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-500">크레딧 보유 회원</p>
            <p className="mt-2 text-2xl font-black">{formatNumber(balanceCount)}</p>
          </article>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">일시</th>
                  <th className="px-4 py-3">회원</th>
                  <th className="px-4 py-3">상품</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">금액</th>
                  <th className="px-4 py-3">크레딧</th>
                  <th className="px-4 py-3">Toss 주문 ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      아직 Toss 결제 기록이 없습니다.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{formatDate(payment.paidAt ?? payment.createdAt)}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold">{payment.userEmail ?? "email 없음"}</p>
                        <p className="font-mono text-xs text-slate-400">{payment.userId}</p>
                      </td>
                      <td className="px-4 py-3 font-bold">{payment.productKey}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-1 text-xs font-black ${statusClass(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatMoney(payment.amountCents, payment.currency)}</td>
                      <td className="px-4 py-3">{formatNumber(payment.credits)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        <p>checkout: {payment.providerCheckoutId ?? "-"}</p>
                        <p>order: {payment.providerOrderId ?? "-"}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
