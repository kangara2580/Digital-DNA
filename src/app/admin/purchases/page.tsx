import Link from "next/link";
import { ArrowLeft, ReceiptText, Search } from "lucide-react";
import { AdminSubmitButton } from "@/components/AdminSubmitButton";
import { updatePurchaseStatus } from "@/app/admin/actions";
import { getAdminAccess } from "@/lib/adminAuth";
import { getAdminPurchasesData } from "@/lib/adminPurchasesData";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatWon(value: number): string {
  return `${formatNumber(value)}원`;
}

function shortId(value: string): string {
  return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function badgeClass(status: string): string {
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "refunded") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "canceled") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-slate-200 bg-white text-slate-600";
}

function buildHref(params: {
  q: string;
  status: string;
  page: number;
}): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status !== "all") qs.set("status", params.status);
  if (params.page > 1) qs.set("page", String(params.page));
  const query = qs.toString();
  return `/admin/purchases${query ? `?${query}` : ""}`;
}

export default async function AdminPurchasesPage({ searchParams }: PageProps) {
  const access = await getAdminAccess();
  if (!access.ok) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <section className="mx-auto max-w-lg rounded-lg border border-rose-200 bg-white p-8">
          <h1 className="text-2xl font-black text-slate-950">관리자 접근이 필요합니다</h1>
          <p className="mt-3 text-sm text-slate-600">{access.reason}</p>
          <Link href="/login" className="mt-6 inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-bold text-white">
            로그인으로 이동
          </Link>
        </section>
      </main>
    );
  }

  const rawParams = (await searchParams) ?? {};
  const data = await getAdminPurchasesData({
    q: one(rawParams.q),
    status: one(rawParams.status),
    page: one(rawParams.page),
  });

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950">
              <ArrowLeft size={16} />
              Admin 대시보드
            </Link>
            <div className="flex items-center gap-2">
              <ReceiptText size={24} className="text-slate-500" />
              <h1 className="text-2xl font-black">구매/환불 관리</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              실제 `purchases` 테이블을 기준으로 결제 상태를 확인하고 환불/취소 처리합니다.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
            관리자: {access.user?.email ?? "local preview"}
          </div>
        </div>
      </header>

      <div className="space-y-5 px-5 py-6 lg:px-8">
        <section className="grid gap-3 md:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-500">검색 결과</p>
            <p className="mt-2 text-2xl font-black">{formatNumber(data.total)}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-500">정상 결제</p>
            <p className="mt-2 text-2xl font-black">{formatNumber(data.statusCounts.paid ?? 0)}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-500">환불</p>
            <p className="mt-2 text-2xl font-black">{formatNumber(data.statusCounts.refunded ?? 0)}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-500">누적 정상 결제액</p>
            <p className="mt-2 text-2xl font-black">{formatWon(data.totalPaidAmount)}</p>
          </article>
        </section>

        <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_180px_auto]" action="/admin/purchases">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              name="q"
              defaultValue={data.q}
              placeholder="구매 ID, 구매자 ID, 판매자 ID, 영상 ID 검색"
              className="h-10 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm"
            />
          </label>
          <select name="status" defaultValue={data.status} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
            <option value="all">모든 상태</option>
            <option value="paid">paid</option>
            <option value="refunded">refunded</option>
            <option value="canceled">canceled</option>
          </select>
          <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-black text-white">
            검색
          </button>
        </form>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">구매</th>
                  <th className="px-4 py-3">구매자</th>
                  <th className="px-4 py-3">판매자</th>
                  <th className="px-4 py-3">영상</th>
                  <th className="px-4 py-3">금액</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      구매 데이터가 없습니다.
                    </td>
                  </tr>
                ) : data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-slate-500">{shortId(item.id)}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDate(item.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/members?userId=${item.buyerId}`} className="font-bold text-slate-900 hover:underline">
                        {item.buyerNickname || item.buyerEmail || shortId(item.buyerId)}
                      </Link>
                      <p className="font-mono text-xs text-slate-400">{shortId(item.buyerId)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/members?userId=${item.sellerId}`} className="font-bold text-slate-900 hover:underline">
                        {item.sellerEmail || shortId(item.sellerId)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold">{item.videoTitle || "제목 없음"}</p>
                      <p className="font-mono text-xs text-slate-400">{shortId(item.videoId)}</p>
                    </td>
                    <td className="px-4 py-3 font-black">{formatWon(item.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-1 text-xs font-black ${badgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <form action={updatePurchaseStatus} className="flex flex-wrap gap-2">
                        <input type="hidden" name="purchaseId" value={item.id} />
                        {["paid", "refunded", "canceled"].map((status) => (
                          <AdminSubmitButton
                            key={status}
                            name="status"
                            value={status}
                            className="h-8 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100"
                          >
                            {status}
                          </AdminSubmitButton>
                        ))}
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm">
            <span className="text-slate-500">{data.page} / {data.pageCount} 페이지</span>
            <div className="flex gap-2">
              <Link href={buildHref({ q: data.q, status: data.status, page: Math.max(1, data.page - 1) })} className="rounded-md border border-slate-200 px-3 py-2 font-bold text-slate-700">
                이전
              </Link>
              <Link href={buildHref({ q: data.q, status: data.status, page: Math.min(data.pageCount, data.page + 1) })} className="rounded-md border border-slate-200 px-3 py-2 font-bold text-slate-700">
                다음
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
