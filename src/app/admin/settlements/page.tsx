import Link from "next/link";
import { ArrowLeft, Landmark } from "lucide-react";
import { AdminSubmitButton } from "@/components/AdminSubmitButton";
import { approveSettlementRequest, markSettlementPaid } from "@/app/admin/commerce-actions";
import { getAdminAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatGem(value: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(value)}💎`;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function badgeClass(status: string): string {
  if (status === "requested" || status === "approved" || status === "settling") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "rejected" || status === "held") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function AdminSettlementsPage() {
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

  const [requests, settlements, earnings] = await Promise.all([
    prisma.sellerSettlementRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.sellerSettlement.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.sellerEarning.groupBy({
      by: ["sellerId", "status"],
      _sum: { netAmount: true, grossAmount: true, platformFee: true },
      _count: { _all: true },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
        <Link href="/admin" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950">
          <ArrowLeft size={16} />
          Admin 대시보드
        </Link>
        <div className="flex items-center gap-2">
          <Landmark size={24} className="text-slate-500" />
          <h1 className="text-2xl font-black">판매자 정산 관리</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          판매자 정산 요청을 승인하고, 수동 송금 완료 여부를 기록합니다.
        </p>
      </header>

      <div className="space-y-6 px-5 py-6 lg:px-8">
        <section className="grid gap-3 md:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-500">정산 요청</p>
            <p className="mt-2 text-2xl font-black">{requests.length}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-500">요청 금액</p>
            <p className="mt-2 text-2xl font-black">
              {formatGem(requests.reduce((sum, row) => sum + row.amount, 0))}
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-500">정산 기록</p>
            <p className="mt-2 text-2xl font-black">{settlements.length}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-500">판매 수익 row</p>
            <p className="mt-2 text-2xl font-black">
              {earnings.reduce((sum, row) => sum + row._count._all, 0)}
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-black">정산 요청함</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">요청일</th>
                  <th className="px-4 py-3">판매자</th>
                  <th className="px-4 py-3">금액</th>
                  <th className="px-4 py-3">계좌</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      정산 요청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className="align-top hover:bg-slate-50">
                      <td className="px-4 py-3">{formatDate(request.createdAt)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{request.sellerId}</td>
                      <td className="px-4 py-3 font-black">{formatGem(request.amount)}</td>
                      <td className="px-4 py-3">
                        <p>{request.bankName ?? "-"}</p>
                        <p className="text-xs text-slate-500">{request.accountHolder ?? "-"} / {request.accountNo ?? "-"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-1 text-xs font-black ${badgeClass(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {request.status === "requested" ? (
                          <form action={approveSettlementRequest} className="grid min-w-48 gap-2">
                            <input type="hidden" name="id" value={request.id} />
                            <input
                              name="adminMemo"
                              placeholder="관리자 메모"
                              className="h-9 rounded-md border border-slate-200 px-3 text-xs"
                            />
                            <AdminSubmitButton className="h-9 rounded-md bg-slate-950 px-3 text-xs font-black text-white">
                              승인
                            </AdminSubmitButton>
                          </form>
                        ) : (
                          <p className="text-xs text-slate-400">처리됨</p>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-black">송금 처리 기록</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">생성일</th>
                  <th className="px-4 py-3">판매자</th>
                  <th className="px-4 py-3">금액</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      정산 기록이 없습니다.
                    </td>
                  </tr>
                ) : (
                  settlements.map((settlement) => (
                    <tr key={settlement.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{formatDate(settlement.createdAt)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{settlement.sellerId}</td>
                      <td className="px-4 py-3 font-black">{formatGem(settlement.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-1 text-xs font-black ${badgeClass(settlement.status)}`}>
                          {settlement.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {settlement.status !== "paid" ? (
                          <form action={markSettlementPaid}>
                            <input type="hidden" name="settlementId" value={settlement.id} />
                            <AdminSubmitButton className="h-9 rounded-md bg-emerald-600 px-3 text-xs font-black text-white">
                              수동 송금 완료
                            </AdminSubmitButton>
                          </form>
                        ) : (
                          <p className="text-xs text-slate-400">
                            {settlement.processedAt ? formatDate(settlement.processedAt) : "완료"}
                          </p>
                        )}
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
