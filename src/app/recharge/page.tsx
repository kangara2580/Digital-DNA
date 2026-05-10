import { redirect } from "next/navigation";

/** Legacy recharge URL. Real credit purchases now run through Polar. */
export default function RechargeRedirectPage() {
  redirect("/credits");
}
