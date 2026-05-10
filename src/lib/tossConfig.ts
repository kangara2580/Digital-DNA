export type TossCheckoutPurpose = "credits" | "video";

export type TossCreditPackKey = "starter" | "creator" | "studio";

export type TossCreditPack = {
  key: TossCreditPackKey;
  name: string;
  credits: number;
  priceKrw: number;
  description: string;
};

export const tossCreditPacks: TossCreditPack[] = [
  {
    key: "starter",
    name: "Starter",
    credits: 2200,
    priceKrw: 9900,
    description: "AI 편집 입문용 크레딧 팩",
  },
  {
    key: "creator",
    name: "Creator",
    credits: 6200,
    priceKrw: 24900,
    description: "가장 추천하는 크리에이터 작업 팩",
  },
  {
    key: "studio",
    name: "Studio",
    credits: 15500,
    priceKrw: 59900,
    description: "브랜드/대행사 반복 제작용 팩",
  },
];

export function getTossCreditPack(key: string | null | undefined): TossCreditPack | null {
  return tossCreditPacks.find((pack) => pack.key === key) ?? null;
}

export function getTossEnvStatus() {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim();
  const secretKey = process.env.TOSS_SECRET_KEY?.trim();
  return {
    hasClientKey: Boolean(clientKey),
    hasSecretKey: Boolean(secretKey),
  };
}

export function getTossClientKey(): string | null {
  return process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim() || null;
}

export function getTossSecretKey(): string {
  const secretKey = process.env.TOSS_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("TOSS_SECRET_KEY is required.");
  }
  return secretKey;
}

export function getSiteUrl(): string {
  const value =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    "https://ara.pink";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value.replace(/\/$/, "");
  }
  return `https://${value.replace(/\/$/, "")}`;
}

export function createTossOrderId(prefix: TossCheckoutPurpose): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 64);
}

export function platformFeeRateBps(): number {
  const value = Number(process.env.PLATFORM_FEE_BPS ?? "1000");
  if (!Number.isFinite(value)) return 1000;
  return Math.min(5000, Math.max(0, Math.floor(value)));
}

export function settlementHoldDays(): number {
  const value = Number(process.env.SELLER_SETTLEMENT_HOLD_DAYS ?? "7");
  if (!Number.isFinite(value)) return 7;
  return Math.min(60, Math.max(0, Math.floor(value)));
}
