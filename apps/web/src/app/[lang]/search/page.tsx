import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/footer/Footer";
import { SiteHeader } from "@/components/header/SiteHeader";
import { SkipLink } from "@/components/header/SkipLink";
import { Divider } from "@/components/layout/Divider";
import { PageTitle } from "@/components/layout/PageTitle";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import { MoreStoriesList } from "@/components/more-stories/MoreStoriesList";
import { getDictionary, isLang, localizedPath } from "@/i18n";
import { ApiBadResponse, ApiNotFound, ApiUnavailable, apiBase } from "@/lib/api/client";
import { searchFromApi, trendingFromApi } from "@/lib/api/search";

type SearchParams = Promise<{ q?: string | string[]; cursor?: string | string[] }>;

export async function generateMetadata({ params }: PageProps<"/[lang]/search">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getDictionary(lang).searchPage.title, robots: { index: false, follow: true } };
}

export default async function SearchRoute({
  params,
  searchParams,
}: {
  params: PageProps<"/[lang]/search">["params"];
  searchParams: SearchParams;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const queryParams = await searchParams;
  const rawQuery = Array.isArray(queryParams.q) ? queryParams.q[0] : queryParams.q;
  const cursor = Array.isArray(queryParams.cursor) ? queryParams.cursor[0] : queryParams.cursor;
  const query = rawQuery?.trim() ?? "";
  const t = getDictionary(lang);
  const apiMode = Boolean(apiBase());
  let results: Awaited<ReturnType<typeof searchFromApi>> | null = null;
  let error = false;
  if (apiMode && query.length >= 2 && query.length <= 200) {
    try {
      results = await searchFromApi(query, lang, cursor);
    } catch (cause) {
      if (cause instanceof ApiUnavailable || cause instanceof ApiNotFound || cause instanceof ApiBadResponse) error = true;
      else throw cause;
    }
  }
  const trending = results?.stories.length === 0 && apiMode ? await trendingFromApi(lang) : [];
  const heading = query ? `${t.searchPage.resultsFor} “${query}”` : t.searchPage.title;
  const prompt = query.length < 2 ? t.searchPage.prompt : query.length > 200 ? t.searchPage.tooLong : null;
  const searchUrl = localizedPath(lang, "/search");

  return (
    <>
      <SkipLink label={t.header.skipLink} />
      <SiteHeader lang={lang} path="/search" />
      <main id="main" tabIndex={-1} className="pb-(--space-section) focus-visible:outline-none">
        <PageTitle title={heading} />
        <Shell className="pt-(--space-module)">
          <WithRail>
            <Wrapper>
              {!apiMode ? <p className="font-ui text-sm text-ink-secondary">{t.searchPage.preview}</p> : null}
              {prompt ? <p className="font-ui text-sm text-ink-secondary">{prompt}</p> : null}
              {error ? <p className="font-ui text-sm text-ink-secondary">{t.searchPage.unavailable}</p> : null}
              {results ? (
                <>
                  <p className="mb-(--space-module) font-ui text-sm text-ink-secondary">
                    {new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en").format(results.stories.length)} {t.searchPage.resultCount}
                  </p>
                  {results.stories.length ? (
                    <MoreStoriesList stories={results.stories} t={t} titleAs="h2" />
                  ) : (
                    <>
                      <p className="font-ui text-sm text-ink-secondary">{t.searchPage.empty}</p>
                      {trending.length ? (
                        <div className="mt-(--space-module)">
                          <h2 className="mb-3 font-ui text-sm font-semibold text-ink">{t.header.trending}</h2>
                          <ul className="flex flex-wrap gap-x-6">
                            {trending.map((term) => (
                              <li key={term}><Link className="min-h-11 inline-flex items-center text-interactive hover:text-interactive-hover" href={`${searchUrl}?q=${encodeURIComponent(term)}`}>{term}</Link></li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </>
                  )}
                  {results.nextCursor ? (
                    <>
                      <Divider variant="rule" className="mt-(--space-module)" />
                      <div className="mt-(--space-module) flex justify-center">
                        <Link className="inline-flex min-h-11 items-center text-interactive hover:text-interactive-hover" href={`${searchUrl}?q=${encodeURIComponent(query)}&cursor=${encodeURIComponent(results.nextCursor)}`}>{t.searchPage.loadMore}</Link>
                      </div>
                    </>
                  ) : null}
                </>
              ) : null}
            </Wrapper>
          </WithRail>
        </Shell>
      </main>
      <Footer lang={lang} />
    </>
  );
}
