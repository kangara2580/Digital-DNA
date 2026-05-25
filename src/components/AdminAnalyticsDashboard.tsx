"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminAnalyticsData } from "@/lib/adminAnalytics";

// ─── Types for gem transaction data ──────────────────────

type GemLedgerEntry = {
  id: string;
  userId: string;
  userLabel: string;
  type: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
};

type GemPurchaseEntry = {
  id: string;
  buyerId: string;
  buyerLabel: string;
  sellerId: string;
  sellerLabel: string;
  videoId: string;
  videoTitle: string;
  price: number;
  status: string;
  createdAt: string;
};

type GemTransactionData = {
  ledger: GemLedgerEntry[];
  purchases: GemPurchaseEntry[];
  earningsSummary: { status: string; count: number; netAmount: number; grossAmount: number; platformFee: number }[];
};

// ─── Formatters ──────────────────────────────────────────

function formatCurrency(amount: number, currency = "USD"): string {
  if (currency === "KRW" || currency === "krw") {
    return `${amount.toLocaleString("ko-KR")}💎`;
  }
  if (currency === "GEM" || currency === "gem") {
    return `${amount.toLocaleString("ko-KR")}💎`;
  }
  // USD: amount is in cents
  return `$${(amount / 100).toFixed(2)}`;
}

function formatGem(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}💎`;
}

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

function formatPercent(n: number): string {
  return `${n >= 0 ? "+" : ""}${n}%`;
}

function shortDate(iso: string): string {
  return iso.slice(5); // MM-DD
}

// ─── Mini Bar Chart (pure CSS) ──────────────────────────

function BarChart({
  data,
  labelKey,
  valueKey,
  height = 200,
  barColor = "#FF2D8D",
}: {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  height?: number;
  barColor?: string;
}) {
  if (data.length === 0) return <p className="text-sm text-slate-400">데이터 없음</p>;

  const values = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-[2px] overflow-x-auto" style={{ height }}>
      {data.map((d, i) => {
        const val = values[i];
        const pct = (val / max) * 100;
        const label = String(d[labelKey]);
        return (
          <div key={label} className="group relative flex flex-1 min-w-[6px] flex-col items-center justify-end">
            <div
              className="w-full min-w-[4px] rounded-t transition-all duration-300 hover:opacity-80"
              style={{
                height: `${Math.max(pct, 2)}%`,
                backgroundColor: barColor,
              }}
            />
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] text-white shadow group-hover:block">
              {shortDate(label)}: {formatNumber(val)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition ${
        accent
          ? "border-[#FF2D8D]/30 bg-gradient-to-br from-[#FF2D8D]/5 to-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${accent ? "text-[#FF2D8D]" : "text-slate-950"}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ─── Section Wrapper ────────────────────────────────────

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────

export function AdminAnalyticsDashboard() {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<"revenue" | "purchases" | "newUsers">("revenue");
  const [gemData, setGemData] = useState<GemTransactionData | null>(null);
  const [gemTab, setGemTab] = useState<"ledger" | "purchases">("purchases");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGemData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/gem-transactions");
      if (res.ok) {
        const json = await res.json();
        setGemData(json);
      }
    } catch {
      /* ignore — gem data is supplemental */
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchGemData();
  }, [fetchData, fetchGemData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF2D8D] border-t-transparent" />
        <span className="ml-3 text-sm text-slate-500">분석 데이터 로딩 중...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
        <p className="text-lg font-bold text-rose-700">분석 데이터 로딩 실패</p>
        <p className="mt-2 text-sm text-rose-600">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchData();
          }}
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const { dailyStats, topVideos, topSellers, revenue, userGrowth, providerStats, refundStats, creditStats, todaySummary } = data;

  return (
    <div className="space-y-6">
      {/* ─── Today Summary ─── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="오늘 매출"
          value={formatCurrency(todaySummary.revenue, revenue.currency)}
          sub="실시간 결제 기준"
          accent
        />
        <StatCard
          label="오늘 구매"
          value={`${formatNumber(todaySummary.purchases)}건`}
          sub="결제 완료 기준"
        />
        <StatCard
          label="오늘 신규 유저"
          value={`${formatNumber(todaySummary.newUsers)}명`}
          sub="가입 기준"
        />
        <StatCard
          label="활성 AI 작업"
          value={`${formatNumber(todaySummary.activeJobs)}개`}
          sub="queued + processing"
        />
      </div>

      {/* ─── 30-Day Chart ─── */}
      <Section title="30일 추이" className="!p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 pt-5">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">30일 추이</h3>
          <div className="flex gap-1 rounded-lg border border-slate-200 p-0.5">
            {(
              [
                ["revenue", "매출"],
                ["purchases", "구매"],
                ["newUsers", "신규유저"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setChartMode(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  chartMode === key
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 pb-5 pt-4">
          <BarChart
            data={dailyStats as unknown as Record<string, unknown>[]}
            labelKey="date"
            valueKey={chartMode}
            height={220}
            barColor={
              chartMode === "revenue"
                ? "#FF2D8D"
                : chartMode === "purchases"
                  ? "#3b82f6"
                  : "#10b981"
            }
          />
          {/* X-axis labels */}
          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            <span>{dailyStats.length > 0 ? shortDate(dailyStats[0].date) : ""}</span>
            <span>
              {dailyStats.length > 15 ? shortDate(dailyStats[Math.floor(dailyStats.length / 2)].date) : ""}
            </span>
            <span>{dailyStats.length > 0 ? shortDate(dailyStats[dailyStats.length - 1].date) : ""}</span>
          </div>
        </div>
      </Section>

      {/* ─── Revenue Breakdown + User Growth ─── */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="매출 분석">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">총 매출</span>
              <span className="text-lg font-black text-slate-950">{formatCurrency(revenue.totalRevenue, revenue.currency)}</span>
            </div>
            {/* Show per-currency breakdown if mixed */}
            {revenue.totalRevenueUsd > 0 && revenue.totalRevenueKrw > 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                <span>USD: {formatCurrency(revenue.totalRevenueUsd, "USD")}</span>
                <span>|</span>
                <span>KRW: {formatCurrency(revenue.totalRevenueKrw, "KRW")}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">플랫폼 수수료</span>
              <span className="font-bold text-emerald-600">{formatCurrency(revenue.platformFees, "KRW")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">판매자 수익</span>
              <span className="font-bold text-slate-700">{formatCurrency(revenue.sellerEarnings, "KRW")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">환불 금액</span>
              <span className="font-bold text-rose-500">{formatCurrency(revenue.refundedAmount, revenue.currency)}</span>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">정산 대기</span>
                <span className="font-bold text-amber-600">{formatCurrency(revenue.pendingSettlement, "KRW")}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-slate-600">정산 완료</span>
                <span className="font-bold text-emerald-600">{formatCurrency(revenue.paidSettlement, "KRW")}</span>
              </div>
            </div>
          </div>
        </Section>

        <Section title="유저 성장">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">전체 유저</span>
              <span className="text-lg font-black text-slate-950">{formatNumber(userGrowth.totalUsers)}명</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">이번 달 신규</span>
              <span className="font-bold text-[#FF2D8D]">{formatNumber(userGrowth.thisMonthNew)}명</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">지난 달 신규</span>
              <span className="font-bold text-slate-700">{formatNumber(userGrowth.lastMonthNew)}명</span>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">성장률</span>
                <span
                  className={`text-lg font-black ${
                    userGrowth.growthPercent >= 0 ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {formatPercent(userGrowth.growthPercent)}
                </span>
              </div>
            </div>
            {/* Growth bar */}
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>지난달</span>
                <div className="flex-1">
                  <div className="relative h-6 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-slate-400 transition-all"
                      style={{
                        width: `${Math.min(
                          (userGrowth.lastMonthNew / Math.max(userGrowth.lastMonthNew, userGrowth.thisMonthNew, 1)) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="font-bold">{formatNumber(userGrowth.lastMonthNew)}</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                <span>이번달</span>
                <div className="flex-1">
                  <div className="relative h-6 overflow-hidden rounded-full bg-[#FF2D8D]/10">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-[#FF2D8D] transition-all"
                      style={{
                        width: `${Math.min(
                          (userGrowth.thisMonthNew / Math.max(userGrowth.lastMonthNew, userGrowth.thisMonthNew, 1)) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="font-bold">{formatNumber(userGrowth.thisMonthNew)}</span>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* ─── Top 10 Videos + Top 10 Sellers ─── */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="인기 영상 TOP 10">
          {topVideos.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">판매 데이터 없음</p>
          ) : (
            <div className="space-y-2">
              {topVideos.map((v, i) => (
                <div
                  key={v.videoId}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 transition hover:bg-slate-50"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      i < 3
                        ? "bg-[#FF2D8D] text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{v.title}</p>
                    <p className="text-xs text-slate-500">{v.creator}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black">{formatNumber(v.salesCount)}건</p>
                    <p className="text-xs text-slate-500">{formatCurrency(v.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="탑 판매자 TOP 10">
          {topSellers.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">판매 데이터 없음</p>
          ) : (
            <div className="space-y-2">
              {topSellers.map((s, i) => (
                <div
                  key={s.sellerId}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 transition hover:bg-slate-50"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      i < 3
                        ? "bg-[#FF2D8D] text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{s.nickname || s.email || s.sellerId.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">{s.totalSales}건 판매</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black">{formatCurrency(s.totalRevenue)}</p>
                    <p className="text-xs text-slate-500">순수익 {formatCurrency(s.netEarnings)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* ─── Credit Stats + Refund Stats + Provider Stats ─── */}
      <div className="grid gap-6 md:grid-cols-3">
        <Section title="보석 현황">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">총 발급</span>
              <span className="font-bold text-slate-950">{formatNumber(creditStats.totalIssued)}💎</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">환불 차감</span>
              <span className="font-bold text-rose-500">-{formatNumber(creditStats.totalRefunded)}💎</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-bold text-slate-700">현재 유통량</span>
              <span className="text-lg font-black text-[#FF2D8D]">{formatNumber(creditStats.currentCirculation)}💎</span>
            </div>
          </div>
        </Section>

        <Section title="환불 현황">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">전체 요청</span>
              <span className="font-bold text-slate-950">{formatNumber(refundStats.totalRequests)}건</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">대기 중</span>
              <span className="font-bold text-amber-600">{formatNumber(refundStats.pending)}건</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">승인</span>
              <span className="font-bold text-emerald-600">{formatNumber(refundStats.approved)}건</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">거부</span>
              <span className="font-bold text-rose-500">{formatNumber(refundStats.rejected)}건</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-bold text-slate-700">환불율</span>
              <span className="text-lg font-black text-amber-600">{refundStats.refundRate}%</span>
            </div>
          </div>
        </Section>

        <Section title="결제 수단 분포">
          {providerStats.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">결제 데이터 없음</p>
          ) : (
            <div className="space-y-3">
              {providerStats.map((p) => {
                const totalCount = providerStats.reduce((a, b) => a + b.count, 0);
                const pct = totalCount > 0 ? Math.round((p.count / totalCount) * 100) : 0;
                const cur = p.currency ?? (p.provider === "polar" ? "USD" : "KRW");
                return (
                  <div key={p.provider}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold capitalize text-slate-700">
                        {p.provider === "polar" ? "Polar" : p.provider === "toss" ? "Toss" : p.provider}
                        <span className="ml-1 text-xs font-normal text-slate-400">({cur})</span>
                      </span>
                      <span className="text-slate-500">
                        {formatNumber(p.count)}건 ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#FF2D8D] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {p.totalAmount === 0 ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">테스트</span>
                        ) : null}
                      </span>
                      <span>{formatCurrency(p.totalAmount, cur)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* ─── Gem Transaction Log ─── */}
      <Section title="보석 거래 내역" className="!p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 pt-5">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">보석 거래 내역</h3>
          <div className="flex gap-1 rounded-lg border border-slate-200 p-0.5">
            {(
              [
                ["purchases", "영상 구매"],
                ["ledger", "전체 원장"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setGemTab(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  gemTab === key
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 pb-5 pt-4">
          {gemTab === "purchases" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2">시간</th>
                    <th className="px-3 py-2">구매자</th>
                    <th className="px-3 py-2">판매자</th>
                    <th className="px-3 py-2">영상</th>
                    <th className="px-3 py-2">보석</th>
                    <th className="px-3 py-2">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!gemData || gemData.purchases.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                        구매 내역이 없습니다
                      </td>
                    </tr>
                  ) : (
                    gemData.purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                          {new Date(p.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                        </td>
                        <td className="px-3 py-2 text-xs font-medium">{p.buyerLabel}</td>
                        <td className="px-3 py-2 text-xs font-medium">{p.sellerLabel}</td>
                        <td className="max-w-[200px] truncate px-3 py-2 text-xs">{p.videoTitle}</td>
                        <td className="px-3 py-2 text-xs font-black">{formatGem(p.price)}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            p.status === "paid"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2">시간</th>
                    <th className="px-3 py-2">유저</th>
                    <th className="px-3 py-2">유형</th>
                    <th className="px-3 py-2">사유</th>
                    <th className="px-3 py-2">변동</th>
                    <th className="px-3 py-2">잔액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!gemData || gemData.ledger.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                        원장 데이터가 없습니다
                      </td>
                    </tr>
                  ) : (
                    gemData.ledger.map((l) => {
                      const typeLabel =
                        l.type === "purchase" ? "충전"
                        : l.type === "spend" ? "구매"
                        : l.type === "seller_earning" ? "판매수익"
                        : l.type === "refund" ? "환불"
                        : l.type;
                      const isPositive = l.amount >= 0;
                      return (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                            {new Date(l.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                          </td>
                          <td className="px-3 py-2 text-xs font-medium">{l.userLabel}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                              l.type === "purchase" ? "border-blue-200 bg-blue-50 text-blue-700"
                              : l.type === "spend" ? "border-rose-200 bg-rose-50 text-rose-700"
                              : l.type === "seller_earning" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                            }`}>
                              {typeLabel}
                            </span>
                          </td>
                          <td className="max-w-[250px] truncate px-3 py-2 text-xs text-slate-600">{l.reason}</td>
                          <td className="px-3 py-2 text-xs font-black">
                            <span className={isPositive ? "text-emerald-600" : "text-rose-500"}>
                              {isPositive ? "+" : ""}{formatGem(l.amount)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs font-medium text-slate-600">
                            {formatGem(l.balanceAfter)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>

      {/* ─── Gem Earnings Summary ─── */}
      {gemData && gemData.earningsSummary.length > 0 ? (
        <Section title="보석 수익 요약">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2">상태</th>
                  <th className="px-4 py-2">건수</th>
                  <th className="px-4 py-2">총액</th>
                  <th className="px-4 py-2">수수료</th>
                  <th className="px-4 py-2">순수익</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gemData.earningsSummary.map((e) => (
                  <tr key={e.status} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        e.status === "paid" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : e.status === "pending" ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-bold">{formatNumber(e.count)}건</td>
                    <td className="px-4 py-2 font-bold">{formatGem(e.grossAmount)}</td>
                    <td className="px-4 py-2 text-emerald-600 font-bold">{formatGem(e.platformFee)}</td>
                    <td className="px-4 py-2 font-bold">{formatGem(e.netAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {/* ─── Footer info ─── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
        데이터는 페이지 로드 시점 기준입니다. 새로고침하면 최신 데이터를 볼 수 있습니다.
      </div>
    </div>
  );
}
