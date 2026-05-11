import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

/** Legacy recharge URL. Real credit purchases now run through Polar. */
export default function RechargeRedirectPage() {
  redirect("/credits");
}
