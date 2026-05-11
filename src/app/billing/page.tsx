import { redirect } from "next/navigation";
import { getUserCreditSummary } from "@/lib/credits";
import { getCurrentUser } from "@/lib/serverSession";

export const dynamic = "force-dynamic";

function formatCredits(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: Date | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const summary = await getUserCreditSummary(user.id);

  return (
    <main className="min-h-screen bg-[#05050a] px-5 py-10 text-white sm:px-8">
      <section className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#ff7abf]">
          Billing
        </p>
        <h1 className="mt-3 text-4xl font-black">결제와 크레딧 내역</h1>
        <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.05] p-5">
          <p className="text-sm font-bold text-zinc-400">현재 크레딧</p>
          <p className="mt-2 text-4xl font-black">{formatCredits(summary.balance)}</p>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-zinc-400">
              <tr>
                <th className="px-4 py-3">날짜</th>
                <th className="px-4 py-3">상품</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">금액</th>
                <th className="px-4 py-3">크레딧</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {summary.payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-zinc-400">
                    결제 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                summary.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3">{formatDate(payment.paidAt ?? payment.createdAt)}</td>
                    <td className="px-4 py-3 font-bold">{payment.productKey}</td>
                    <td className="px-4 py-3">{payment.status}</td>
                    <td className="px-4 py-3">
                      {(payment.amountCents / 100).toFixed(2)} {payment.currency}
                    </td>
                    <td className="px-4 py-3">+{formatCredits(payment.credits)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
