import { EditorCurationClipThumb } from "@/components/EditorCurationClipThumb";
import { SectionMoreLink } from "@/components/SectionMoreLink";
import { EDITOR_CURATIONS } from "@/data/marketing";

export function EditorCurationSection() {
  return (
    <section
      className="border-t border-white/10 bg-transparent"
      aria-labelledby="editor-curation-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="text-left">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-reels-cyan">
            Situation Curation
          </p>
          <h2
            id="editor-curation-heading"
            className="mt-1 text-[22px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:text-[26px] md:text-[28px]"
          >
            이런 상황에 딱!
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-500 sm:text-[16px]">
            검색은 귀찮고, 지금 기분·상황에 맞는 조각만 고르고 싶을 때.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-10 sm:mt-8 sm:gap-12">
          {EDITOR_CURATIONS.map((block, i) => (
            <div
              key={block.id}
              className={`min-w-0 rounded-2xl p-4 sm:p-5 ${
                i === 0
                  ? "reels-border-gradient bg-reels-void/50 shadow-[0_0_40px_-12px_rgba(255,0,85,0.2)]"
                  : "border border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 text-left">
                  {i === 0 ? (
                    <span className="mb-1 inline-block rounded-full border border-reels-crimson/40 bg-reels-crimson/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-reels-crimson">
                      Featured
                    </span>
                  ) : null}
                  <h3 className="text-[17px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:text-[18px]">
                    {block.title}
                  </h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-zinc-500 sm:text-[15px]">
                    {block.description}
                  </p>
                </div>
                <SectionMoreLink
                  category="recommend"
                  className="w-full shrink-0 sm:w-auto sm:self-center"
                />
              </div>
              <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1 sm:mt-4 sm:gap-4">
                {block.clips.map((v) => (
                  <EditorCurationClipThumb
                    key={`${block.id}-${v.id}`}
                    video={v}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
