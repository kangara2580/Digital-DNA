"use client";

import type { ReactNode } from "react";

export function MyPageSectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-[48rem] text-[15px] leading-relaxed text-white/55 [html[data-theme='light']_&]:text-zinc-600">
          {description}
        </p>
      ) : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}
