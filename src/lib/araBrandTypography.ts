/**
 * 메인 히어로 ARA와 동일 — Fredoka (`layout.tsx` · `--font-fredoka`).
 * 로그인·인증 모달에서 `font-black` + 본문 sans 대신 이 조합을 씁니다.
 */
export const araWordmarkFontStyle = {
  fontFamily: "var(--font-fredoka), ui-rounded, system-ui, sans-serif",
} as const;

/** 인증 다이얼로그·전용 로그인 페이지 — 홈 히어로 인증 모달과 동일 스케일·웨이트 */
export const araAuthDialogWordmarkClassName =
  "relative text-center text-[clamp(2.2rem,6.85vw,3.05rem)] font-semibold leading-none tracking-[0.02em] text-white";

/** 로그인 모달 ARA·「로그인/회원가입」— 라이트에서만 흰색 유지 (globals `.auth-modal-brand-headline`) */
export const authModalBrandHeadlineClassName = "auth-modal-brand-headline";

/** 메인 히어로 `<h1>` — 재사용 시 Highlight24와 동일 */
export const araHeroWordmarkClassName =
  "select-none text-[clamp(3.6rem,16.5vw,7.5rem)] font-semibold leading-none tracking-[0.02em] text-white [html[data-theme='light']_&]:text-zinc-950";

/** 아이디 찾기·비밀번호 플로우 카드 상단 ARA */
export const araAuthFlowWordmarkClassName =
  "text-center text-[clamp(1.35rem,4.5vw,1.85rem)] font-semibold leading-none tracking-[0.02em] text-white";
