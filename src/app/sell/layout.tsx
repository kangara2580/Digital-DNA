import type { ReactNode } from "react";
import "./sell-scope.css";

export default function SellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0" data-page="sell">
      {children}
    </div>
  );
}
