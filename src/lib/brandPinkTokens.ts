/**
 * ARA 브랜드 핑크 — `globals.css` `--reels-point` / Pink Glo #FF2D8D
 * UI·Tailwind·그라데이션에서 구형 #E42980 대신 이 토큰만 사용합니다.
 */

export const BRAND_PINK_HEX = "#FF2D8D";

/** 마이페이지·설정·자산 등 좌측 메뉴 — 선택 탭 왼쪽 핑크 바 */
export const sidebarNavLinkActiveClass =
  "shrink-0 whitespace-nowrap rounded-lg border-l-[3px] border-l-[color:var(--reels-point)] bg-white/[0.06] py-2 pl-3 pr-3 text-[14px] font-semibold text-zinc-50 transition-colors max-md:border-b-[3px] max-md:border-l-transparent max-md:border-b-[color:var(--reels-point)] sm:py-2.5 sm:pl-[13px] sm:text-[16px] [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-900";

export const sidebarNavLinkInactiveClass =
  "shrink-0 whitespace-nowrap rounded-lg border-l-[3px] border-l-transparent py-2 pl-3 pr-3 text-[14px] font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100 max-md:border-b-[3px] max-md:border-b-transparent sm:py-2.5 sm:pl-[13px] sm:text-[16px] [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-50 [html[data-theme='light']_&]:hover:text-zinc-900";

/** 설정·필터 등 — 선택 칩 (라이트: 흰 배경·검은 테두리·검은 글자) */
export const segmentChipBase =
  "inline-flex shrink-0 items-center justify-center rounded-full border-2 border-transparent px-4 py-2 text-[15px] font-semibold transition-[background-color,color,border-color]";

export const segmentChipOn =
  "bg-white/22 text-white ring-2 ring-white/35 [html[data-theme='light']_&]:border-black [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-950 [html[data-theme='light']_&]:ring-0";

export const segmentChipOff =
  "text-zinc-300 hover:bg-white/14 hover:text-white [html[data-theme='light']_&]:border-transparent [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900";

/** 장바구니·찜·영상관리 등 썸네일 위 선택 — 라벨은 포지션만(테두리·패딩 박스 없음) */
export const feedOverlayCheckboxLabelClass =
  "absolute left-2 top-2 z-[20] flex cursor-pointer items-center lg:left-1.5 lg:top-1.5";

/** 썸네일 오버레이 체크박스 본체 */
export const feedOverlayCheckboxInputClass =
  "h-4 w-4 shrink-0 cursor-pointer rounded border border-white/85 bg-white/95 accent-[color:var(--reels-point)] shadow-[0_1px_3px_rgba(0,0,0,0.5)] sm:h-[18px] sm:w-[18px] [html[data-theme='light']_&]:border-zinc-800/90 [html[data-theme='light']_&]:bg-white";

/** 툴바(전체 선택 등) — 동일 톤, 오버레이용 그림자는 생략 */
export const feedToolbarCheckboxInputClass =
  "h-4 w-4 shrink-0 cursor-pointer rounded border border-white/30 bg-white/95 accent-[color:var(--reels-point)] [html[data-theme='light']_&]:border-zinc-400 [html[data-theme='light']_&]:bg-white";
