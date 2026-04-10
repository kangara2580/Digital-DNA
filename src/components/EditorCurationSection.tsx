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
                    <span className="mr-1.5 inline-block" aria-hidden>
                      {block.emoji}
                    </span>
                    {block.title}
                  </h3>
                </div>
                <SectionMoreLink
                  category="recommend"
                  className="w-full shrink-0 sm:w-auto sm:self-center"
                />
              </div>
              <div
                className="feed-scroll feed-scroll-wide -mx-4 mt-3 flex w-full min-w-0 gap-3 overflow-x-auto px-4 pb-2 pt-1 sm:-mx-5 sm:mt-4 sm:gap-3 sm:px-5"
                role="region"
                aria-label={`${block.title} 클립 목록`}
              >
                {block.clips.map((v) => (
                  <EditorCurationClipThumb
                    key={`${block.id}-${v.id}`}
                    video={v}
                    className="w-[calc((100%-2*0.75rem)/3)] min-w-[calc((100%-2*0.75rem)/3)] shrink-0 snap-start sm:w-[calc((100%-4*0.75rem)/5)] sm:min-w-[calc((100%-4*0.75rem)/5)] lg:w-[calc((100%-5*0.75rem)/6)] lg:min-w-[calc((100%-5*0.75rem)/6)]"
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
