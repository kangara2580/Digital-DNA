import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export function MarketingDocShell({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-[60vh] text-[var(--foreground)] [html[data-theme='light']_&]:bg-white [html[data-theme='dark']_&]:bg-transparent">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <nav className="mb-8 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
          <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">{title}</span>
        </nav>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-8 space-y-4 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
          {children}
        </div>
      </main>
    </div>
  );
}
