import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.signup",
    descriptionKey: "meta.signupDescription",
  });
}

export default function SignupPage() {
  redirect("/login");
}
