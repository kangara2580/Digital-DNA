"use client";

import { useEffect, useState } from "react";
import {
  loadSellerSocialLinks,
  setSellerSocialLinksCache,
} from "@/lib/loadSellerSocialLinks";
import type { SellerSocialLink } from "@/lib/sellerSocialLinks";

export function useSellerSocialLinks(
  sellerId: string | null | undefined,
  initialLinks?: SellerSocialLink[],
) {
  const [links, setLinks] = useState<SellerSocialLink[]>(initialLinks ?? []);

  useEffect(() => {
    setLinks(initialLinks ?? []);
  }, [initialLinks, sellerId]);

  useEffect(() => {
    if (!sellerId) {
      setLinks([]);
      return;
    }
    if ((initialLinks?.length ?? 0) > 0) {
      setSellerSocialLinksCache(sellerId, initialLinks ?? []);
      return;
    }
    let cancelled = false;
    void loadSellerSocialLinks(sellerId).then((loaded) => {
      if (!cancelled) setLinks(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [sellerId, initialLinks]);

  useEffect(() => {
    if (!sellerId) return;
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent<{
        sellerId?: string;
        links?: SellerSocialLink[];
      }>).detail;
      if (!detail || detail.sellerId !== sellerId || !Array.isArray(detail.links)) return;
      setSellerSocialLinksCache(sellerId, detail.links);
      setLinks(detail.links);
    };
    window.addEventListener("seller-social-links-updated", handler as EventListener);
    return () => {
      window.removeEventListener("seller-social-links-updated", handler as EventListener);
    };
  }, [sellerId]);

  return links;
}
