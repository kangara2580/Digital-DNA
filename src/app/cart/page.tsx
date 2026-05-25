"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthPromptModal } from "@/components/AuthPromptModalProvider";
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
import { InsufficientCreditsModal } from "@/components/InsufficientCreditsModal";
import { GemAmount } from "@/components/PaymentDiamondIcon";
import { toGemPrice } from "@/lib/gemPrice";

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
  const { openAuthModal } = useAuthPromptModal();
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
  const [insufficientModal, setInsufficientModal] = useState<{
    required: number;
    balance: number;
  } | null>(null);
  const [gemBalance, setGemBalance] = useState<number | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<{
    count: number;
    totalGems: number;
    firstVideoId: string;
    skippedCount: number;
  } | null>(null);

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

  useEffect(() => {
    if (!user) {
      setGemBalance(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/me/wallet");
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          balance?: number;
        } | null;
        if (!cancelled && res.ok && data?.ok && typeof data.balance === "number") {
          setGemBalance(data.balance);
        }
      } catch {
        if (!cancelled) setGemBalance(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleKey = useCallback((key: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }, []);

  const selectedItems = useMemo(
    () => builderItems.filter(({ key }) => selected.has(key)),
    [builderItems, selected],
  );

  const selectedPayableItems = useMemo(
    () => selectedItems.filter(({ video }) => !hasPurchased(video.id)),
    [hasPurchased, selectedItems],
  );

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

  const payableGemsTotal = useMemo(
    () =>
      selectedPayableItems.reduce(
        (sum, { video }) => sum + toGemPrice(video.priceWon ?? 0),
        0,
      ),
    [selectedPayableItems],
  );

  const onCheckoutPreflight = useCallback(async () => {
    if (selectedPayableItems.length === 0 || checkoutBusy) return;
    setCheckoutError(null);
    setCheckoutSuccess(null);
    setCheckoutBusy(true);
    try {
      const res = await fetch("/api/videos/purchase-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoIds: selectedPayableItems.map(({ video }) => video.id),
        }),
      });

      const payload = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        required?: number;
        balance?: number;
        purchased?: Array<{ videoId: string }>;
        skipped?: Array<{ videoId: string; reason: string }>;
        totalGems?: number;
        itemCount?: number;
      } | null;

      if (res.status === 401) {
        openAuthModal();
        return;
      }

      if (res.status === 402) {
        setInsufficientModal({
          required: payload?.required ?? 0,
          balance: payload?.balance ?? 0,
        });
        return;
      }

      if (!res.ok || !payload?.ok) {
        setCheckoutError(
          payload?.error === "validation_failed"
            ? t("cart.checkout.validationFail")
            : t("cart.checkout.purchaseFail"),
        );
        return;
      }

      const purchasedIds = new Set(
        payload.purchased?.map((p) => p.videoId) ?? [],
      );
      const purchasedList = payload.purchased ?? [];
      const skippedCount = payload.skipped?.length ?? 0;
      const keysToRemove = selectedPayableItems
        .filter(({ video }) => purchasedIds.has(video.id))
        .map(({ key }) => key);
      if (keysToRemove.length > 0) {
        removeBuilderItemsByKeys(keysToRemove);
      }
      setSelected(new Set());

      if (typeof payload.balance === "number") {
        setGemBalance(payload.balance);
      }

      const firstPurchased = purchasedList[0];
      if (firstPurchased) {
        setCheckoutSuccess({
          count: purchasedList.length,
          totalGems: payload.totalGems ?? payableGemsTotal,
          firstVideoId: firstPurchased.videoId,
          skippedCount,
        });
      }
    } catch {
      setCheckoutError(t("cart.checkout.networkPurchaseFail"));
    } finally {
      setCheckoutBusy(false);
    }
  }, [
    checkoutBusy,
    openAuthModal,
    payableGemsTotal,
    selectedPayableItems,
    removeBuilderItemsByKeys,
    t,
  ]);

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
          <button
            type="button"
            onClick={() => openAuthModal()}
            className="mt-6 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
          >
            {t("mypage.loginCta")}
          </button>
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
                <div className="aspect-[9/16] w-full min-w-0 animate-pulse rounded-lg bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
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
              const priceGems =
                video.priceWon != null && video.priceWon > 0
                  ? toGemPrice(video.priceWon).toLocaleString(numLocale)
                  : null;
              return (
                <li
                  key={key}
                  className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-3.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/80"
                >
                  <div className="relative w-full min-w-0 shrink-0">
                    <label className="absolute left-2 top-2 z-[2] flex cursor-pointer items-center lg:left-1.5 lg:top-1.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleKey(key)}
                        className="h-4 w-4 shrink-0 rounded border-2 border-white/90 bg-black/35 accent-[color:var(--reels-point)] shadow-[0_1px_4px_rgba(0,0,0,0.4)] sm:h-5 sm:w-5 [html[data-theme='light']_&]:border-black [html[data-theme='light']_&]:bg-white"
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
                      className="absolute right-2 top-2 z-[3] inline-flex h-7 w-7 items-center justify-center rounded-md bg-black/90 text-white shadow-[0_1px_4px_rgba(0,0,0,0.45)] transition-colors hover:bg-black [html[data-theme='light']_&]:border [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-sm [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:hover:bg-zinc-50 lg:right-1.5 lg:top-1.5"
                    >
                      <X className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                    </button>
                    <Link
                      href={`/video/${video.id}`}
                      className="relative block aspect-[9/16] w-full min-w-0 overflow-hidden rounded-lg border border-white/12 bg-black/40 ring-1 ring-white/10 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100"
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
                          className="min-w-0 flex-1 break-words text-left text-[12px] font-semibold leading-snug text-zinc-100 transition-colors hover:text-[#FF2D8D] [html[data-theme='light']_&]:text-zinc-900 sm:text-[13px]"
                        >
                          {displayTitle(video)}
                        </Link>
                        {priceGems ? (
                          <GemAmount
                            value={priceGems}
                            className="shrink-0 text-[12px] font-extrabold tabular-nums text-zinc-50 sm:text-[13px] [html[data-theme='light']_&]:text-zinc-950"
                            iconClassName="h-3.5 w-3.5 shrink-0 text-[color:var(--reels-point)]"
                          />
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
            {checkoutSuccess ? (
              <div
                className="mx-auto max-w-lg rounded-2xl border border-emerald-400/35 bg-emerald-500/10 px-5 py-5 text-center [html[data-theme='light']_&]:border-emerald-300 [html[data-theme='light']_&]:bg-emerald-50"
                role="status"
                aria-live="polite"
              >
                <p className="text-lg font-black text-emerald-200 [html[data-theme='light']_&]:text-emerald-800">
                  {t("cart.checkout.successTitle")}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                  {t("cart.checkout.successLead", {
                    n: checkoutSuccess.count,
                    gems: checkoutSuccess.totalGems.toLocaleString(numLocale),
                  })}
                </p>
                {checkoutSuccess.skippedCount > 0 ? (
                  <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                    {t("cart.checkout.partialSkip")}
                  </p>
                ) : null}
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Link
                    href={`/create?videoId=${encodeURIComponent(checkoutSuccess.firstVideoId)}`}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 text-sm font-black text-white shadow-lg"
                  >
                    {t("cart.checkout.successStudio")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setCheckoutSuccess(null)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-bold text-zinc-300 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-700"
                  >
                    {t("cart.checkout.successStay")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                  <p className="text-[13px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                    {t("cart.balanceLabel")}
                  </p>
                  <p className="text-lg font-black tabular-nums text-amber-300 [html[data-theme='light']_&]:text-amber-700">
                    {gemBalance != null ? (
                      <GemAmount
                        value={gemBalance.toLocaleString(numLocale)}
                        iconClassName="h-4 w-4 shrink-0 text-[color:var(--reels-point)]"
                      />
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-0.5 sm:text-left">
                    <p className="text-[15px] font-semibold leading-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                      {t("cart.subtotalLabel")}
                    </p>
                    <p className="text-[14px] font-medium leading-tight text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                      {t("cart.selectedCount", { n: selected.size })}
                      {selectedPayableItems.length !== selected.size
                        ? ` · ${t("cart.payableCount", { n: selectedPayableItems.length })}`
                        : ""}
                    </p>
                  </div>
                  <p
                    className="text-3xl font-extrabold tabular-nums tracking-tight text-zinc-100 sm:text-4xl md:text-5xl [html[data-theme='light']_&]:text-zinc-900"
                    aria-live="polite"
                    aria-label={t("cart.totalAria", {
                      amount: payableGemsTotal.toLocaleString(numLocale),
                      n: selectedPayableItems.length,
                    })}
                  >
                    <GemAmount
                      value={payableGemsTotal.toLocaleString(numLocale)}
                      className="text-3xl font-extrabold sm:text-4xl md:text-5xl"
                      iconClassName="h-[0.85em] w-[0.85em] shrink-0 text-[color:var(--reels-point)]"
                    />
                  </p>
                </div>
                <div className="mt-6 flex flex-col items-stretch gap-2 sm:items-end">
                  <button
                    type="button"
                    onClick={() => void onCheckoutPreflight()}
                    disabled={
                      selected.size === 0 ||
                      selectedPayableItems.length === 0 ||
                      checkoutBusy
                    }
                    className="inline-flex h-12 w-full max-w-full shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--reels-point)] to-[#ff7abf] px-6 text-[16px] font-black text-white shadow-[0_8px_28px_-10px_rgba(255,45,141,0.55)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 sm:px-10 sm:text-[17px] md:w-auto md:min-w-[14rem]"
                  >
                    {checkoutBusy
                      ? t("cart.checkout.busy")
                      : t("cart.checkout.gemsCta")}
                  </button>
                  {selected.size > 0 && selectedPayableItems.length === 0 ? (
                    <p className="text-center text-[12px] font-medium text-zinc-500 sm:text-right [html[data-theme='light']_&]:text-zinc-600">
                      {t("cart.checkout.allOwned")}
                    </p>
                  ) : selectedPayableItems.length === 0 ? (
                    <p className="text-center text-[12px] font-medium text-zinc-500 sm:text-right [html[data-theme='light']_&]:text-zinc-600">
                      {t("cart.checkout.noPayable")}
                    </p>
                  ) : gemBalance != null && gemBalance < payableGemsTotal ? (
                    <p className="text-center text-[12px] font-medium text-amber-400 sm:text-right [html[data-theme='light']_&]:text-amber-700">
                      {t("gems.insufficient.lead")}
                    </p>
                  ) : null}
                  {checkoutError ? (
                    <p
                      className="text-center text-[12px] font-medium leading-relaxed text-[color:var(--reels-point)] sm:text-right"
                      role="alert"
                    >
                      {checkoutError}
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </footer>
        </>
      )}
      {insufficientModal && (
        <InsufficientCreditsModal
          required={insufficientModal.required}
          balance={insufficientModal.balance}
          onClose={() => setInsufficientModal(null)}
        />
      )}
    </main>
  );
}
