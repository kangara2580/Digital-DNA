"use client";

import { useFormStatus } from "react-dom";

/**
 * Drop-in replacement for <button> inside server-action <form>s.
 * Shows a spinner + disabled state while the action is in flight.
 *
 * Usage: replace <button ...>label</button> with
 *        <AdminSubmitButton ...>label</AdminSubmitButton>
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
          <svg
            className="h-4 w-4 animate-spin text-current"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
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
      <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-md">
        <svg
          className="h-5 w-5 animate-spin text-slate-600"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span className="text-sm font-bold text-slate-600">처리 중...</span>
      </div>
    </div>
  );
}
