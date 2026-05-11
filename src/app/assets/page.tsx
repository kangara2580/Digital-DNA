import { redirect } from "next/navigation";
import { ASSETS_CREDIT_PAYMENT } from "@/lib/assetsPaths";

export default function AssetsIndexPage() {
  redirect(ASSETS_CREDIT_PAYMENT);
}
