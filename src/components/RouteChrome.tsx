"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ARAFooter } from "@/components/ARAFooter";
import { DnaBuilderDock } from "@/components/DnaBuilderDock";
import { FloatingHelp } from "@/components/FloatingHelp";
import { MallTopNav } from "@/components/MallTopNav";
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

export function RouteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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
    <>
      <ReelsLeftRail />
      <div className="min-w-0 md:pl-[var(--reels-rail-w)]">
        <MallTopNav />
        {children}
        <ARAFooter />
        <DnaBuilderDock />
        <FloatingHelp />
      </div>
    </>
  );
}
