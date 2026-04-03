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
        className="fill-current opacity-90 transition-transform duration-300 ease-out group-hover:translate-x-[1px] group-hover:-rotate-6 group-hover:opacity-100"
      />
      <path
        d="M9.4 19.2h5.2c.55 0 1 .45 1 1s-.45 1-1 1H9.4c-.55 0-1-.45-1-1s.45-1 1-1z"
        className="fill-current opacity-70 transition-transform duration-300 ease-out group-hover:translate-y-[1px]"
      />
      <path
        d="M11.2 21.4c.35.55 1.05.75 1.65.45.2-.1.35-.25.45-.45"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        className="opacity-60 transition-opacity duration-300 group-hover:opacity-90"
      />
      <circle
        cx="12.4"
        cy="5.1"
        r="1.1"
        className="fill-current opacity-35 transition-all duration-300 group-hover:opacity-60 group-hover:scale-110"
      />
    </svg>
  );
}

export function FloatingHelp() {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className="group fixed bottom-6 right-6 z-50 flex h-14 max-w-[3.5rem] items-stretch overflow-hidden rounded-full border border-slate-200/90 bg-white/95 text-slate-800 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.35)] backdrop-blur-md transition-[max-width,box-shadow,border-color,background-color,color] duration-300 ease-out hover:max-w-[min(92vw,20rem)] hover:border-violet-400/60 hover:bg-violet-600 hover:text-white hover:shadow-[0_18px_50px_-16px_rgba(109,40,217,0.45)] focus-visible:max-w-[min(92vw,20rem)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      aria-label="도움이 필요하시나요? 고객 지원 열기"
    >
      <span className="flex min-w-0 flex-1 items-center overflow-hidden pl-4 pr-1">
        <span className="inline-block max-w-0 -translate-x-3 whitespace-nowrap text-[13px] font-medium tracking-tight opacity-0 transition-[max-width,opacity,transform] duration-300 ease-out delay-0 group-hover:max-w-[15rem] group-hover:translate-x-0 group-hover:opacity-100 group-hover:delay-75">
          도움이 필요하시나요?
        </span>
      </span>
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors duration-300 group-hover:bg-white/15 group-hover:text-white">
        <StylizedBell className="h-5 w-5" />
      </span>
    </a>
  );
}
