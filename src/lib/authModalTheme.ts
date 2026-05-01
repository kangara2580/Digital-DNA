/**
 * 로그인·회원가입 모달/페이지 공통 색 (레퍼런스: #192731, #2a3843, #4f6172, #ff096c).
 * 오버레이는 높은 불투명도 + 블러, 카드 패널은 불투명 그라데이션으로 배경 분리를 유지합니다.
 */

/** 전체 화면 딤(+블러) — 다이얼로그와 형제 레이어로 두어야 버튼 히트테스트 안정(backdrop-blur 부모 특성 이슈) */
export const authModalScrimPaint =
  "bg-black/92 backdrop-blur-2xl backdrop-saturate-[1.12]";

/** 로그인 모달 포털 — 레일·헤더·탐색 레이어(z≤120) 위 */
export const authModalOverlayLayout =
  "fixed inset-0 z-[500] flex items-center justify-center";

/** 레거시 단일 레이아웃(backdrop-blur+자식 버튼) — 일부 환경에서 클릭이 막히므로 {@link AuthModalPortal} 패턴 우선 */
export const authModalBackdropBlurStrong =
  "bg-black/92 px-4 backdrop-blur-2xl backdrop-saturate-[1.12]";
/** 상단 헤더 등 — Strong과 동일 톤 유지 */
export const authModalBackdropBlurSoft =
  "bg-black/88 px-4 backdrop-blur-2xl backdrop-saturate-[1.1]";

/** /login 등 풀스크린 딤 레이어(패딩 없음) */
export const authLoginPageScrim =
  "bg-black/100 backdrop-blur-2xl backdrop-saturate-[1.12]";

/**
 * 카드 패널(테두리 안) — 검정 베이스 알파 상한 1.0까지 두껍게 덮음 + 얕은 하이라이트·블러로 깊이.
 */
export const authModalDialogSurface =
  "border border-white/[0.22] bg-[linear-gradient(180deg,rgba(255,255,255,0.055)_0%,transparent_48%),linear-gradient(167deg,rgba(18,20,26,0.92)_0%,rgba(10,11,15,0.96)_46%,rgba(6,8,11,1)_100%)] backdrop-blur-md saturate-[1.06]";

/** 브랜드 포인트 — Google CTA 화살표 등 (globals --reels-point 와 동일) */
export const AUTH_MODAL_BRAND_PINK_HEX = "#ff096c";

/** Google CTA 우측 화살표 — 크기만 (색은 Chevron stroke 로 고정; 버튼 text 색 물림 방지) */
export const authModalGoogleChevronClass =
  "h-8 w-8 shrink-0 text-[#ff096c] sm:h-[2.125rem] sm:w-[2.125rem]";

export const authModalGlowTop =
  "pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[#ff096c]/14 blur-3xl";
export const authModalGlowBottom =
  "pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-[#4f6172]/18 blur-3xl";

export const authModalGoogleButtonShadow =
  "shadow-[0_18px_38px_-20px_rgba(255,9,108,0.4),0_14px_32px_-18px_rgba(255,255,255,0.52)]";

/** 모달 내 Google 라벨 전용 («Google로 바로 시작» span — 버튼 박스 키우지 않고 글씨만) */
export const authModalGoogleButtonText =
  "text-[clamp(1.75rem,5.35vw,2.1rem)]";

/** /login 동일 라벨 */
export const loginPageGoogleButtonText =
  "text-[clamp(1.65rem,5.05vw,1.95rem)]";

export const loginPageAmbientBg =
  "bg-[radial-gradient(circle_at_18%_12%,rgba(255,9,108,0.18),transparent_44%),radial-gradient(circle_at_82%_88%,rgba(79,97,114,0.28),transparent_46%),linear-gradient(180deg,#192731_0%,#161f28_52%,#0f1419_100%)]";
