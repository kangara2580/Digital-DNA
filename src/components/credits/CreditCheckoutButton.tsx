"use client";

import { PolarCheckoutButton } from "@/components/payments/PolarCheckoutButton";
import { useTranslation } from "@/hooks/useTranslation";
import type { CreditPackKey } from "@/lib/polarConfig";

export function CreditCheckoutButton({
  productKey,
  disabled,
}: {
  productKey: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <PolarCheckoutButton
      packKey={productKey as CreditPackKey}
      disabled={disabled}
    >
      {t("assets.pack.buy")}
    </PolarCheckoutButton>
  );
}
