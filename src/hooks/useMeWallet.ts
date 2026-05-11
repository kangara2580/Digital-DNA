"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";

export type WalletPayload = {
  ok: true;
  balance: number;
  balanceUpdatedAt: string | null;
  ledger: {
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    reason: string;
    createdAt: string;
  }[];
  payments: {
    id: string;
    provider: string;
    productKey: string;
    status: string;
    amountCents: number;
    currency: string;
    credits: number;
    createdAt: string;
    paidAt: string | null;
  }[];
  settlement: {
    availableAmount: number;
    pendingAmount: number;
    requestedAmount: number;
    paidAmount: number;
  };
  settlementRequests: {
    id: string;
    amount: number;
    status: string;
    bankName: string | null;
    accountNo: string | null;
    accountHolder: string | null;
    createdAt: string;
  }[];
  toss: { hasClientKey: boolean; hasSecretKey: boolean };
  policy: { settlementHoldDays: number; platformFeeRateBps: number };
};

export function useMeWallet() {
  const { user } = useAuthSession();
  const { t } = useTranslation();

  const [wallet, setWallet] = useState<WalletPayload | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const loadWallet = useCallback(async () => {
    if (!user) return;
    setWalletLoading(true);
    setWalletError(null);
    try {
      const res = await fetch("/api/me/wallet", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as
        | WalletPayload
        | { ok?: false; error?: string }
        | null;
      if (!res.ok || !data || data.ok !== true) {
        throw new Error("load_failed");
      }
      setWallet(data);
    } catch {
      setWalletError(t("assets.errLoad"));
      setWallet(null);
    } finally {
      setWalletLoading(false);
    }
  }, [t, user]);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  return { wallet, walletError, walletLoading, loadWallet };
}
