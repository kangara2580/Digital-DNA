"use client";

import Link from "next/link";
import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthPromptModal } from "@/components/AuthPromptModalProvider";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import { MOBILE_BOTTOM_NAV_ITEMS } from "@/lib/mobileNavItems";

const NAV_HEIGHT = "4.25rem";

const itemClass =
  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 no-underline outline-none transition-colors";

const iconWrap =
  "flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-colors [html[data-theme='light']_&]:text-zinc-600";

const iconActive =
  "!text-[color:var(--reels-point)] [html[data-theme='light']_&]:!text-[color:var(--reels-point)]";

const labelBase =
  "max-w-full truncate text-center text-[10px] font-semibold leading-tight text-zinc-500 [html[data-theme='light']_&]:text-zinc-600";

const labelActive =
  "text-[color:var(--reels-point)] [html[data-theme='light']_&]:text-[color:var(--reels-point)]";

function isExplorePath(pathname: string) {
  return pathname === "/explore" || pathname.startsWith("/explore/");
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuthSession();
  const { openAuthModal } = useAuthPromptModal();
  const guest = !authLoading && !user;
  const onExplore = isExplorePath(pathname);
  const [exploreNavOpen, setExploreNavOpen] = useState(false);

  useEffect(() => {
    if (!onExplore) setExploreNavOpen(false);
  }, [onExplore]);

  const navVisible = !onExplore || exploreNavOpen;
  const navHeight = navVisible ? NAV_HEIGHT : "0px";

  useEffect(() => {
    document.documentElement.style.setProperty("--mobile-bottom-nav-h", navHeight);
    document.documentElement.dataset.exploreBottomNav =
      onExplore && !exploreNavOpen ? "hidden" : "visible";
    return () => {
      document.documentElement.style.removeProperty("--mobile-bottom-nav-h");
      delete document.documentElement.dataset.exploreBottomNav;
    };
  }, [navHeight, onExplore, exploreNavOpen]);

  return (
    <>
      {onExplore && !exploreNavOpen ? (
        <button
          type="button"
          onClick={() => setExploreNavOpen(true)}
          className="fixed bottom-[max(0.65rem,env(safe-area-inset-bottom,0px))] left-1/2 z-[56] flex h-9 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/90 shadow-lg backdrop-blur-md transition hover:bg-black/65 active:scale-95 md:hidden [html[data-theme='light']_&]:border-zinc-300/80 [html[data-theme='light']_&]:bg-white/75 [html[data-theme='light']_&]:text-zinc-800"
          aria-label={t("explore.mobile.navReveal")}
          aria-expanded={false}
        >
          <ChevronUp className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}

      <nav
        className={`fixed inset-x-0 bottom-0 z-[55] border-t border-white/10 bg-reels-abyss/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-300 ease-out md:hidden [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/95 ${
          navVisible ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        aria-label={t("rail.quickNav")}
        aria-hidden={!navVisible}
      >
        {onExplore && exploreNavOpen ? (
          <button
            type="button"
            onClick={() => setExploreNavOpen(false)}
            className="absolute -top-9 left-1/2 z-[1] flex h-8 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/90 backdrop-blur-md [html[data-theme='light']_&]:border-zinc-300/80 [html[data-theme='light']_&]:bg-white/80 [html[data-theme='light']_&]:text-zinc-800"
            aria-label={t("explore.mobile.navHide")}
          >
            <ChevronUp className="h-4 w-4 rotate-180" strokeWidth={2.5} aria-hidden />
          </button>
        ) : null}
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-0.5 pt-0.5">
          {MOBILE_BOTTOM_NAV_ITEMS.map(({ href, labelKey, Icon, isActive, guestOpensAuth }) => {
            const on = isActive(pathname);
            const label = t(labelKey);
            const inner = (
              <>
                <span className={`${iconWrap} ${on ? iconActive : ""}`}>
                  <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </span>
                <span className={`${labelBase} ${on ? labelActive : ""}`}>{label}</span>
              </>
            );

            if (guestOpensAuth && guest) {
              return (
                <button
                  key={href}
                  type="button"
                  onClick={() => openAuthModal()}
                  className={itemClass}
                  aria-label={t("rail.sellAria")}
                >
                  {inner}
                </button>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={itemClass}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
