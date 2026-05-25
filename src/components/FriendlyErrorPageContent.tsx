import Link from "next/link";
import {
  araHeroWordmarkClassName,
  araWordmarkFontStyle,
} from "@/lib/araBrandTypography";
import {
  BRAND_PINK_OUTLINE_BUTTON_CLASS,
  BRAND_PRIMARY_BUTTON_CLASS,
} from "@/lib/brandPrimaryButton";
import { translate } from "@/lib/i18n/dictionaries";
import type { SiteLocale } from "@/lib/sitePreferences";

type Props = {
  locale: SiteLocale;
  /** route `error.tsx` — 같은 화면에서 재시도 */
  onRetry?: () => void;
};

/**
 * 배포 환경에서도 기술 메시지(DATABASE_URL 등)를 노출하지 않는 공통 오류 UI.
 * 404(`NotFoundPageContent`)와 동일한 ARA 브랜드 레이아웃.
 */
export function FriendlyErrorPageContent({ locale, onRetry }: Props) {
  return (
    <main className="relative flex min-h-[min(100dvh,100svh)] flex-col items-center justify-center overflow-hidden px-4 py-16 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] pt-[max(2rem,env(safe-area-inset-top))] text-center text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(255,45,141,0.12),transparent_55%)] [html[data-theme='light']_&]:bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(255,45,141,0.08),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent [html[data-theme='light']_&]:from-zinc-100/80"
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <p
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--reels-point)]"
          aria-hidden
        >
          {translate(locale, "error.friendlyKicker")}
        </p>
        <p
          className={`${araHeroWordmarkClassName} mt-4 text-[clamp(2.5rem,12vw,3.25rem)] leading-none`}
          style={araWordmarkFontStyle}
        >
          ARA
        </p>
        <h1 className="mt-5 text-[clamp(1.125rem,4.5vw,1.375rem)] font-extrabold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
          {translate(locale, "error.friendlyHeading")}
        </h1>
        <p className="mt-3 max-w-[22rem] text-[15px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          {translate(locale, "error.friendlyBody")}
        </p>

        <div className="mt-9 flex w-full max-w-[18rem] flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className={`${BRAND_PRIMARY_BUTTON_CLASS} h-12 w-full px-8 text-[15px] sm:min-w-[10.5rem] sm:w-auto`}
            >
              {translate(locale, "error.friendlyRetry")}
            </button>
          ) : null}
          <Link
            href="/"
            className={`${
              onRetry ? BRAND_PINK_OUTLINE_BUTTON_CLASS : BRAND_PRIMARY_BUTTON_CLASS
            } h-12 w-full px-8 text-[15px] sm:min-w-[10.5rem] sm:w-auto`}
          >
            {translate(locale, "meta.notFoundHome")}
          </Link>
          <Link
            href="/explore"
            className={`${BRAND_PINK_OUTLINE_BUTTON_CLASS} h-12 w-full px-8 text-[15px] sm:min-w-[10.5rem] sm:w-auto`}
          >
            {translate(locale, "meta.notFoundExplore")}
          </Link>
        </div>
      </div>
    </main>
  );
}
