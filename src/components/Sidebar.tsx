import Link from "next/link";

const primary = [
  { href: "/", label: "릴스 구매" },
  { href: "/", label: "릴스 제작" },
  { href: "/", label: "릴스 판매" },
];

const secondary = [
  { href: "/?sort=recommended", label: "추천" },
  { href: "/?sort=latest", label: "정렬" },
];

function NavButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-1.5 text-left text-[12px] leading-snug tracking-tight text-slate-500 transition-colors hover:bg-violet-500/10 hover:text-violet-700"
    >
      {label}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[188px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/80 px-3 py-8">
      <div className="flex flex-1 flex-col gap-6">
        <nav className="flex flex-col gap-0.5" aria-label="릴스 메뉴">
          {primary.map((item) => (
            <NavButton key={item.label} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="h-px w-full bg-slate-200" />

        <nav className="flex flex-col gap-0.5" aria-label="정렬">
          {secondary.map((item) => (
            <NavButton key={item.label} href={item.href} label={item.label} />
          ))}
        </nav>
      </div>
    </aside>
  );
}
