import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    titleKey: "meta.recent",
    descriptionKey: "meta.recentDescription",
  });
}

export default function RecentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
