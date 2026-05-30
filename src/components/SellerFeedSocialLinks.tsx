"use client";

import { SellerSocialLinkIcons } from "@/components/SellerSocialLinkIcons";
import { useSellerSocialLinks } from "@/hooks/useSellerSocialLinks";
import type { SellerSocialLink } from "@/lib/sellerSocialLinks";

type Props = {
  sellerId: string;
  initialLinks?: SellerSocialLink[];
  size?: "xs" | "sm" | "md";
  className?: string;
};

export function SellerFeedSocialLinks({
  sellerId,
  initialLinks = [],
  size = "md",
  className = "",
}: Props) {
  const links = useSellerSocialLinks(sellerId, initialLinks);
  return <SellerSocialLinkIcons links={links} size={size} className={className} />;
}
