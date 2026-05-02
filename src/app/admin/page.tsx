import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  BadgeCheck,
  Bot,
  Database,
  FileText,
  ImageIcon,
  Lock,
  ReceiptText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  createAdminNote,
  syncCatalogVideosToDb,
  updateAdminVideoDetails,
  updatePurchaseStatus,
  updateReportStatus,
  updateVideoModeration,
} from "@/app/admin/actions";
import { getAdminAccess } from "@/lib/adminAuth";
import { getAdminOperationsData } from "@/lib/adminOperationsData";

export const dynamic = "force-dynamic";

const navItems = [
  ["요약", "#overview"],
  ["회원", "#members"],
  ["이미지/영상", "#media"],
  ["구매", "#purchases"],
  ["AI 작업", "#jobs"],
  ["신고", "#reports"],
  ["기록", "#audit"],
];

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatWon(value: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function shortId(value: string): string {
  return value.length > 12 ? `${value.slice(0, 8)}...` : value;
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "approved" || status === "paid" || status === "resolved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "pending" || status === "reviewing"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "rejected" || status === "hidden" || status === "refunded"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${tone}`}>
      {status}
    </span>
  );
}

function SectionHeader({
  id,
  icon,
  title,
  helper,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  helper: string;
}) {
  return (
    <div id={id} className="mb-4 flex scroll-mt-24 items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">{icon}</span>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">{helper}</p>
      </div>
    </div>
  );
}

export default async function AdminPage() {
  const access = await getAdminAccess();

  if (!access.ok) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <section className="w-full max-w-lg rounded-lg border border-rose-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-rose-50 text-rose-600">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-950">Admin 접근이 막혀 있습니다</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{access.reason}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-bold text-white"
          >
            로그인으로 이동
          </Link>
        </section>
      </main>
    );
  }

  const data = await getAdminOperationsData();

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
          <Link
            href="/admin/videos"
            className="flex h-10 items-center rounded-md bg-slate-950 px-3 text-sm font-bold text-white"
          >
            영상 관리
          </Link>
          <Link
            href="/admin/jobs"
            className="flex h-10 items-center rounded-md px-3 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          >
            AI 작업 관리
          </Link>
          {navItems.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="flex h-10 items-center rounded-md px-3 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
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
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Operations
              </p>
              <h2 className="text-2xl font-black">운영 관리자 페이지</h2>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
              <ShieldCheck size={16} />
              DB 연결 및 Admin 권한 확인됨
            </div>
          </div>
        </header>

        <div className="space-y-6 px-5 py-6 lg:px-8">
          <section id="overview" className="scroll-mt-24">
            <div className="mb-4 rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>
                  화면에 보이는 기존 샘플/카탈로그 영상이 Supabase `videos`에 없으면 Admin 검수 목록이 비어 보입니다.
                  아래 버튼으로 현재 코드 카탈로그를 DB에 동기화할 수 있습니다.
                </p>
                <form action={syncCatalogVideosToDb}>
                  <button className="h-9 rounded-md bg-cyan-700 px-4 text-sm font-black text-white">
                    카탈로그 DB 동기화
                  </button>
                </form>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-6">
              {data.metrics.map((metric) => (
                <article key={metric.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-bold text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-2xl font-black">{metric.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{metric.helper}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              id="members"
              icon={<UserRound size={20} />}
              title="회원 관리"
              helper="profiles 테이블 기준으로 최근 회원 정보를 확인합니다. 정지/권한 변경은 2차에서 추가합니다."
            />
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-y border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-3">회원</th>
                    <th className="px-3 py-3">이메일</th>
                    <th className="px-3 py-3">전화/국가</th>
                    <th className="px-3 py-3">수정일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.members.length === 0 ? (
                    <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-500">회원 데이터가 없습니다.</td></tr>
                  ) : data.members.map((member) => (
                    <tr key={member.userId}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                            {member.avatar ? (
                              <img src={member.avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <UserRound size={18} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold">{member.nickname ?? "닉네임 없음"}</p>
                            <p className="font-mono text-xs text-slate-400">{shortId(member.userId)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{member.email ?? "-"}</td>
                      <td className="px-3 py-3 text-slate-600">{member.phone ?? "-"} / {member.country ?? "-"}</td>
                      <td className="px-3 py-3 text-slate-500">{formatDate(member.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              id="media"
              icon={<ImageIcon size={20} />}
              title="이미지/영상 검수"
              helper="영상 썸네일과 원본 링크를 확인하고 승인, 반려, 숨김 상태로 바꿀 수 있습니다."
            />
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {data.media.length === 0 ? (
                <p className="text-sm text-slate-500">영상 데이터가 없습니다.</p>
              ) : data.media.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="aspect-video bg-slate-100">
                    {item.poster ? (
                      <img src={item.poster} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400"><ImageIcon /></div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">{item.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">{item.creator} / {shortId(item.sellerId)}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <a href={item.src} target="_blank" rel="noreferrer" className="rounded-md border border-slate-200 px-2 py-1 font-bold text-slate-600">원본 열기</a>
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-bold">{formatWon(item.price)}</span>
                    </div>
                    {item.reason ? <p className="text-xs text-rose-600">사유: {item.reason}</p> : null}
                    <form action={updateAdminVideoDetails} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                      <input type="hidden" name="videoId" value={item.id} />
                      <div className="grid gap-2 md:grid-cols-2">
                        <input name="title" defaultValue={item.title} placeholder="제목" className="h-9 rounded-md border border-slate-200 px-3 text-sm" />
                        <input name="price" defaultValue={item.price} placeholder="가격" className="h-9 rounded-md border border-slate-200 px-3 text-sm" />
                      </div>
                      <input name="category" defaultValue={item.category ?? ""} placeholder="카테고리" className="h-9 rounded-md border border-slate-200 px-3 text-sm" />
                      <input name="poster" defaultValue={item.poster} placeholder="썸네일 URL" className="h-9 rounded-md border border-slate-200 px-3 text-sm" />
                      <input name="src" defaultValue={item.src} placeholder="영상 URL" className="h-9 rounded-md border border-slate-200 px-3 text-sm" />
                      <textarea name="description" defaultValue={item.description ?? ""} placeholder="설명" className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm" />
                      <button className="h-9 rounded-md bg-cyan-700 px-3 text-xs font-black text-white">
                        정보 수정
                      </button>
                    </form>
                    <form action={createAdminNote} className="grid gap-2 rounded-md border border-slate-200 bg-white p-3">
                      <input type="hidden" name="targetType" value="video" />
                      <input type="hidden" name="targetId" value={item.id} />
                      <textarea name="body" placeholder="이 영상에 대한 운영 메모" className="min-h-16 rounded-md border border-slate-200 px-3 py-2 text-sm" />
                      <button className="h-8 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-700">
                        메모 남기기
                      </button>
                    </form>
                    <form action={updateVideoModeration} className="grid gap-2">
                      <input type="hidden" name="videoId" value={item.id} />
                      <input name="reason" placeholder="반려/숨김 사유" className="h-9 rounded-md border border-slate-200 px-3 text-sm" />
                      <div className="grid grid-cols-4 gap-2">
                        {["approved", "pending", "rejected", "hidden"].map((status) => (
                          <button key={status} name="status" value={status} className="h-9 rounded-md bg-slate-950 px-2 text-xs font-bold text-white">
                            {status}
                          </button>
                        ))}
                      </div>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 2xl:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                id="purchases"
                icon={<ReceiptText size={20} />}
                title="구매 관리"
                helper="구매 상태를 paid, refunded, canceled로 변경할 수 있습니다."
              />
              <div className="space-y-3">
                {data.purchases.length === 0 ? (
                  <p className="text-sm text-slate-500">구매 데이터가 없습니다.</p>
                ) : data.purchases.map((purchase) => (
                  <div key={purchase.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{formatWon(purchase.price)} / 영상 {purchase.videoId}</p>
                        <p className="mt-1 text-xs text-slate-500">구매자 {shortId(purchase.buyerId)} · 판매자 {shortId(purchase.sellerId)}</p>
                      </div>
                      <StatusBadge status={purchase.status} />
                    </div>
                    <form action={updatePurchaseStatus} className="mt-3 flex flex-wrap gap-2">
                      <input type="hidden" name="purchaseId" value={purchase.id} />
                      {["paid", "refunded", "canceled"].map((status) => (
                        <button key={status} name="status" value={status} className="h-8 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-700">
                          {status}
                        </button>
                      ))}
                    </form>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                id="jobs"
                icon={<Bot size={20} />}
                title="AI 작업"
                helper="AI 생성 작업의 상태, 진행률, 결과 URL, 실패 사유를 확인합니다."
              />
              <div className="space-y-3">
                {data.jobs.length === 0 ? (
                  <p className="text-sm text-slate-500">AI 작업 데이터가 없습니다.</p>
                ) : data.jobs.map((job) => (
                  <div key={job.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{job.stage} · {job.progress}%</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">{shortId(job.id)} / user {shortId(job.userId)}</p>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>
                    {job.outputUrl ? <a href={job.outputUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-cyan-700">결과 열기</a> : null}
                    {job.errorMessage ? <p className="mt-2 text-xs text-rose-600">{job.errorMessage}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 2xl:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                id="reports"
                icon={<FileText size={20} />}
                title="신고/검수"
                helper="신고 상태를 변경하고 관리자 메모를 남깁니다."
              />
              <div className="space-y-3">
                {data.reports.length === 0 ? (
                  <p className="text-sm text-slate-500">신고 데이터가 없습니다.</p>
                ) : data.reports.map((report) => (
                  <div key={report.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{report.targetType} / {report.targetId}</p>
                        <p className="mt-1 text-sm text-slate-600">{report.reason}</p>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>
                    {report.adminNote ? <p className="mt-2 text-xs text-slate-500">메모: {report.adminNote}</p> : null}
                    <form action={updateReportStatus} className="mt-3 grid gap-2">
                      <input type="hidden" name="reportId" value={report.id} />
                      <input name="adminNote" placeholder="관리자 메모" className="h-9 rounded-md border border-slate-200 px-3 text-sm" />
                      <div className="flex flex-wrap gap-2">
                        {["open", "reviewing", "resolved", "dismissed"].map((status) => (
                          <button key={status} name="status" value={status} className="h-8 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-700">
                            {status}
                          </button>
                        ))}
                      </div>
                    </form>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                id="audit"
                icon={<Activity size={20} />}
                title="관리자 기록"
                helper="Admin에서 처리한 모든 중요한 변경 기록입니다."
              />
              <div className="space-y-3">
                {data.audits.length === 0 ? (
                  <p className="text-sm text-slate-500">아직 관리자 변경 기록이 없습니다.</p>
                ) : data.audits.map((audit) => (
                  <div key={audit.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{audit.action}</p>
                        <p className="mt-1 text-xs text-slate-500">{audit.targetType} / {shortId(audit.targetId)}</p>
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(audit.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{audit.actorEmail ?? "local admin"}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 2xl:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                id="notes"
                icon={<FileText size={20} />}
                title="운영 메모"
                helper="회원, 영상, 구매, 신고 등에 남긴 내부 메모입니다."
              />
              <div className="space-y-3">
                {data.notes.length === 0 ? (
                  <p className="text-sm text-slate-500">아직 운영 메모가 없습니다.</p>
                ) : data.notes.map((note) => (
                  <div key={note.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold">{note.targetType} / {shortId(note.targetId)}</p>
                      <span className="text-xs text-slate-400">{formatDate(note.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{note.body}</p>
                    <p className="mt-2 font-mono text-xs text-slate-400">{shortId(note.createdBy)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                id="changes"
                icon={<Activity size={20} />}
                title="수정 이력"
                helper="Admin, 판매자, 시스템이 바꾼 콘텐츠 변경 기록입니다."
              />
              <div className="space-y-3">
                {data.changes.length === 0 ? (
                  <p className="text-sm text-slate-500">아직 수정 이력이 없습니다.</p>
                ) : data.changes.map((change) => (
                  <div key={change.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{change.actorType} · {change.changeType}</p>
                        <p className="mt-1 text-xs text-slate-500">{change.targetType} / {shortId(change.targetId)}</p>
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(change.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              id="stored-data"
              icon={<Database size={20} />}
              title="사용자 저장 데이터"
              helper="user_data_blobs에 저장된 사용자별 데이터 키를 확인합니다."
            />
            <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-4">
              {data.blobs.length === 0 ? (
                <p className="text-sm text-slate-500">저장 데이터가 없습니다.</p>
              ) : data.blobs.map((blob) => (
                <div key={`${blob.userId}-${blob.blobKey}`} className="rounded-md border border-slate-200 p-3 text-sm">
                  <p className="font-bold">{blob.blobKey}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">{shortId(blob.userId)}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDate(blob.updatedAt)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex gap-3">
              <BadgeCheck size={20} className="mt-0.5 shrink-0" />
              <p>
                이 Admin은 현재 조회와 주요 상태 변경까지 작동합니다. 다음 단계에서는 회원 정지,
                검색/필터, 대량 처리, 업로드 기본 pending 처리, 공개 피드 approved 필터를 붙이면 운영형으로 더 완성됩니다.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
