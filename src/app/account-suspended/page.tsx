import Link from "next/link";
import { ShieldAlert } from "lucide-react";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AccountSuspendedPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const status = one(params.status) ?? "suspended";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10 text-slate-950">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-rose-50 text-rose-600">
          <ShieldAlert size={24} />
        </div>
        <h1 className="text-2xl font-black">계정 이용이 제한되어 있습니다</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          현재 계정 상태는 <b>{status}</b>입니다. 마이페이지, 판매 업로드,
          구매, 커스터마이즈 같은 개인 기능 이용이 제한됩니다.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          제한 사유 확인이나 해제가 필요하면 운영자에게 문의해 주세요.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-bold text-white"
          >
            홈으로 이동
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-bold text-slate-700"
          >
            문의하기
          </Link>
        </div>
      </section>
    </main>
  );
}
