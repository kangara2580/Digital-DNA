import Image from "next/image";
import Link from "next/link";
import { EDITOR_CURATIONS } from "@/data/marketing";

export function EditorCurationSection() {
  return (
    <section
      className="border-t border-slate-200/90 bg-[#FFFFFF]"
      aria-labelledby="editor-curation-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="text-left">
          <p className="text-[13px] font-bold tracking-tight text-[#708090] sm:text-[14px]">
            에디터의 큐레이션
          </p>
          <h2
            id="editor-curation-heading"
            className="mt-1 text-[22px] font-bold leading-snug tracking-tight text-[#0f172a] sm:text-[26px] md:text-[28px]"
          >
            이런 상황에 딱!
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
            검색은 귀찮고, 지금 기분·상황에 맞는 조각만 고르고 싶을 때.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-10 sm:mt-8 sm:gap-12">
          {EDITOR_CURATIONS.map((block) => (
            <div key={block.id} className="min-w-0">
              <h3 className="text-left text-[17px] font-bold leading-snug tracking-tight text-slate-900 sm:text-[18px]">
                {block.title}
              </h3>
              <p className="mt-1 text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
                {block.description}
              </p>
              <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1 sm:mt-4 sm:gap-4">
                {block.clips.map((v) => (
                  <Link
                    key={`${block.id}-${v.id}`}
                    href="/"
                    className="group shrink-0 w-[104px] sm:w-[118px]"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-slate-200/90 bg-slate-100 shadow-sm transition-shadow group-hover:shadow-md">
                      <Image
                        src={v.poster}
                        alt=""
                        fill
                        sizes="120px"
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                    <p className="mt-2 line-clamp-2 text-left text-[12px] font-semibold leading-snug text-slate-800">
                      {v.title}
                    </p>
                    {v.priceWon != null ? (
                      <p className="mt-0.5 text-left text-[11px] font-medium tabular-nums text-slate-500">
                        {v.priceWon.toLocaleString("ko-KR")}원
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
