export default function AdminMembersLoading() {
  return (
    <main className="min-h-screen bg-slate-100 px-5 py-6 text-slate-950 lg:px-8">
      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-5">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
      </section>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
          회원 정보를 불러오는 중입니다...
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid gap-4 px-4 py-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-md bg-slate-100" />
                <div className="space-y-2">
                  <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-44 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-8 animate-pulse rounded-full bg-slate-100" />
              <div className="h-8 animate-pulse rounded bg-slate-100" />
              <div className="h-8 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
