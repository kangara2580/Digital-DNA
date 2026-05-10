import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function BillingSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05050a] px-5 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.05] p-8 text-center">
        <CheckCircle2 className="mx-auto text-[#ff2f93]" size={52} />
        <h1 className="mt-5 text-3xl font-black">결제가 접수됐습니다</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          Polar 결제 완료 웹훅이 도착하면 크레딧이 자동 적립됩니다. 보통 몇 초 안에
          반영됩니다.
        </p>
        <div className="mt-6 grid gap-3">
          <Link
            href="/credits"
            className="rounded-full bg-[#ff2f93] px-5 py-3 text-sm font-black text-white"
          >
            크레딧 확인하기
          </Link>
          <Link href="/billing" className="text-sm font-bold text-zinc-400 hover:text-white">
            결제 내역 보기
          </Link>
        </div>
      </section>
    </main>
  );
}
