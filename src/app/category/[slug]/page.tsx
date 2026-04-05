import { notFound } from "next/navigation";
import { CategoryClipsClient } from "@/components/CategoryClipsClient";
import { CATEGORY_SLUGS, type CategorySlug } from "@/data/videoCatalog";

export const dynamic = "force-static";

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ slug }));
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
