import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    titleKey: "meta.likes",
    descriptionKey: "meta.likesDescription",
  });
}

export default function LikesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
