import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    titleKey: "meta.cart",
    descriptionKey: "meta.cartDescription",
  });
}

export default function CartLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
