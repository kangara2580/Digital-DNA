import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function FooterLegalPageShell({ title, description, children }: Props) {
  return (
    <div className="min-h-[60vh] text-[var(--foreground,#fafafa)] [html[data-theme='light']_&]:bg-white [html[data-theme='dark']_&]:bg-transparent">
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <nav className="mb-8 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
          <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">{title}</span>
        </nav>
        <h1 className="text-2xl font-extrabold tracking-tight [html[data-theme='light']_&]:text-zinc-900 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {description}
          </p>
        ) : null}
        <div className="reels-glass-card mt-8 rounded-2xl p-6 sm:p-8">
          {children ?? (
            <p className="text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              상세 페이지는 준비 중입니다. 정책 확정 시 본문이 게시됩니다.
            </p>
          )}
        </div>
        <p className="mt-8 text-center text-[12px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
          <Link href="/" className="font-semibold text-reels-cyan hover:underline">
            홈으로 돌아가기
          </Link>
        </p>
      </main>
    </div>
  );
}
