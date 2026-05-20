import type { Video } from "@prisma/client";
import { translate } from "@/lib/i18n/dictionaries";
import { formatPriceWon } from "@/lib/exploreLocaleFormat";
import type { SiteLocale } from "@/lib/sitePreferences";

const TYPE_PRICE_SUGGEST = "PRICE_SUGGEST";

export function priceSuggestionTitle(locale: SiteLocale = "ko"): string {
  return translate(locale, "notifications.priceSuggestTitle");
}

export function buildPriceSuggestionBody(
  video: Pick<Video, "title" | "price">,
  suggestedPrice: number,
  locale: SiteLocale = "ko",
): string {
  const vibe = translate(locale, "notifications.priceSuggestVibe");
  const suggestedLabel = formatPriceWon(locale, suggestedPrice) ?? String(suggestedPrice);
  const data = translate(locale, "notifications.priceTrend", { price: suggestedLabel });
  const from = formatPriceWon(locale, video.price) ?? String(video.price);
  const to = formatPriceWon(locale, suggestedPrice) ?? String(suggestedPrice);
  const ask = translate(locale, "notifications.priceAsk", { from, to });
  return vibe + data + ask;
}

export { TYPE_PRICE_SUGGEST };
