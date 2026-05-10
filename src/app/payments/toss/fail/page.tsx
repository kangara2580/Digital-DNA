import Link from "next/link";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function TossFailPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const code = one(params.code);
  const message = one(params.message);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05050a] px-5 text-white">
      <section className="w-full max-w-md rounded-lg border border-rose-400/30 bg-rose-400/10 p-8 text-center">
        <p className="text-sm font-bold text-rose-200">결제 실패</p>
        <h1 className="mt-3 text-3xl font-black">결제가 완료되지 않았습니다</h1>
        <p className="mt-3 text-sm leading-6 text-rose-100">
          {message || "결제창에서 결제가 취소되었거나 실패했습니다."}
        </p>
        {code ? <p className="mt-2 font-mono text-xs text-rose-200">{code}</p> : null}
        <Link
          href="/credits"
          className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950"
        >
          다시 시도하기
        </Link>
      </section>
    </main>
  );
}
