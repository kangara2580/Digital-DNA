"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AuthPromptModal } from "@/components/AuthPromptModal";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import { markOAuthFlowStarted } from "@/lib/authOAuthPending";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type AuthPromptModalContextValue = {
  openAuthModal: () => void;
  closeAuthModal: () => void;
};

const AuthPromptModalContext = createContext<AuthPromptModalContextValue | null>(null);

export function AuthPromptModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const closeAuthModal = useCallback(() => setOpen(false), []);
  const openAuthModal = useCallback(() => setOpen(true), []);

  const startGoogleAuth = useCallback(async () => {
    const next =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : "/";
    const redirectTo = buildAuthCallbackRedirectTo(next);
    markOAuthFlowStarted();
    const supabase = getSupabaseBrowserClient();
    if (supabase && redirectTo) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });
      if (!error && data.url) {
        window.location.assign(data.url);
        return;
      }
    }
    window.location.assign(`/api/auth/google/start?next=${encodeURIComponent(next)}`);
  }, []);

  const value = useMemo(
    () => ({ openAuthModal, closeAuthModal }),
    [openAuthModal, closeAuthModal],
  );

  return (
    <AuthPromptModalContext.Provider value={value}>
      {children}
      <AuthPromptModal
        open={open}
        onClose={closeAuthModal}
        onGoogleStart={() => void startGoogleAuth()}
      />
    </AuthPromptModalContext.Provider>
  );
}

export function useAuthPromptModal(): AuthPromptModalContextValue {
  const ctx = useContext(AuthPromptModalContext);
  if (!ctx) {
    throw new Error("useAuthPromptModal must be used within AuthPromptModalProvider");
  }
  return ctx;
}
