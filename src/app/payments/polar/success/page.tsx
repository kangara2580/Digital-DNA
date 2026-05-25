import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PolarSuccessPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-4 text-5xl">🎉</div>
        <h1 className="mb-2 text-2xl font-bold">결제가 완료되었습니다!</h1>
        <p className="mb-6 text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          크레딧이 계정에 충전되었습니다. 잠시 후 반영됩니다.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/credits"
            className="rounded-lg bg-[#FF2D8D] px-6 py-3 font-semibold text-white transition hover:bg-[#e0267d]"
          >
            크레딧 확인
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-white/20 px-6 py-3 font-semibold transition hover:bg-white/5 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:hover:bg-zinc-100"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
