import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.authHub",
    descriptionKey: "meta.authHubDescription",
  });
}

/** `/auth` 직접 방문 시 로그인으로 통합 (OAuth 콜백은 `auth/callback` 라우트가 처리) */
export default function AuthHubPage() {
  redirect("/login");
}
