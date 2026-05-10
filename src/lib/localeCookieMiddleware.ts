import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { STORAGE_LOCALE } from "@/lib/sitePreferences";
import { parseAcceptLanguageLocale } from "@/lib/localeNegotiation";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * If `reels-locale` is absent, set it from `Accept-Language` so SSR metadata and
 * `<html lang>` match the user on the first byte.
 */
export function attachLocalePreferenceCookie(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  let effective: "ko" | "en";
  const cur = request.cookies.get(STORAGE_LOCALE)?.value;
  if (cur === "ko" || cur === "en") {
    effective = cur;
  } else {
    effective = parseAcceptLanguageLocale(request.headers.get("accept-language"));
    response.cookies.set(STORAGE_LOCALE, effective, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  response.headers.set("Content-Language", effective === "en" ? "en" : "ko");
  return response;
}
