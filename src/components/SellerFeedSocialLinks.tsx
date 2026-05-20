"use client";

import { SellerSocialLinkIcons } from "@/components/SellerSocialLinkIcons";
import { useSellerSocialLinks } from "@/hooks/useSellerSocialLinks";
import type { SellerSocialLink } from "@/lib/sellerSocialLinks";

type Props = {
  sellerId: string;
  initialLinks?: SellerSocialLink[];
};

export function SellerFeedSocialLinks({ sellerId, initialLinks = [] }: Props) {
  const links = useSellerSocialLinks(sellerId, initialLinks);
  return <SellerSocialLinkIcons links={links} size="md" className="mt-3" />;
}
