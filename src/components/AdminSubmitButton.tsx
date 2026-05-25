"use client";

import { useFormStatus } from "react-dom";
import { AraDualSpinLogo } from "@/components/AraDualSpinLogo";
import { GlobalLoading } from "@/components/GlobalLoading";

/**
 * Drop-in replacement for <button> inside server-action <form>s.
 * Shows ARA dual-spin + disabled state while the action is in flight.
 */
export function AdminSubmitButton({
  children,
  className = "",
  pendingText,
  name,
  value,
  variant = "default",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  name?: string;
  value?: string;
  variant?: "default" | "primary" | "danger" | "ghost";
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type">) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={`relative transition-all ${pending ? "pointer-events-none opacity-60" : ""} ${className}`}
      {...rest}
    >
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center">
          <AraDualSpinLogo size={16} />
        </span>
      )}
      <span className={pending ? "invisible" : ""}>{children}</span>
    </button>
  );
}

/**
 * A full-width overlay that covers the entire form while pending.
 * Place as the last child of a <form> for a page-section loading effect.
 */
export function FormPendingOverlay() {
  const { pending } = useFormStatus();

  if (!pending) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm">
      <GlobalLoading size="md" label="처리 중…" />
    </div>
  );
}
