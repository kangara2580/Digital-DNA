import Link from "next/link";
import { ArrowLeft, ExternalLink, ImageIcon, Search, ShieldCheck } from "lucide-react";
import { AdminSubmitButton, FormPendingOverlay } from "@/components/AdminSubmitButton";
import {
  createAdminNote,
  syncCatalogVideosToDb,
  updateAdminVideoDetails,
  updateVideoModeration,
} from "@/app/admin/actions";
import { getAdminAccess } from "@/lib/adminAuth";
import { getAdminVideosData } from "@/lib/adminVideosData";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    provider?: string;
    page?: string;
  }>;
};

const navItems = [
  ["요약", "/admin"],
  ["영상 관리", "/admin/videos"],
  ["회원", "/admin/members"],
  ["구매", "/admin/purchases"],
  ["AI 작업", "/admin#jobs"],
  ["신고", "/admin/reports"],
  ["기록", "/admin#audit"],
];

function formatWon(value: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildHref(params: {
  q: string;
  status: string;
  provider: string;
  page: number;
}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status !== "all") qs.set("status", params.status);
  if (params.provider !== "all") qs.set("provider", params.provider);
  if (params.page > 1) qs.set("page", String(params.page));
  const query = qs.toString();
  return `/admin/videos${query ? `?${query}` : ""}`;
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "pending"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";
  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-black ${tone}`}>
      {status}
    </span>
  );
}

export default async function AdminVideosPage({ searchParams }: PageProps) {
  const access = await getAdminAccess();
  if (!access.ok) {
    return (
      <main className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-100 text-slate-950">
        <section className="rounded-lg border border-rose-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black">Admin 접근이 막혀 있습니다</h1>
          <p className="mt-3 text-sm text-slate-600">{access.reason}</p>
        </section>
      </main>
    );
  }

  const params = await searchParams;
  const data = await getAdminVideosData(params);

  return (
    <main className="fixed inset-0 z-[1000] min-h-screen overflow-auto bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-[1002] hidden w-64 border-r border-slate-200 bg-white xl:block">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">ARA</p>
          <h1 className="mt-1 text-xl font-black">Admin Console</h1>
          <p className="mt-2 text-xs text-slate-500">
            {access.mode === "development" ? "개발 미리보기" : access.user?.email}
          </p>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`flex h-10 items-center rounded-md px-3 text-sm font-bold ${
                href === "/admin/videos"
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="min-h-screen xl:pl-64">
        <header className="sticky top-0 z-[1001] border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href="/admin" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500">
                <ArrowLeft size={16} />
                Admin 요약으로
              </Link>
              <h2 className="text-2xl font-black">영상/이미지 관리</h2>
              <p className="mt-1 text-sm text-slate-500">
                샘플 영상, TikTok 링크 영상, 판매자 업로드 영상을 검색하고 검수합니다.
              </p>
            </div>
            <form action={syncCatalogVideosToDb}>
              <AdminSubmitButton className="h-10 rounded-md bg-cyan-700 px-4 text-sm font-black text-white">
                기존 영상 전체 동기화
              </AdminSubmitButton>
            </form>
          </div>
        </header>

        <div className="space-y-5 px-5 py-6 lg:px-8">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <form className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]" action="/admin/videos">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  name="q"
                  defaultValue={data.q}
                  placeholder="제목, 판매자, ID, TikTok ID 검색"
                  className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm"
                />
              </div>
              <select name="status" defaultValue={data.status} className="h-11 rounded-md border border-slate-200 px-3 text-sm">
                <option value="all">전체 상태</option>
                <option value="approved">approved</option>
                <option value="pending">pending</option>
                <option value="rejected">rejected</option>
                <option value="hidden">hidden</option>
              </select>
              <select name="provider" defaultValue={data.provider} className="h-11 rounded-md border border-slate-200 px-3 text-sm">
                <option value="all">전체 소스</option>
                <option value="local">샘플/로컬</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
              </select>
              <button className="h-11 rounded-md bg-slate-950 px-5 text-sm font-black text-white">
                검색
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {["approved", "pending", "rejected", "hidden"].map((status) => (
                <span key={status} className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">
                  {status}: {data.statusCounts[status] ?? 0}
                </span>
              ))}
              <span className="rounded-full bg-cyan-50 px-3 py-1 font-bold text-cyan-700">
                검색 결과: {data.total}
              </span>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {data.items.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
                영상 데이터가 없습니다. 상단의 기존 영상 전체 동기화를 눌러 주세요.
              </div>
            ) : data.items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="aspect-video bg-slate-100">
                  {item.poster ? (
                    <img src={item.poster} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <ImageIcon size={26} />
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{item.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{item.creator} / {item.sellerId}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-slate-100 px-2 py-1 font-bold">{formatWon(item.price)}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-1 font-bold">{item.category ?? "no category"}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-1 font-bold">{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <a href={item.src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 font-bold text-slate-600">
                      임베드/원본 <ExternalLink size={13} />
                    </a>
                    {item.sourcePageUrl ? (
                      <a href={item.sourcePageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 font-bold text-cyan-700">
                        {item.externalProvider ?? "외부"} 링크 <ExternalLink size={13} />
                      </a>
                    ) : null}
                    {item.externalKey ? (
                      <span className="rounded-md border border-slate-200 px-2 py-1 font-mono text-slate-500">
                        {item.externalKey}
                      </span>
                    ) : null}
                  </div>

                  <details className="rounded-md border border-slate-200 bg-slate-50">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-black text-slate-700">
                      수정 열기
                    </summary>
                    <form action={updateAdminVideoDetails} className="relative grid gap-2 border-t border-slate-200 p-3">
                      <FormPendingOverlay />
                      <input type="hidden" name="videoId" value={item.id} />
                      <div className="grid gap-2 md:grid-cols-2">
                        <input name="title" defaultValue={item.title} className="h-9 rounded-md border border-slate-200 px-3 text-sm" />
                        <input name="price" defaultValue={item.price} className="h-9 rounded-md border border-slate-200 px-3 text-sm" />
                      </div>
                      <input name="category" defaultValue={item.category ?? ""} placeholder="카테고리" className="h-9 rounded-md border border-slate-200 px-3 text-sm" />
                      <input name="poster" defaultValue={item.poster} placeholder="썸네일 URL" className="h-9 rounded-md border border-slate-200 px-3 text-sm" />
                      <input name="src" defaultValue={item.src} placeholder="영상 URL" className="h-9 rounded-md border border-slate-200 px-3 text-sm" />
                      <AdminSubmitButton className="h-9 rounded-md bg-cyan-700 px-3 text-xs font-black text-white">정보 수정</AdminSubmitButton>
                    </form>
                  </details>

                  <form action={updateVideoModeration} className="relative grid gap-2">
                    <FormPendingOverlay />
                    <input type="hidden" name="videoId" value={item.id} />
                    <input name="reason" placeholder="반려/숨김 사유" className="h-9 rounded-md border border-slate-200 px-3 text-sm" />
                    <div className="grid grid-cols-4 gap-2">
                      {["approved", "pending", "rejected", "hidden"].map((status) => (
                        <AdminSubmitButton key={status} name="status" value={status} className="h-9 rounded-md bg-slate-950 px-2 text-xs font-bold text-white">
                          {status}
                        </AdminSubmitButton>
                      ))}
                    </div>
                  </form>

                  <details className="rounded-md border border-slate-200 bg-white">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-black text-slate-700">
                      메모 열기
                    </summary>
                    <form action={createAdminNote} className="grid gap-2 border-t border-slate-200 p-3">
                      <input type="hidden" name="targetType" value="video" />
                      <input type="hidden" name="targetId" value={item.id} />
                      <textarea name="body" placeholder="운영 메모" className="min-h-16 rounded-md border border-slate-200 px-3 py-2 text-sm" />
                      <AdminSubmitButton className="h-8 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-700">메모 남기기</AdminSubmitButton>
                    </form>
                  </details>
                </div>
              </article>
            ))}
          </section>

          <nav className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <p className="font-bold text-slate-600">
              {data.page} / {data.pageCount} 페이지
            </p>
            <div className="flex gap-2">
              <Link
                href={buildHref({ q: data.q, status: data.status, provider: data.provider, page: Math.max(1, data.page - 1) })}
                className="rounded-md border border-slate-200 px-3 py-2 font-bold text-slate-700"
              >
                이전
              </Link>
              <Link
                href={buildHref({ q: data.q, status: data.status, provider: data.provider, page: Math.min(data.pageCount, data.page + 1) })}
                className="rounded-md border border-slate-200 px-3 py-2 font-bold text-slate-700"
              >
                다음
              </Link>
            </div>
          </nav>

          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex gap-3">
              <ShieldCheck size={20} className="mt-0.5 shrink-0" />
              <p>
                이 페이지는 기존 샘플 영상과 TikTok 링크 기반 영상을 DB에 모으고,
                상태 변경과 수정 이력을 남기기 위한 운영 화면입니다.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
