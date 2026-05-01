/**
 * 로그인·회원가입 모달/페이지 공통 색 (레퍼런스: #192731, #2a3843, #4f6172, #ff096c).
 * 오버레이는 높은 불투명도 + 블러, 카드 패널은 불투명 그라데이션으로 배경 분리를 유지합니다.
 */

/** 로그인 모달 포털 — 레일·헤더·탐색 레이어(z≤120) 위 */
export const authModalOverlayLayout =
  "fixed inset-0 z-[500] flex items-center justify-center";

/** 어디서 열려도 동일 강도 — 딤·블러 */
export const authModalBackdropBlurStrong =
  "bg-black/84 px-4 backdrop-blur-2xl backdrop-saturate-[1.12]";
/** 상단 헤더 등 — Strong과 동일 톤 유지 */
export const authModalBackdropBlurSoft =
  "bg-black/82 px-4 backdrop-blur-2xl backdrop-saturate-[1.1]";

/** /login 등 풀스크린 딤 레이어(패딩 없음) */
export const authLoginPageScrim =
  "bg-black/86 backdrop-blur-2xl backdrop-saturate-[1.12]";

/** 완전 불투명 베이스 그라데이션 + 브랜드 포인트는 내부 글로 레이어링 */
export const authModalDialogSurface =
  "border border-white/[0.26] bg-[linear-gradient(168deg,#2f4558_0%,#263b4d_38%,#1e3040_71%,#1a2934_100%)] backdrop-blur-sm";

export const authModalGlowTop =
  "pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[#ff096c]/14 blur-3xl";
export const authModalGlowBottom =
  "pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-[#4f6172]/18 blur-3xl";

export const authModalGoogleButtonShadow =
  "shadow-[0_18px_38px_-20px_rgba(255,9,108,0.4),0_14px_32px_-18px_rgba(255,255,255,0.52)]";

/** 모달·오버레이 내 Google 라벨 — 조금 더 크게 */
export const authModalGoogleButtonText =
  "text-[clamp(1.375rem,4.55vw,1.625rem)]";

/** /login 전용(버튼 카드) */
export const loginPageGoogleButtonText =
  "text-[clamp(1.25rem,4.2vw,1.5rem)]";

export const loginPageAmbientBg =
  "bg-[radial-gradient(circle_at_18%_12%,rgba(255,9,108,0.18),transparent_44%),radial-gradient(circle_at_82%_88%,rgba(79,97,114,0.28),transparent_46%),linear-gradient(180deg,#192731_0%,#161f28_52%,#0f1419_100%)]";
