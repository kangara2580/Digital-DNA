import { BRAND_PINK_HEX } from "@/lib/brandPinkTokens";

/**
 * 로그인·회원가입 모달/페이지 공통 색 (레퍼런스: #192731, #2a3843, #4f6172, 브랜드 핑크).
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
 * 카드 패널(테두리 안) — 짙은 톤 유지하되 과한 검정·불투명은 피하고 블러로 배경이 살짝 비치게.
 */
export const authModalDialogSurface =
  "border border-white/[0.22] bg-[linear-gradient(180deg,rgba(255,255,255,0.075)_0%,transparent_48%),linear-gradient(167deg,rgba(26,28,38,0.68)_0%,rgba(18,20,30,0.74)_44%,rgba(13,15,24,0.80)_100%)] backdrop-blur-md saturate-[1.06]";

/**
 * 로그인·회원가입 모달 카드 — `overflow-y-auto`는 `authModalGlow*`의 음수 offset 때문에
 * 가로·세로 스크롤 트랙이 잡히는 경우가 있어 숨김(글로우는 카드 안에서 클립).
 */
export const authModalDialogClipNoScroll =
  "max-h-[min(92vh,760px)] overflow-x-hidden overflow-y-hidden";

/** 카드 우측 상단 닫기(X) — 진한 회색 테두리·글자 + 밝은 배경 블룸 위에서 대비 확보 */
export const authModalDismissButtonCls =
  "absolute right-4 top-4 z-[1] inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-[1.05rem] font-semibold leading-none text-black shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition hover:bg-zinc-50 hover:text-black";

/** 브랜드 포인트 — Google CTA 화살표 등 (globals --reels-point 와 동일) */
export const AUTH_MODAL_BRAND_PINK_HEX = BRAND_PINK_HEX;

/** Google CTA 우측 화살표 — 크기만 (색은 Chevron stroke 로 고정; 버튼 text 색 물림 방지) */
export const authModalGoogleChevronClass =
  "h-8 w-8 shrink-0 text-[color:var(--reels-point)] sm:h-[2.125rem] sm:w-[2.125rem]";

export const authModalGlowTop =
  "pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[color:var(--reels-point)]/14 blur-3xl";
export const authModalGlowBottom =
  "pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-[#4f6172]/18 blur-3xl";

export const authModalGoogleButtonShadow =
  "shadow-[0_18px_38px_-20px_rgba(255,45,141,0.42),0_14px_32px_-18px_rgba(255,255,255,0.52)]";

/** Google CTA 라벨 («Google로 바로 시작») — 아이콘·패딩에 맞춘 한 줄 크기 */
const googleOAuthCtaLabelText =
  "text-[clamp(1.0625rem,3.05vw,1.21875rem)]";

/** 모달 {@link AuthModalGoogleStartButton} */
export const authModalGoogleButtonText = googleOAuthCtaLabelText;

/** /login {@link GoogleOAuthButton} — 모달과 동일 타이포 */
export const loginPageGoogleButtonText = googleOAuthCtaLabelText;

export const loginPageAmbientBg =
  "bg-[radial-gradient(circle_at_18%_12%,rgba(255,45,141,0.2),transparent_44%),radial-gradient(circle_at_82%_88%,rgba(79,97,114,0.28),transparent_46%),linear-gradient(180deg,#192731_0%,#161f28_52%,#0f1419_100%)]";
