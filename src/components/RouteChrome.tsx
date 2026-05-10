"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ARAFooter } from "@/components/ARAFooter";
import { DnaBuilderDock } from "@/components/DnaBuilderDock";
import { FloatingHelp } from "@/components/FloatingHelp";
import { MallTopNav } from "@/components/MallTopNav";
import { ReelsLeftRail } from "@/components/ReelsLeftRail";

const immersiveRoutes = new Set(["/through-sliding-doors"]);

export function RouteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const immersive = immersiveRoutes.has(pathname);

  if (immersive) {
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
