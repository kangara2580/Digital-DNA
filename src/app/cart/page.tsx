"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDopamineBasket } from "@/context/DopamineBasketContext";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { useSitePreferences } from "@/context/SitePreferencesContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import { useVideoDisplayTitle } from "@/hooks/useVideoDisplayTitle";
import type { FeedVideo } from "@/data/videos";
import { TrendingVideoStatsFooter } from "@/components/TrendingVideoStatsFooter";
import { VideoSourcePlatformIcon } from "@/components/VideoSourcePlatformIcon";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import { explorePurchaseButtonClass } from "@/lib/explorePurchaseButtonClass";
import type { SiteLocale } from "@/lib/sitePreferences";
import { getVideoContentSource } from "@/lib/videoSourcePlatform";
import { sanitizePosterSrc } from "@/lib/videoPoster";

const cartOutlineBtn =
  "inline-flex shrink-0 items-center justify-center rounded-xl border border-white/30 bg-transparent px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-900/35 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100";
function localCartPosterFallback(videoId: string): string {
  const hash = Array.from(videoId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const idx = (Math.abs(hash) % 10) + 1;
  return `/videos/sample${idx}.jpg`;
}

/** 저장 JSON에 poster가 비거나 sanitize로 빠져도 카드처럼 썸네일이 나오도록 */
function cartThumbnailSrc(video: FeedVideo): string {
  let u = sanitizePosterSrc(video.poster);
  if (u) return u;
  u = sanitizePosterSrc(video.previewSrc);
  if (u) return u;
  const s = typeof video.src === "string" ? video.src.trim() : "";
  if (s && /\.(webp|jpg|jpeg|png|gif|avif)(\?|$)/i.test(s)) {
    const t = sanitizePosterSrc(s);
    return t ?? s;
  }
  return localCartPosterFallback(video.id);
}

export default function CartPage() {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const { t } = useTranslation();
  const { locale } = useSitePreferences();
  const loc = locale as SiteLocale;
  const numLocale = loc === "en" ? "en-US" : "ko-KR";
  const displayTitle = useVideoDisplayTitle();
  const {
    builderItems,
    cartSyncReady,
    removeBuilderItem,
    removeBuilderItemsByKeys,
    clearBuilder,
  } = useDopamineBasket();
  /** 로그인·서버 장바구니 로드 전에는 builderItems가 잠깐 []라 빈 화면이 깜빡이지 않게 함 */
  const cartUiReady = !authLoading && cartSyncReady;
  const showLoginGate = supabaseConfigured && !authLoading && !user;
  const { hasPurchased } = usePurchasedVideos();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    const valid = new Set(builderItems.map((b) => b.key));
    setSelected((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const k of prev) {
        if (valid.has(k)) next.add(k);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [builderItems]);

  const toggleKey = useCallback((key: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }, []);

  const selectedTotal = useMemo(() => {
    let sum = 0;
    for (const { key, video } of builderItems) {
      if (selected.has(key)) sum += video.priceWon ?? 0;
    }
    return sum;
  }, [builderItems, selected]);

  const allKeys = useMemo(() => builderItems.map((b) => b.key), [builderItems]);

  const allItemsSelected =
    allKeys.length > 0 && allKeys.every((k) => selected.has(k));

  const selectAll = useCallback(() => {
    setSelected((prev) => {
      if (allKeys.length === 0) return prev;
      const allSelected =
        allKeys.every((k) => prev.has(k));
      if (allSelected) return new Set();
      return new Set(allKeys);
    });
  }, [allKeys]);

  const deleteSelected = useCallback(() => {
    if (selected.size === 0) return;
    removeBuilderItemsByKeys([...selected]);
    setSelected(new Set());
  }, [selected, removeBuilderItemsByKeys]);

  const selectedItems = useMemo(
    () => builderItems.filter(({ key }) => selected.has(key)),
    [builderItems, selected],
  );

  const onCheckoutPreflight = useCallback(async () => {
    if (selectedItems.length === 0 || checkoutBusy) return;
    setCheckoutError(null);
    setCheckoutBusy(true);
    try {
      const res = await fetch("/api/cart/validate-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItems.map(({ video }) => ({
            videoId: video.id,
            expectedPriceWon: video.priceWon ?? 0,
          })),
        }),
      });
      const body = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            canCheckout?: boolean;
            mismatches?: Array<{
              videoId: string;
              expectedPriceWon: number;
              actualPriceWon: number | null;
            }>;
          }
        | null;
      if (!res.ok || !body?.ok) {
        setCheckoutError("결제 전 가격 검증에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      if (!body.canCheckout) {
        const first = body.mismatches?.[0];
        if (first) {
          const actual =
            typeof first.actualPriceWon === "number"
              ? `${first.actualPriceWon.toLocaleString(numLocale)}${t("cart.currencySuffix")}`
              : t("cart.priceInquire");
          setCheckoutError(
            `가격이 변경된 항목이 있어요. 다시 확인해 주세요. (기존 ${first.expectedPriceWon.toLocaleString(numLocale)}${t("cart.currencySuffix")} → 현재 ${actual})`,
          );
        } else {
          setCheckoutError("가격이 변경된 항목이 있어 결제를 진행할 수 없어요.");
        }
        return;
      }
      setCheckoutError(
        "가격 검증 완료. 결제 백엔드 연동 시 이 지점에서 결제 생성 API를 호출하면 됩니다.",
      );
    } catch {
      setCheckoutError("네트워크 오류로 결제 전 검증에 실패했습니다.");
    } finally {
      setCheckoutBusy(false);
    }
  }, [checkoutBusy, numLocale, selectedItems, t]);

  const confirmClearCart = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.confirm(t("cart.confirmClear"))) return;
    clearBuilder();
    setSelected(new Set());
  }, [clearBuilder, t]);

  return (
    <main className="mx-auto min-h-[50vh] max-w-[1800px] px-4 pb-10 pt-[max(5rem,calc(env(safe-area-inset-top,0px)+4.25rem))] text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-6 sm:pb-12 sm:pt-[5.75rem] lg:px-8">
      <header className="border-b border-white/10 pb-6 [html[data-theme='light']_&]:border-zinc-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {t("cart.title")}
          </h1>
          {cartUiReady && builderItems.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={selectAll} className={cartOutlineBtn}>
                {allItemsSelected ? t("cart.deselectAll") : t("cart.selectAll")}
              </button>
              <button
                type="button"
                onClick={deleteSelected}
                disabled={selected.size === 0}
                className={cartOutlineBtn}
              >
                {t("cart.delete")}
              </button>
              <button type="button" onClick={confirmClearCart} className={cartOutlineBtn}>
                {t("cart.clear")}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {showLoginGate ? (
        <div className="mx-auto mt-14 max-w-md text-center sm:max-w-lg">
          <p className="text-[14px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("cart.loginHint")}
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent("/cart")}`}
            className="mt-6 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
          >
            {t("mypage.loginCta")}
          </Link>
        </div>
      ) : !cartUiReady ? (
        <div className="mx-auto mt-14 w-full max-w-[1800px] space-y-4" aria-busy="true" aria-live="polite">
          <div className="mx-auto h-4 w-40 animate-pulse rounded bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 md:gap-4 lg:grid-cols-5 lg:gap-x-3 lg:gap-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex min-w-0 flex-col rounded-xl border border-white/10 p-3 sm:p-3.5 [html[data-theme='light']_&]:border-zinc-200"
              >
                <div className="aspect-[3/4] w-full min-w-0 animate-pulse rounded-lg bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
                <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2 [html[data-theme='light']_&]:border-zinc-200">
                  <div className="h-4 w-full animate-pulse rounded bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className="h-3 w-full animate-pulse rounded bg-white/10 [html[data-theme='light']_&]:bg-zinc-200"
                    />
                  ))}
                  <div className="mt-1 h-8 w-full animate-pulse rounded bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("cart.loading")}
          </p>
        </div>
      ) : builderItems.length === 0 ? (
        <div className="mx-auto mt-14 max-w-md text-center sm:max-w-lg">
          <p className="text-[15px] font-semibold text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
            {t("cart.empty")}
          </p>
          <Link
            href="/explore"
            className={`mx-auto mt-6 ${explorePurchaseButtonClass}`}
          >
            {t("cart.browse")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 md:gap-4 lg:grid-cols-5 lg:gap-x-3 lg:gap-y-4">
            {builderItems.map(({ key, video }) => {
              const owned = hasPurchased(video.id);
              const checked = selected.has(key);
              const videoContentSource = getVideoContentSource(video);
              const metrics = getMetricsForVideoDetail(video.id);
              const priceLabel =
                video.priceWon != null
                  ? `${video.priceWon.toLocaleString(numLocale)}${t("cart.currencySuffix")}`
                  : null;
              return (
                <li
                  key={key}
                  className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-3.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/80"
                >
                  <div className="relative w-full min-w-0 shrink-0">
                    <label className="absolute left-2 top-2 z-[2] cursor-pointer rounded-md bg-black/50 p-1 backdrop-blur-sm [html[data-theme='light']_&]:bg-white/80 lg:left-1.5 lg:top-1.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleKey(key)}
                        className="h-4 w-4 rounded border border-white/35 bg-black/50 accent-[#E42980] sm:h-5 sm:w-5 [html[data-theme='light']_&]:border-zinc-400 [html[data-theme='light']_&]:bg-white"
                      />
                      <span className="sr-only">{t("cart.selectAria")}</span>
                    </label>
                    <button
                      type="button"
                      aria-label={t("cart.delete")}
                      onClick={() => {
                        removeBuilderItem(key);
                        setSelected((s) => {
                          const n = new Set(s);
                          n.delete(key);
                          return n;
                        });
                      }}
                      className="absolute right-2 top-2 z-[3] inline-flex h-8 w-8 items-center justify-center rounded-md bg-black/55 text-zinc-200 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white [html[data-theme='light']_&]:bg-white/85 [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-white lg:right-1.5 lg:top-1.5"
                    >
                      <X className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                    </button>
                    <Link
                      href={`/video/${video.id}`}
                      className="relative block aspect-[3/4] w-full min-w-0 overflow-hidden rounded-lg border border-white/12 bg-black/40 ring-1 ring-white/10 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cartThumbnailSrc(video)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </Link>
                  </div>
                  <div className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col rounded-b-lg border-t border-white/10 bg-black/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                    <div className="flex min-h-[34px] min-w-0 flex-col gap-0.5 px-2 py-1.5 sm:min-h-[36px] sm:px-2.5 sm:py-2">
                      <div className="flex min-w-0 items-start gap-2">
                        <VideoSourcePlatformIcon
                          source={videoContentSource}
                          className="mt-0.5 h-3 w-3 shrink-0 text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:h-3.5 sm:w-3.5"
                        />
                        <Link
                          href={`/video/${video.id}`}
                          className="min-w-0 flex-1 break-words text-left text-[12px] font-semibold leading-snug text-zinc-100 transition-colors hover:text-[#E42980] [html[data-theme='light']_&]:text-zinc-900 sm:text-[13px]"
                        >
                          {displayTitle(video)}
                        </Link>
                        {priceLabel ? (
                          <span className="shrink-0 rounded-md px-2 py-0.5 text-right text-[12px] font-extrabold tabular-nums text-zinc-50 transition-colors duration-200 sm:text-[13px] [html[data-theme='light']_&]:text-zinc-950">
                            {priceLabel}
                          </span>
                        ) : (
                          <span className="shrink-0 text-[11px] font-semibold text-zinc-500 sm:text-[12px]">
                            {t("cart.priceInquire")}
                          </span>
                        )}
                      </div>
                    </div>
                    <TrendingVideoStatsFooter
                      metrics={metrics}
                      hideMetricLabels
                      dense
                    />
                    {owned ? (
                      <div className="border-t border-white/10 px-2 py-1.5 [html[data-theme='light']_&]:border-zinc-200 sm:px-2.5 sm:py-2">
                        <Link
                          href={`/create?videoId=${encodeURIComponent(video.id)}`}
                          className="inline-flex rounded-md px-1 py-0.5 text-[11px] font-semibold text-reels-cyan hover:bg-reels-cyan/10 hover:underline sm:text-[12px]"
                        >
                          {t("cart.creditAiCta")}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          <footer className="mt-8 border-t border-white/10 pt-6 [html[data-theme='light']_&]:border-zinc-200">
            <div className="flex flex-wrap items-end justify-end gap-x-5 gap-y-2 sm:gap-x-6">
              <div className="space-y-0.5 text-right">
                <p className="text-[15px] font-semibold leading-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                  {t("cart.subtotalLabel")}
                </p>
                <p className="text-[14px] font-medium leading-tight text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                  {t("cart.selectedCount", { n: selected.size })}
                </p>
              </div>
              <p
                className="text-4xl font-extrabold tabular-nums tracking-tight text-zinc-100 sm:text-5xl [html[data-theme='light']_&]:text-zinc-900"
                aria-live="polite"
                aria-label={t("cart.totalAria", {
                  amount: selectedTotal.toLocaleString(numLocale),
                  n: selected.size,
                })}
              >
                {selectedTotal.toLocaleString(numLocale)}
                {t("cart.currencySuffix")}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <div className="flex max-w-[min(100%,32rem)] flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => void onCheckoutPreflight()}
                  disabled={selected.size === 0 || checkoutBusy}
                  className="inline-flex shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-10 py-3 text-[17px] font-bold text-zinc-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:text-zinc-500 disabled:opacity-90 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-zinc-200 [html[data-theme='light']_&]:disabled:text-zinc-600"
                >
                  {checkoutBusy ? `${t("cart.checkout")}...` : t("cart.checkout")}
                </button>
                {checkoutError ? (
                  <p className="text-right text-[12px] font-medium leading-relaxed text-[color:var(--reels-point)]">
                    {checkoutError}
                  </p>
                ) : null}
              </div>
            </div>
          </footer>
        </>
      )}
    </main>
  );
}
