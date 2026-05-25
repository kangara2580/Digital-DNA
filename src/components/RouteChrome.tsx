"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { ARAFooter } from "@/components/ARAFooter";
import { AuthPromptModalProvider } from "@/components/AuthPromptModalProvider";
import { DnaBuilderDock } from "@/components/DnaBuilderDock";
import { FloatingHelp } from "@/components/FloatingHelp";
import { MallTopNav } from "@/components/MallTopNav";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ReelsLeftRail } from "@/components/ReelsLeftRail";

const immersiveRoutes = new Set(["/through-sliding-doors"]);

const chromeExcludedPrefixes = [
  "/admin",
  "/auth",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/payments",
];

const chromeExcludedRoutes = new Set([
  "/credits",
  "/billing",
  "/billing/success",
  "/account-suspended",
]);

function isExplorePath(pathname: string) {
  return pathname === "/explore" || pathname.startsWith("/explore/");
}

export function RouteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const exploreMobile = isExplorePath(pathname);
  const immersive = immersiveRoutes.has(pathname);
  const chromeExcluded =
    chromeExcludedRoutes.has(pathname) ||
    chromeExcludedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  if (immersive || chromeExcluded) {
    return <>{children}</>;
  }

  return (
    <AuthPromptModalProvider>
      <ReelsLeftRail />
      <div
        className={`min-w-0 md:pb-0 md:pl-[var(--reels-rail-w)] ${
          exploreMobile
            ? "max-md:pb-0"
            : "pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))]"
        }`}
      >
        <Suspense fallback={null}>
          <MallTopNav />
        </Suspense>
        {children}
        <ARAFooter />
        <DnaBuilderDock />
        <FloatingHelp />
      </div>
      <MobileBottomNav />
    </AuthPromptModalProvider>
  );
}
