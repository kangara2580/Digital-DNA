"use client";

import type { ReactNode } from "react";
import { SitePreferencesProvider } from "@/context/SitePreferencesContext";
import { DopamineBasketProvider } from "@/context/DopamineBasketContext";
import { PurchasedVideosProvider } from "@/context/PurchasedVideosContext";
import { RecentClipsProvider } from "@/context/RecentClipsContext";
import { WishlistProvider } from "@/context/WishlistContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SitePreferencesProvider>
      <WishlistProvider>
        <RecentClipsProvider>
          <DopamineBasketProvider>
            <PurchasedVideosProvider>{children}</PurchasedVideosProvider>
          </DopamineBasketProvider>
        </RecentClipsProvider>
      </WishlistProvider>
    </SitePreferencesProvider>
  );
}
