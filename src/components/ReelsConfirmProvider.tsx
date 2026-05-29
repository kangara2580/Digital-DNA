"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { ReelsConfirmDialog } from "@/components/ReelsConfirmDialog";
import { useTranslation } from "@/hooks/useTranslation";

export type ReelsConfirmOptions = {
  message: string;
  title?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  dialogAriaLabel?: string;
};

type Pending = ReelsConfirmOptions & {
  resolve: (value: boolean) => void;
};

const ReelsConfirmContext = createContext<
  ((opts: ReelsConfirmOptions) => Promise<boolean>) | null
>(null);

export function useReelsConfirm() {
  const fn = useContext(ReelsConfirmContext);
  if (!fn) {
    throw new Error("useReelsConfirm must be used within ReelsConfirmProvider");
  }
  return fn;
}

export function ReelsConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback((opts: ReelsConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  const close = useCallback(
    (result: boolean) => {
      if (!pending) return;
      pending.resolve(result);
      setPending(null);
    },
    [pending],
  );

  return (
    <ReelsConfirmContext.Provider value={confirm}>
      {children}
      <ReelsConfirmDialog
        open={pending != null}
        title={pending?.title}
        message={pending?.message ?? ""}
        cancelLabel={pending?.cancelLabel ?? t("common.cancel")}
        confirmLabel={pending?.confirmLabel ?? t("common.confirm")}
        dialogAriaLabel={pending?.dialogAriaLabel ?? t("common.confirmDialogAria")}
        onClose={() => close(false)}
        onConfirm={() => close(true)}
      />
    </ReelsConfirmContext.Provider>
  );
}
