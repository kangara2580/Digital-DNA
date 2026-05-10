import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    titleKey: "meta.videoEdit",
    descriptionKey: "meta.videoEditDescription",
  });
}

export default function VideoEditLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
