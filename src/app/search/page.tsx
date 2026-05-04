import type { Metadata } from "next";
import { VideoCard } from "@/components/VideoCard";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { translate } from "@/lib/i18n/dictionaries";
import { socialMetadataFields } from "@/lib/i18n/socialMetadata";
import { getSiteLocale } from "@/lib/i18n/serverLocale";
import { searchMarketVideos } from "@/lib/searchMarketVideos";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q: rawQ = "" } = await searchParams;
  const query = rawQ.trim();
  if (!query) {
    return buildPageMetadata({
      titleKey: "meta.search",
      descriptionKey: "meta.searchDescription",
    });
  }
  const locale = await getSiteLocale();
  const title = translate(locale, "meta.searchResultsTitle", { query });
  const description = translate(locale, "meta.searchResultsDescription", {
    query,
  });
  return {
    title,
    description,
    ...socialMetadataFields(locale, title, description),
  };
}

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ = "" } = await searchParams;
  const query = rawQ.trim();
  const videos = query ? await searchMarketVideos(query) : [];

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-4 sm:px-6 md:pl-[calc(var(--reels-rail-w,0px)+1rem)] lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-2xl">
            {query ? (
              <>
                &quot;{query}&quot; 검색 결과
                <span className="ml-2 text-[15px] font-bold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                  {videos.length}개
                </span>
              </>
            ) : (
              "검색"
            )}
          </h1>
          {!query ? (
            <p className="mt-2 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              상단 검색창에 키워드를 입력한 뒤 Enter 또는 돋보기를 눌러 주세요.
            </p>
          ) : null}
        </div>
      </div>

      {!query ? null : videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 py-14 text-center [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-50">
          <p className="text-[15px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
            일치하는 동영상이 없어요
          </p>
          <p className="mt-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            다른 검색어나 영문·띄어쓰기를 바꿔 보세요.
          </p>
        </div>
      ) : (
        <ul className="grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {videos.map((v) => (
            <li key={v.id} className="min-w-0">
              <VideoCard video={v} className="min-w-0" reelLayout reelStrip disableHoverScale />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
