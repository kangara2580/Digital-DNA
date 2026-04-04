import Link from "next/link";
import type { ReactNode } from "react";

const iconClass = "h-[18px] w-[18px] shrink-0";

function IconBag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.55}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
      <path d="M5 8h14l1.2 13H3.8L5 8z" />
      <path d="M9 12h6" />
    </svg>
  );
}

function IconFilm({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.55}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <rect x="4" y="5" width="16" height="14" rx="2.5" />
      <path d="M4 9.5h16M4 14.5h16M8 5v14M12 5v14M16 5v14" />
    </svg>
  );
}

function IconTag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.55}
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 10.5l8.5-6.5L21 12l-8.5 8.5a2 2 0 01-2.83 0L4 13.33V10.5z" />
      <circle cx="8" cy="9" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconSpark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.55}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function IconOrbit({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.55}
      className={className}
      aria-hidden
    >
      <ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(-25 12 12)" />
      <circle cx="18" cy="9" r="2" />
      <circle cx="7" cy="15" r="1.5" />
      <circle cx="12" cy="12" r="1.8" />
    </svg>
  );
}

const primary: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/", label: "구매", icon: <IconBag className={iconClass} /> },
  { href: "/", label: "제작", icon: <IconFilm className={iconClass} /> },
  { href: "/", label: "판매", icon: <IconTag className={iconClass} /> },
];

const secondary: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/?sort=recommended", label: "추천", icon: <IconSpark className={iconClass} /> },
  { href: "/", label: "탐색", icon: <IconOrbit className={iconClass} /> },
];

function NavButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[14px] leading-snug tracking-tight text-slate-800 transition-colors duration-300 ease-out hover:bg-slate-100/90 hover:text-slate-950"
    >
      <span className="text-slate-400 transition-colors duration-300 ease-out group-hover:text-slate-600">
        {icon}
      </span>
      <span className="min-w-0">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-[var(--header-height)] z-30 hidden h-[calc(100vh-var(--header-height))] w-[148px] flex-col overflow-y-auto border-r border-slate-200/90 bg-white/95 px-2 py-3 backdrop-blur-sm md:flex"
      aria-label="스튜디오 메뉴"
    >
      <div className="flex flex-1 flex-col gap-3">
        <nav className="flex flex-col gap-0.5" aria-label="구매·제작·판매 메뉴">
          {primary.map((item) => (
            <NavButton key={item.label} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </nav>

        <div className="h-px w-full bg-slate-200/90" />

        <nav className="flex flex-col gap-0.5" aria-label="추천·탐색">
          {secondary.map((item) => (
            <NavButton key={item.label} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </nav>
      </div>
    </aside>
  );
}
