/**
 * 로그인·회원가입 모달/페이지 공통 색 (레퍼런스: #192731, #2a3843, #4f6172, #ff096c).
 */
export const authModalBackdropBlurStrong =
  "bg-[#192731]/68 px-4 backdrop-blur-[6px]";
export const authModalBackdropBlurSoft =
  "bg-[#192731]/68 px-4 backdrop-blur-[4px]";

/** 거의 불투명 베이스 + 위쪽만 살짝 핑크/그레이 틴트(뒷배경 비침 줄임) */
export const authModalDialogSurface =
  "border border-white/16 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,9,108,0.2)_0%,rgba(74,93,109,0.22)_42%,transparent_62%),linear-gradient(180deg,rgb(26,39,49)_0%,rgb(22,34,43)_52%,rgb(20,31,39)_100%)]";

export const authModalGlowTop =
  "pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[#ff096c]/14 blur-3xl";
export const authModalGlowBottom =
  "pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-[#4f6172]/18 blur-3xl";

export const authModalGoogleButtonShadow =
  "shadow-[0_18px_38px_-20px_rgba(255,9,108,0.4),0_14px_32px_-18px_rgba(255,255,255,0.52)]";

/** 모달·오버레이 내 Google 라벨: 기존보다 약 +2px */
export const authModalGoogleButtonText =
  "text-[clamp(1.1875rem,4.05vw,1.4375rem)]";

/** /login 전용(조금 작은 카드 버튼) — 동일하게 +2px */
export const loginPageGoogleButtonText =
  "text-[clamp(1.125rem,3.95vw,1.375rem)]";

export const loginPageAmbientBg =
  "bg-[radial-gradient(circle_at_18%_12%,rgba(255,9,108,0.18),transparent_44%),radial-gradient(circle_at_82%_88%,rgba(79,97,114,0.28),transparent_46%),linear-gradient(180deg,#192731_0%,#161f28_52%,#0f1419_100%)]";
