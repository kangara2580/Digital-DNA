"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Star } from "lucide-react";
import {
  getAverageRatingForVideo,
  getReviewsForVideo,
} from "@/data/videoDetailReviews";
import { useAuthSession } from "@/hooks/useAuthSession";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

/* ── 타입 ─────────────────────────────────────────── */
type ReviewRow = {
  id: string;
  user_id?: string;
  nickname: string;
  rating: number;
  body: string;
  created_at: string | Date;
  verifiedPurchase?: boolean;
  dateLabel?: string;
};

/* ── 날짜 포맷 ──────────────────────────────────────── */
function formatDate(raw: string | Date): string {
  const d = typeof raw === "string" ? new Date(raw) : raw;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
}

/* ── 별 ─────────────────────────────────────────────── */
function Stars({
  rating,
  size = "sm",
  interactive,
  onRate,
}: {
  rating: number;
  size?: "sm" | "lg";
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const filled = interactive ? (hover || rating) : rating;
  const cls = size === "lg" ? "h-6 w-6" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating}점`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} shrink-0 transition-colors ${
            i <= filled
              ? "fill-white text-white"
              : "fill-transparent text-white/30"
          } ${interactive ? "cursor-pointer hover:text-white" : ""}`}
          onClick={() => interactive && onRate?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          strokeWidth={1.5}
          aria-hidden
        />
      ))}
    </span>
  );
}

/* ── 리뷰 작성 폼 ────────────────────────────────────── */
function WriteReviewForm({
  videoId,
  onSubmitted,
}: {
  videoId: string;
  onSubmitted: () => void;
}) {
  const { user } = useAuthSession();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = useCallback(async () => {
    if (!user || busy || body.trim().length < 5) return;
    setBusy(true);
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const session = supabase
        ? (await supabase.auth.getSession()).data.session
        : null;
      const token = session?.access_token;
      if (!token) { setError("로그인이 필요합니다."); return; }
      const nickname = user.user_metadata?.nickname as string | undefined
        ?? user.email?.split("@")[0]
        ?? "익명";
      const res = await fetch(`/api/reviews/${encodeURIComponent(videoId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, body: body.trim(), nickname }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!data.ok) { setError("저장에 실패했어요. 다시 시도해주세요."); return; }
      setDone(true);
      setBody("");
      onSubmitted();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }, [user, busy, body, rating, videoId, onSubmitted]);

  if (done) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-[13px] text-zinc-300">
        ✓ 후기가 등록됐어요. 감사합니다!
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <p className="text-[12px] font-bold text-zinc-200">후기 작성</p>
      <Stars rating={rating} size="lg" interactive onRate={setRating} />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="이 영상을 어떻게 활용하셨나요? (최소 5자)"
        maxLength={500}
        rows={3}
        className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-500 outline-none focus:border-white/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-900"
      />
      {error ? <p className="text-[11px] text-red-400">{error}</p> : null}
      <button
        type="button"
        disabled={busy || body.trim().length < 5}
        onClick={submit}
        className="w-full rounded-lg border border-white/15 bg-white/[0.06] py-2 text-[13px] font-bold text-zinc-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "저장 중…" : "등록하기"}
      </button>
    </div>
  );
}

/* ── 메인 컴포넌트 ──────────────────────────────────── */
export function VideoDetailReviewsSection({ videoId }: { videoId: string }) {
  const { user } = useAuthSession();
  const { hasPurchased } = usePurchasedVideos();
  const canWrite = !!user && hasPurchased(videoId);

  // 정적 카탈로그 리뷰 (항상 존재)
  const staticReviews = useMemo((): ReviewRow[] =>
    getReviewsForVideo(videoId).map((r) => ({
      id: r.id,
      nickname: r.author,
      rating: r.rating,
      body: r.body,
      created_at: r.dateLabel ?? "",
      verifiedPurchase: r.verifiedPurchase,
      dateLabel: r.dateLabel,
    })),
    [videoId],
  );

  // DB 리뷰
  const [dbReviews, setDbReviews] = useState<ReviewRow[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  const fetchDbReviews = useCallback(async () => {
    setDbLoading(true);
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(videoId)}`, { cache: "no-store" });
      const data = await res.json() as { ok?: boolean; reviews?: ReviewRow[] };
      if (data.ok && Array.isArray(data.reviews)) {
        setDbReviews(data.reviews.map((r) => ({
          ...r,
          verifiedPurchase: true,
          dateLabel: formatDate(r.created_at),
        })));
      }
    } catch { /* ignore */ }
    finally { setDbLoading(false); }
  }, [videoId]);

  useEffect(() => { void fetchDbReviews(); }, [fetchDbReviews]);

  // 합쳐서 최신 순 (DB 우선, 그다음 정적)
  const allReviews = useMemo(() => {
    const dbIds = new Set(dbReviews.map((r) => r.user_id ?? r.id));
    const filteredStatic = staticReviews.filter((r) => !dbIds.has(r.id));
    return [...dbReviews, ...filteredStatic];
  }, [dbReviews, staticReviews]);

  const avg = useMemo(() => {
    if (allReviews.length === 0) return null;
    const dbAvg = dbReviews.length > 0
      ? dbReviews.reduce((s, r) => s + r.rating, 0) / dbReviews.length
      : null;
    return dbAvg ?? getAverageRatingForVideo(videoId);
  }, [allReviews, dbReviews, videoId]);

  return (
    <section
      className="border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-200"
      aria-labelledby="video-reviews-heading"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <h2
          id="video-reviews-heading"
          className="text-center text-lg font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
        >
          구매 후기
        </h2>
        {avg != null && (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
              {avg.toFixed(1)}
            </span>
            <Stars rating={avg} />
            <span className="text-[11px] text-zinc-500">
              ({allReviews.length.toLocaleString("ko-KR")}개)
            </span>
          </div>
        )}
      </div>

      {/* 리뷰 작성 폼 */}
      {canWrite && (
        <div className="mb-5">
          <WriteReviewForm videoId={videoId} onSubmitted={fetchDbReviews} />
        </div>
      )}

      {/* 리뷰 카드 그리드 */}
      {allReviews.length === 0 && !dbLoading ? (
        <p className="text-center text-[13px] text-zinc-500 py-8">
          아직 후기가 없어요. 첫 번째 후기를 남겨보세요!
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {allReviews.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-[12px] font-bold text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
                      {r.nickname}
                    </span>
                    {r.verifiedPurchase && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-bold text-blue-300 ring-1 ring-blue-500/25 [html[data-theme='light']_&]:text-blue-700">
                        <CheckCircle2 className="h-2.5 w-2.5" aria-hidden />
                        구매 인증
                      </span>
                    )}
                  </div>
                  <Stars rating={r.rating} />
                </div>
                <span className="shrink-0 text-[10px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
                  {r.dateLabel ?? (typeof r.created_at === "string" && r.created_at.includes("ago")
                    ? r.created_at
                    : formatDate(r.created_at))}
                </span>
              </div>
              <p className="text-[12px] leading-relaxed text-zinc-400 line-clamp-4 [html[data-theme='light']_&]:text-zinc-700">
                {r.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
