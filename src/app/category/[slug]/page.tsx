import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryClipsClient } from "@/components/CategoryClipsClient";
import { CATEGORY_SLUGS, type CategorySlug } from "@/data/videoCatalog";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!CATEGORY_SLUGS.includes(slug as CategorySlug)) {
    return {};
  }
  const locale = await getSiteLocale();
  const label = translate(locale, `meta.category.${slug}`);
  return {
    title: label,
    description: translate(locale, "meta.categoryPageDescription", {
      category: label,
    }),
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!CATEGORY_SLUGS.includes(slug as CategorySlug)) {
    notFound();
  }
  return <CategoryClipsClient slug={slug as CategorySlug} />;
}
