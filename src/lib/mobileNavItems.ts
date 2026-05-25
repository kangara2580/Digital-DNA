import type { ComponentType } from "react";
import { Compass, Home, Plus, Trophy } from "lucide-react";
import { ShopBagOutlineIcon } from "@/components/ShopBagOutlineIcon";

export type MobileNavItem = {
  href: string;
  labelKey: string;
  Icon: ComponentType<{
    className?: string;
    strokeWidth?: number;
    "aria-hidden"?: boolean;
  }>;
  isActive: (pathname: string) => boolean;
  guestOpensAuth?: boolean;
};

export const MOBILE_BOTTOM_NAV_ITEMS: MobileNavItem[] = [
  {
    href: "/",
    labelKey: "rail.aria.home",
    Icon: Home,
    isActive: (p) => p === "/",
  },
  {
    href: "/explore",
    labelKey: "rail.explore",
    Icon: Compass,
    isActive: (p) => p === "/explore" || p.startsWith("/explore/"),
  },
  {
    href: "/category/best",
    labelKey: "rail.shop",
    Icon: ShopBagOutlineIcon,
    isActive: (p) =>
      p === "/shop" || p.startsWith("/shop/") || p.startsWith("/category/"),
  },
  {
    href: "/leaderboard",
    labelKey: "rail.leaderboard",
    Icon: Trophy,
    isActive: (p) => p === "/leaderboard" || p.startsWith("/leaderboard/"),
  },
  {
    href: "/sell",
    labelKey: "rail.sell",
    Icon: Plus,
    isActive: (p) => p === "/sell" || p.startsWith("/sell/"),
    guestOpensAuth: true,
  },
];
