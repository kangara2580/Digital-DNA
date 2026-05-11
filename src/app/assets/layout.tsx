import type { ReactNode } from "react";
import { AssetsLayoutClient } from "@/components/assets/AssetsLayoutClient";

export default function AssetsLayout({ children }: { children: ReactNode }) {
  return <AssetsLayoutClient>{children}</AssetsLayoutClient>;
}
