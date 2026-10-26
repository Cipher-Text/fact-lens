import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryPageView } from "@/components/category/CategoryPageView";
import { categoryIds, getCategoryPage, type CategoryId } from "@/content";
import { getDictionary, isLang, langs, localizedPath } from "@/i18n";

// One template for every category (spacing-layout-system.md 7B). An unknown id is a 404.
export const dynamicParams = false;

function isCategory(value: string): value is CategoryId {
  return (categoryIds as readonly string[]).includes(value);
}

export function generateStaticParams() {
  return langs.flatMap((lang) => categoryIds.map((id) => ({ lang, id })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/category/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLang(lang) || !isCategory(id)) return {};
  return {
    title: getDictionary(lang).categories[id],
    alternates: {
      languages: {
        bn: localizedPath("bn", `/category/${id}`),
        en: localizedPath("en", `/category/${id}`),
      },
    },
  };
}

export default async function CategoryRoute({
  params,
}: PageProps<"/[lang]/category/[id]">) {
  const { lang, id } = await params;
  if (!isLang(lang) || !isCategory(id)) notFound();
  return <CategoryPageView page={getCategoryPage(id, lang)} />;
}
