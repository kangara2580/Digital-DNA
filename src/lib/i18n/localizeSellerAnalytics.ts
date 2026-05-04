import type { SellerAnalyticsSnapshot } from "@/data/sellerAnalytics";
import type { SiteLocale } from "@/lib/sitePreferences";
import { translate } from "@/lib/i18n/dictionaries";

const FUNNEL_KO_TO_KEY: Record<string, string> = {
  노출: "analytics.demo.funnel.impression",
  "피드·목록 클릭": "analytics.demo.funnel.feedClick",
  "상세 페이지": "analytics.demo.funnel.detail",
  "장바구니·찜(추정)": "analytics.demo.funnel.cartWish",
  "결제·복제 완료": "analytics.demo.funnel.purchase",
  // demo dataset (video detail page style)
  "썸네일·제목 클릭": "analytics.demo.funnel.thumbTitle",
  "상세·미리보기": "analytics.demo.funnel.detailPreview",
  "찜·카트": "analytics.demo.funnel.wishCart",
  "결제·복제": "analytics.demo.funnel.checkout",
};

const CHANNEL_KO_TO_KEY: Record<string, string> = {
  "앱·마켓 통합 유입": "analytics.demo.channel.aggregate",
  "추천·피드": "analytics.demo.channel.feed",
  검색: "analytics.demo.channel.search",
  "연관 동영상": "analytics.demo.channel.related",
  프로필: "analytics.demo.channel.profile",
  외부: "analytics.demo.channel.external",
};

const RETENTION_KO_TO_KEY: Record<string, string> = {
  "0–3초 훅": "analytics.demo.retention.0_3",
  "3–15초": "analytics.demo.retention.3_15",
  "15–30초": "analytics.demo.retention.15_30",
  "30초 이상": "analytics.demo.retention.30p",
  "완주·루프": "analytics.demo.retention.complete",
  "0–3초": "analytics.demo.retention.0_3b",
  "3–10초": "analytics.demo.retention.3_10",
  "10–30초": "analytics.demo.retention.10_30",
  "30초+": "analytics.demo.retention.30plus",
  "완주·반복": "analytics.demo.retention.loop",
};

function localizePeriodLabel(raw: string, locale: SiteLocale): string {
  if (locale === "ko") return raw;
  const recent = raw.match(/^최근 (\d+)일$/);
  if (recent) {
    const n = recent[1];
    return n === "1" ? translate(locale, "analytics.period.last1") : translate(locale, "analytics.period.lastN", { n });
  }
  if (raw === "최근 7일") return translate(locale, "analytics.period.last7");
  if (raw === "최근 28일") return translate(locale, "analytics.period.last28");
  if (raw === "최근 90일") return translate(locale, "analytics.period.last90");
  if (raw === "최근 1일") return translate(locale, "analytics.period.last1");
  return raw;
}

function mapLabel(map: Record<string, string>, label: string, locale: SiteLocale): string {
  if (locale === "ko") return label;
  const key = map[label];
  return key ? translate(locale, key) : label;
}

/** Clone snapshot with funnel/channel/retention/period strings for `en`. */
export function localizeSellerAnalyticsSnapshot(
  snapshot: SellerAnalyticsSnapshot,
  locale: SiteLocale,
): SellerAnalyticsSnapshot {
  if (locale === "ko") return snapshot;
  return {
    ...snapshot,
    periodLabel: localizePeriodLabel(snapshot.periodLabel, locale),
    funnel: snapshot.funnel.map((s) => ({
      ...s,
      label: mapLabel(FUNNEL_KO_TO_KEY, s.label, locale),
    })),
    channels: snapshot.channels.map((c) => ({
      ...c,
      label: mapLabel(CHANNEL_KO_TO_KEY, c.label, locale),
    })),
    retention: snapshot.retention.map((r) => ({
      ...r,
      label: mapLabel(RETENTION_KO_TO_KEY, r.label, locale),
    })),
  };
}
