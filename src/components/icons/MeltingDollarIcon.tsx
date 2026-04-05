/** 죄책감 없는 조각 사치 — 원 안의 $ */
export function MeltingDollarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        className="fill-slate-100 stroke-slate-300"
        strokeWidth="1.2"
      />
      <g
        className="text-slate-800"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 6.25v11.5" />
        <path d="M15.4 7.4h-3.5a2.2 2.2 0 1 0 0 4.4h2.4a2.2 2.2 0 1 1 0 4.4H8.6" />
      </g>
    </svg>
  );
}
