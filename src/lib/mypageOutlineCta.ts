/**
 * 마이페이지 공통: 투명 배경 · 핑크 테두리 · 호버 리프트 (판매 등록하기와 동일 패턴).
 */
export const MYPAGE_OUTLINE_BTN_CORE =
  "inline-flex items-center justify-center rounded-full border border-[color:var(--reels-point)] bg-transparent font-semibold text-white outline-none transition-[transform,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[color:var(--reels-point)]/14 active:translate-y-0 active:scale-[0.98] motion-reduce:transition-colors motion-reduce:hover:scale-100 motion-reduce:hover:translate-y-0 [html[data-theme='light']_&]:text-zinc-900";

export const MYPAGE_OUTLINE_BTN_SM = `${MYPAGE_OUTLINE_BTN_CORE} px-5 py-2.5 text-[14px]`;

export const MYPAGE_OUTLINE_BTN_MD = `${MYPAGE_OUTLINE_BTN_CORE} px-6 py-3 text-[14px]`;
