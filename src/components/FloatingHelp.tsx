"use client";

function StylizedBell({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M12.2 2.2c.35-.12.73-.12 1.08 0 1.35.48 2.25 1.72 2.35 3.12l.02.55c0 1.05.35 2.05 1 2.88.55.68.85 1.52.85 2.4v.55c0 1.1-.45 2.12-1.2 2.88-.35.35-.75.65-1.18.88-.25.12-.52.22-.8.28l-.35.08H9.03l-.35-.08a4.7 4.7 0 01-.8-.28 4.05 4.05 0 01-1.18-.88 4.05 4.05 0 01-1.2-2.88v-.55c0-.88.3-1.72.85-2.4a4.9 4.9 0 001-2.88l.02-.55c.1-1.4 1-2.64 2.35-3.12.35-.12.73-.12 1.08 0z"
        className="fill-current opacity-90"
      />
      <path
        d="M9.4 19.2h5.2c.55 0 1 .45 1 1s-.45 1-1 1H9.4c-.55 0-1-.45-1-1s.45-1 1-1z"
        className="fill-current opacity-70"
      />
      <path
        d="M11.2 21.4c.35.55 1.05.75 1.65.45.2-.1.35-.25.45-.45"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        className="opacity-60"
      />
      <circle
        cx="12.4"
        cy="5.1"
        r="1.1"
        className="fill-current opacity-35"
      />
    </svg>
  );
}

const easeExpand = "duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-300";

export function FloatingHelp() {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className={`group fixed bottom-6 right-4 z-50 flex h-14 max-w-[3.5rem] flex-row-reverse items-center overflow-hidden rounded-full border border-slate-200/90 bg-white/95 text-slate-800 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.35)] backdrop-blur-md transition-[max-width,box-shadow,border-color,background-color] ${easeExpand} hover:max-w-[min(92vw,20rem)] hover:border-[#708090]/40 hover:bg-slate-50 hover:shadow-[0_18px_50px_-16px_rgba(112,128,144,0.25)] focus-visible:max-w-[min(92vw,20rem)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#708090]`}
      aria-label="도움이 필요하시나요? 고객 지원 열기"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#708090] transition-colors duration-500 group-hover:bg-[#708090]/10">
        <StylizedBell className="block h-[22px] w-[22px] shrink-0" />
      </span>
      <span className="flex min-h-14 min-w-0 flex-1 items-center justify-end overflow-hidden pl-2 pr-2">
        <span
          className={`whitespace-nowrap pl-3 pr-2 text-right text-[13px] font-medium tracking-tight text-[#708090] opacity-0 transition-[opacity,transform] duration-[1640ms] ease-[cubic-bezier(0.22,1,0.36,1)] delay-0 motion-reduce:transition-none translate-x-1.5 group-hover:translate-x-0 group-hover:opacity-100 group-hover:delay-[280ms]`}
        >
          도움이 필요하시나요?
        </span>
      </span>
    </a>
  );
}
