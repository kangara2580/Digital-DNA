import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BadgeDollarSign,
  Bot,
  FileText,
  Search,
  ShieldAlert,
  UserRound,
  Video,
} from "lucide-react";
import {
  createAdminNote,
  updateMemberAdminState,
} from "@/app/admin/actions";
import { getAdminAccess } from "@/lib/adminAuth";
import { getAdminMembersData } from "@/lib/adminMembersData";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
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

function statusClass(status: string): string {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "suspended") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "deleted") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-slate-200 bg-white text-slate-600";
}

function roleClass(role: string): string {
  if (role === "admin" || role === "super_admin") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  if (role === "seller") return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function Badge({ value, kind }: { value: string; kind: "status" | "role" }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${
        kind === "status" ? statusClass(value) : roleClass(value)
      }`}
    >
      {value}
    </span>
  );
}

export default async function AdminMembersPage({ searchParams }: PageProps) {
  const access = await getAdminAccess();
  if (!access.ok) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <section className="mx-auto max-w-lg rounded-lg border border-rose-200 bg-white p-8">
          <h1 className="text-2xl font-black text-slate-950">관리자 접근이 필요합니다</h1>
          <p className="mt-3 text-sm text-slate-600">{access.reason}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-bold text-white"
          >
            로그인으로 이동
          </Link>
        </section>
      </main>
    );
  }

  const rawParams = (await searchParams) ?? {};
  const data = await getAdminMembersData({
    q: one(rawParams.q),
    status: one(rawParams.status),
    role: one(rawParams.role),
    page: one(rawParams.page),
    userId: one(rawParams.userId),
  });

  const selected = data.selected;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/admin"
              className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Admin 대시보드
            </Link>
            <h1 className="text-2xl font-black">회원 관리</h1>
            <p className="mt-1 text-sm text-slate-500">
              Supabase `profiles` 기준으로 회원 상태, 권한, 구매/AI/신고 이력을 관리합니다.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
            관리자: {access.user?.email ?? "local preview"}
          </div>
        </div>
      </header>

      <div className="grid gap-6 px-5 py-6 lg:px-8 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-500">전체 회원</p>
              <p className="mt-2 text-2xl font-black">{formatNumber(data.total)}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-500">활성</p>
              <p className="mt-2 text-2xl font-black">
                {formatNumber(data.statusCounts.active ?? 0)}
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-500">정지</p>
              <p className="mt-2 text-2xl font-black">
                {formatNumber(data.statusCounts.suspended ?? 0)}
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-500">판매자</p>
              <p className="mt-2 text-2xl font-black">
                {formatNumber(data.roleCounts.seller ?? 0)}
              </p>
            </article>
          </div>

          <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_160px_160px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                name="q"
                defaultValue={data.q}
                placeholder="이메일, 닉네임, 전화번호, user id 검색"
                className="h-10 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm"
              />
            </label>
            <select
              name="status"
              defaultValue={data.status}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
            >
              <option value="all">모든 상태</option>
              <option value="active">active</option>
              <option value="suspended">suspended</option>
              <option value="deleted">deleted</option>
            </select>
            <select
              name="role"
              defaultValue={data.role}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
            >
              <option value="all">모든 권한</option>
              <option value="user">user</option>
              <option value="seller">seller</option>
              <option value="admin">admin</option>
              <option value="super_admin">super_admin</option>
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
                    <th className="px-4 py-3">회원</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">구매</th>
                    <th className="px-4 py-3">AI</th>
                    <th className="px-4 py-3">신고</th>
                    <th className="px-4 py-3">판매 영상</th>
                    <th className="px-4 py-3">수정일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                        조건에 맞는 회원이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    data.items.map((member) => (
                      <tr key={member.userId} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/members?userId=${member.userId}&q=${encodeURIComponent(data.q)}&status=${data.status}&role=${data.role}`}
                            className="flex min-w-[240px] items-center gap-3"
                          >
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                              {member.avatar ? (
                                <img src={member.avatar} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <UserRound size={18} className="text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-black">{member.nickname || "닉네임 없음"}</p>
                              <p className="text-xs text-slate-500">{member.email || "-"}</p>
                              <p className="font-mono text-[11px] text-slate-400">{shortId(member.userId)}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <Badge value={member.accountStatus} kind="status" />
                            <Badge value={member.role} kind="role" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold">{formatNumber(member.purchasesCount)}건</p>
                          <p className="text-xs text-slate-500">{formatWon(member.purchasesTotal)}</p>
                        </td>
                        <td className="px-4 py-3">{formatNumber(member.jobsCount)}</td>
                        <td className="px-4 py-3">{formatNumber(member.reportsCount)}</td>
                        <td className="px-4 py-3">{formatNumber(member.videosCount)}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(member.updatedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm">
              <span className="text-slate-500">
                {data.page} / {data.pageCount} 페이지
              </span>
              <div className="flex gap-2">
                <Link
                  href={`/admin/members?page=${Math.max(1, data.page - 1)}&q=${encodeURIComponent(data.q)}&status=${data.status}&role=${data.role}`}
                  className="rounded-md border border-slate-200 px-3 py-2 font-bold text-slate-700"
                >
                  이전
                </Link>
                <Link
                  href={`/admin/members?page=${Math.min(data.pageCount, data.page + 1)}&q=${encodeURIComponent(data.q)}&status=${data.status}&role=${data.role}`}
                  className="rounded-md border border-slate-200 px-3 py-2 font-bold text-slate-700"
                >
                  다음
                </Link>
              </div>
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          {!selected ? (
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-black">회원 상세</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                왼쪽 목록에서 회원을 선택하면 정지/해제, 권한 변경, 구매/AI/신고 이력을 확인할 수 있습니다.
              </p>
            </section>
          ) : (
            <>
              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                    {selected.avatar ? (
                      <img src={selected.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-black">{selected.nickname || "닉네임 없음"}</h2>
                    <p className="text-sm text-slate-500">{selected.email || "-"}</p>
                    <p className="font-mono text-xs text-slate-400">{selected.userId}</p>
                  </div>
                </div>

                <form action={updateMemberAdminState} className="mt-5 grid gap-3">
                  <input type="hidden" name="userId" value={selected.userId} />
                  <label className="grid gap-1 text-sm font-bold text-slate-600">
                    상태
                    <select
                      name="accountStatus"
                      defaultValue={selected.accountStatus}
                      className="h-10 rounded-md border border-slate-200 px-3 font-normal text-slate-950"
                    >
                      <option value="active">active</option>
                      <option value="suspended">suspended</option>
                      <option value="deleted">deleted</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-bold text-slate-600">
                    권한
                    <select
                      name="role"
                      defaultValue={selected.role}
                      className="h-10 rounded-md border border-slate-200 px-3 font-normal text-slate-950"
                    >
                      <option value="user">user</option>
                      <option value="seller">seller</option>
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-bold text-slate-600">
                    관리자 메모
                    <textarea
                      name="adminMemo"
                      defaultValue={selected.adminMemo ?? ""}
                      className="min-h-24 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-950"
                      placeholder="정지 사유, CS 메모, 특이사항"
                    />
                  </label>
                  <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-black text-white">
                    회원 상태 저장
                  </button>
                </form>

                <form action={createAdminNote} className="mt-4 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <input type="hidden" name="targetType" value="member" />
                  <input type="hidden" name="targetId" value={selected.userId} />
                  <textarea
                    name="body"
                    className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm"
                    placeholder="이 회원에 대한 운영 메모 추가"
                  />
                  <button className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold">
                    메모 추가
                  </button>
                </form>
              </section>

              <section className="grid gap-3">
                <DetailBlock
                  icon={<BadgeDollarSign size={18} />}
                  title="최근 구매"
                  empty="구매 기록이 없습니다."
                  rows={selected.recentPurchases.map((item) => ({
                    key: item.id,
                    title: `${formatWon(item.price)} / ${item.status}`,
                    meta: `${shortId(item.videoId)} / ${formatDate(item.createdAt)}`,
                  }))}
                />
                <DetailBlock
                  icon={<Bot size={18} />}
                  title="최근 AI 작업"
                  empty="AI 작업 기록이 없습니다."
                  rows={selected.recentJobs.map((item) => ({
                    key: item.id,
                    title: `${item.status} / ${item.stage} / ${item.progress}%`,
                    meta: item.errorMessage || item.outputUrl || formatDate(item.updatedAt),
                  }))}
                />
                <DetailBlock
                  icon={<ShieldAlert size={18} />}
                  title="최근 신고"
                  empty="신고 기록이 없습니다."
                  rows={selected.recentReports.map((item) => ({
                    key: item.id,
                    title: `${item.status} / ${item.targetType}`,
                    meta: `${item.reason} / ${formatDate(item.createdAt)}`,
                  }))}
                />
                <DetailBlock
                  icon={<Video size={18} />}
                  title="판매 영상"
                  empty="등록한 영상이 없습니다."
                  rows={selected.recentVideos.map((item) => ({
                    key: item.id,
                    title: `${item.title} / ${item.status}`,
                    meta: `${formatWon(item.price)} / ${formatDate(item.createdAt)}`,
                  }))}
                />
                <DetailBlock
                  icon={<FileText size={18} />}
                  title="관리자 메모"
                  empty="메모가 없습니다."
                  rows={selected.recentNotes.map((item) => ({
                    key: item.id,
                    title: item.body,
                    meta: `${item.createdBy} / ${formatDate(item.createdAt)}`,
                  }))}
                />
              </section>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}

function DetailBlock({
  icon,
  title,
  empty,
  rows,
}: {
  icon: ReactNode;
  title: string;
  empty: string;
  rows: { key: string; title: string; meta: string }[];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-slate-500">{icon}</span>
        <h3 className="font-black">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <article key={row.key} className="rounded-md border border-slate-100 bg-slate-50 p-3">
              <p className="text-sm font-bold text-slate-800">{row.title}</p>
              <p className="mt-1 break-all text-xs text-slate-500">{row.meta}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
