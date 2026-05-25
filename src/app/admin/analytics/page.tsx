import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminAccess } from "@/lib/adminAuth";
import { AdminAnalyticsDashboard } from "@/components/AdminAnalyticsDashboard";
import {
  ArrowLeft,
  BarChart3,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const access = await getAdminAccess();

  if (!access.ok) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <section className="w-full max-w-lg rounded-lg border border-rose-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-rose-50 text-rose-600">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-950">접근 권한이 없습니다</h1>
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

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-100"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[#FF2D8D]" />
                <h1 className="text-xl font-black">Analytics Dashboard</h1>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                매출, 유저, 크레딧, 환불 통합 분석
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
            {access.mode === "development" ? "개발 미리보기" : access.user?.email}
          </div>
        </div>
      </header>

      {/* Dashboard Content (Client Component) */}
      <div className="mx-auto max-w-[1600px] px-5 py-6 lg:px-8">
        <AdminAnalyticsDashboard />
      </div>
    </main>
  );
}
