import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { approveRefundRequest, rejectRefundRequest } from "@/app/admin/commerce-actions";
import { getAdminAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatWon(value: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function badgeClass(status: string): string {
  if (status === "requested" || status === "reviewing") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status === "refunded" || status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function AdminRefundsPage() {
  const access = await getAdminAccess();
  if (!access.ok) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
        <section className="mx-auto max-w-lg rounded-lg border border-rose-200 bg-white p-8">
          <h1 className="text-2xl font-black">관리자 접근이 필요합니다</h1>
          <p className="mt-3 text-sm text-slate-600">{access.reason}</p>
          <Link href="/login" className="mt-6 inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-bold text-white">
            로그인으로 이동
          </Link>
        </section>
      </main>
    );
  }

  const requests = await prisma.refundRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const paymentIds = requests.map((row) => row.paymentId).filter(Boolean) as string[];
  const purchaseIds = requests.map((row) => row.purchaseId).filter(Boolean) as string[];
  const [payments, purchases] = await Promise.all([
    paymentIds.length
      ? prisma.payment.findMany({ where: { id: { in: paymentIds } } })
      : Promise.resolve([]),
    purchaseIds.length
      ? prisma.purchase.findMany({ where: { id: { in: purchaseIds } } })
      : Promise.resolve([]),
  ]);
  const paymentMap = new Map(payments.map((row) => [row.id, row]));
  const purchaseMap = new Map(purchases.map((row) => [row.id, row]));

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
        <Link href="/admin" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950">
          <ArrowLeft size={16} />
          Admin 대시보드
        </Link>
        <div className="flex items-center gap-2">
          <RotateCcw size={24} className="text-slate-500" />
          <h1 className="text-2xl font-black">환불 요청 관리</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          유저 환불 요청을 확인하고 승인 시 토스페이먼츠 취소 API로 실제 환불을 처리합니다.
        </p>
      </header>

      <div className="px-5 py-6 lg:px-8">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">요청</th>
                  <th className="px-4 py-3">유저/대상</th>
                  <th className="px-4 py-3">금액</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">사유</th>
                  <th className="px-4 py-3">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      환불 요청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => {
                    const payment = request.paymentId ? paymentMap.get(request.paymentId) : null;
                    const purchase = request.purchaseId ? purchaseMap.get(request.purchaseId) : null;
                    const canAct = request.status === "requested" || request.status === "reviewing";
                    return (
                      <tr key={request.id} className="align-top hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs text-slate-500">{request.id}</p>
                          <p className="mt-1 text-xs text-slate-400">{formatDate(request.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold">{payment?.userEmail ?? request.requesterId}</p>
                          <p className="font-mono text-xs text-slate-400">
                            payment {request.paymentId ?? "-"}
                          </p>
                          <p className="font-mono text-xs text-slate-400">
                            purchase {purchase?.id ?? request.purchaseId ?? "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-bold">
                          {payment ? formatWon(payment.amountCents) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2 py-1 text-xs font-black ${badgeClass(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold">{request.reason}</p>
                          <p className="mt-1 text-xs text-slate-500">{request.detail}</p>
                        </td>
                        <td className="px-4 py-3">
                          {canAct ? (
                            <div className="grid min-w-52 gap-2">
                              <form action={approveRefundRequest} className="grid gap-2">
                                <input type="hidden" name="id" value={request.id} />
                                <input
                                  name="adminMemo"
                                  placeholder="관리자 메모"
                                  className="h-9 rounded-md border border-slate-200 px-3 text-xs"
                                />
                                <button className="h-9 rounded-md bg-emerald-600 px-3 text-xs font-black text-white">
                                  환불 승인
                                </button>
                              </form>
                              <form action={rejectRefundRequest} className="grid gap-2">
                                <input type="hidden" name="id" value={request.id} />
                                <input
                                  name="adminMemo"
                                  placeholder="거절 사유"
                                  className="h-9 rounded-md border border-slate-200 px-3 text-xs"
                                />
                                <button className="h-9 rounded-md bg-slate-900 px-3 text-xs font-black text-white">
                                  거절
                                </button>
                              </form>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">처리 완료</p>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
