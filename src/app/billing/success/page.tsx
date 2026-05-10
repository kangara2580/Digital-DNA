import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function BillingSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05050a] px-5 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.05] p-8 text-center">
        <CheckCircle2 className="mx-auto text-[#ff2f93]" size={52} />
        <h1 className="mt-5 text-3xl font-black">결제가 접수되었습니다</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          ARA는 한국 MVP에서 Toss Payments를 기준으로 결제를 처리합니다. 결제 확정이
          완료되면 크레딧, 구매권한, 판매자 수익이 자동으로 반영됩니다.
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
