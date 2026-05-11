"use client";

/**
 * 내 자산 UI는 `/assets/credit-payment`·`/assets/settlement` 및
 * `AssetsCreditPaymentClient` / `AssetsSettlementClient` 로 분리되었습니다.
 * 예전 import·빌드 캐시 호환을 위해 동일 이름으로 재export만 합니다.
 */
export { AssetsCreditPaymentClient as AssetsPageClient } from "@/components/assets/AssetsCreditPaymentClient";
