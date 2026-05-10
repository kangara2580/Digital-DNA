import { Polar } from "@polar-sh/sdk";

export type CreditPackKey = "starter" | "creator" | "studio";

export type CreditPack = {
  key: CreditPackKey;
  name: string;
  description: string;
  credits: number;
  priceUsd: number;
  estimatedUses: string;
  productEnvName: string;
};

export const creditPacks: CreditPack[] = [
  {
    key: "starter",
    name: "Starter",
    description: "릴스 구매 후 기본 AI 변형까지 가능한 입문 팩",
    credits: 2200,
    priceUsd: 9.99,
    estimatedUses: "기본 편집 2-4회",
    productEnvName: "POLAR_CREDITS_STARTER_PRODUCT_ID",
  },
  {
    key: "creator",
    name: "Creator",
    description: "가장 추천하는 구매자/크리에이터 작업 팩",
    credits: 6200,
    priceUsd: 24.99,
    estimatedUses: "캠페인 시안 6-10회",
    productEnvName: "POLAR_CREDITS_CREATOR_PRODUCT_ID",
  },
  {
    key: "studio",
    name: "Studio",
    description: "브랜드/대행사 반복 제작용 대용량 팩",
    credits: 15500,
    priceUsd: 59.99,
    estimatedUses: "운영 제작 15회 이상",
    productEnvName: "POLAR_CREDITS_STUDIO_PRODUCT_ID",
  },
];

export function getCreditPack(key: string | null | undefined): CreditPack | null {
  return creditPacks.find((pack) => pack.key === key) ?? null;
}

export function getCreditPackProductId(pack: CreditPack): string | null {
  return process.env[pack.productEnvName]?.trim() || null;
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

export function getPolarEnvStatus() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET?.trim();
  const server = process.env.POLAR_SERVER === "production" ? "production" : "sandbox";

  return {
    server,
    hasAccessToken: Boolean(accessToken),
    hasWebhookSecret: Boolean(webhookSecret),
    configuredProductKeys: creditPacks
      .filter((pack) => Boolean(getCreditPackProductId(pack)))
      .map((pack) => pack.key),
  };
}

export function createPolarClient(): Polar {
  const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    throw new Error("POLAR_ACCESS_TOKEN is required.");
  }

  return new Polar({
    accessToken,
    server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
  });
}
