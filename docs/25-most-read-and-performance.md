# 25 — Most read and news performance

**Status: BUILT in the API, the worker and the newsroom; NOT connected to the public site.** The public site (`apps/web`) still shows mock data and neither sends views nor reads this list. The counting is **off** until the feature flag `analytics.news_views` is turned on. See [ADR-032](./17-architecture-decisions.md). The design follows [03](./03-target-architecture.md) (first-party view counting) and [12](./12-auth-security-and-audit.md) (abuse resistance).

## 1. What it does

- **For readers:** a "Most read" list per language, optionally for one section, region or format, with a place (1, 2, 3 …) on each item.
- **For administrators:** a newsroom Analytics page and a Performance panel on each news item: most read, **least read** (including news nobody read), views a day, where the views came from, totals per section, region, format, author and language, and a daily series per news item. It works for any past period, not only the last few days.

## 2. How a view is counted

1. After the page has been shown, the public site sends `POST /public/views` with the news item's short id, the language, a random session id and the referrer's **domain only**. The answer is always `204`, so it tells a script nothing about the checks; a malformed body is `400`.
2. The API ignores the request, silently, when: the feature flag is off; there is no user agent or it looks like a bot or a monitor; the browser says it is only prefetching; the news item is not live or has no version in that language; the client address is over the limit (`rate_limit.news_view_beacon`, default 60 a minute per address); or this session already counted this news item in this language in the last 24 hours.
3. Otherwise **one view** is counted in an hourly Redis sorted set (`<prefix>:v:<UTC hour>:<language>`), and in one by source (`search`, `social`, `direct`, `internal`, `other`, from the referrer's domain). The counters keep 9 days.
4. A view is therefore a **unique-session view**: the first view of that news item, in that language, by that session, in 24 hours. Nothing personal is stored: the session id and the client address are only hashed (with the poll's secret), only for the de-duplication and the limit, and expire with their keys.

## 3. Most read (public)

`GET /public/most-read/:locale?category=&region=&format=&excludeFormat=&limit=5&window=24h`

- Views in the window (24 hours or 7 days) are summed from the hourly counters (the union is cached for a minute), the top 300 ids are filtered by section, region and format and kept in order, and the places are 1, 2, 3.
- **Too few news items read?** The window widens from 24 hours to 7 days (the answer says which window it used), and then the list is filled with the newest news of the same filters (with no views), so it is never empty on a site that has news.
- Items are the same as the public lists plus `rank`: `id`, `shortId`, `slug`, `title`, `dek`, `format`, `publishedAt`, `category` and the **lead image**.
- Per language: a Bangla list ranks Bangla views. Unknown language or section: 404. Cached for a minute (`public, max-age=60`).
- Opinion is **not** excluded unless the site asks (`excludeFormat=opinion`).

## 4. The durable record

- The worker's scheduled job `analytics.rollup` (every `ANALYTICS_ROLLUP_MS`, default 5 minutes) calls the API's `POST /internal/analytics/rollup`, which adds every **finished** hour of the counters to `news_performance_daily` (news item, language, **Dhaka day**, views, and views by source). The API owns the write, as it does for feeds.
- Each hour is added **once**: an `analytics_flush` row is written in the same transaction as the counts, so a repeated or crashed rollup cannot double count. The hour's counters stay in Redis until they expire, because the live ranking reads them.
- The reports therefore lag by up to an hour plus the rollup interval. The table is kept for good; partition it by month when it grows large.

## 5. The reports (newsroom, `analytics.read`)

The new capability `analytics.read` is held by the Admin, Managing Editor and Analyst roles.

- `GET /analytics/news?from&to&locale&category&region&format&metric=views|rate&order=desc|asc&minAgeDays&limit&offset` — live news with views in the period. `order=asc` is least read and **includes news with zero views**; `minAgeDays` keeps new news out; `metric=rate` is views a day since it was live in the period, which compares new and old news.
- `GET /analytics/summary?by=category|region|format|author|locale&from&to&locale` — live news and views per group. A news item counts in every section and region it has and for every author it credits, so groups can add up to more than the total.
- `GET /analytics/news/:id?from&to` — per language: total, last 7 days, last 30 days, all time, views a day, peak day, views by source, a zero-filled daily series, and its place among the news of its primary section.
- The period is in Dhaka days, defaults to the last 30, and is at most 366 days. Sections, regions and authors are **today's**, not a snapshot.

## 6. The lead image

Cards need a picture, and nothing could set one. `PUT /news/:id/lead-image` (`news.edit`) sets or removes the **lead** image of the open revision (a locked revision refuses; a new revision starts with the old one). Publishing already needs a credit or licence on every picture of the revision. The public lists show the lead image only while it is ready, allowed on the web and not expired, with its derivatives. The newsroom has a Lead image control on the news item.

## 7. Settings

- Feature flag `analytics.news_views` (off by default): turns counting on.
- `rate_limit.news_view_beacon` (configuration): the beacon limit.
- `PUBLIC_SITE_HOSTS` (API, optional): the public site's own host names, so a visit from one of its pages to another counts as `internal`.
- `ANALYTICS_ROLLUP_MS` (worker, default 300000).
- Redis is the live store; `REDIS_URL` is already required.

## 8. Not built

- **The public site does not send views and does not read this list.** It needs a small client piece that posts the beacon once per article page after it is shown (through its own route, like the poll vote, so the client address reaches the API), and the homepage and category pages calling `GET /public/most-read/:locale`. That is `apps/web` work, to be done under its own rules.
- Reading time on the cards ([24](./24-reading-time.md)), "trending" (time-decayed), engaged time or scroll depth, snapshotting a news item's section at the time of the view, a history import from GA4, partitioning, and a consent step.
- The lead image is not **required** to publish (the site's article page requires one); that rule is open.

## 9. Open decisions

- The window: 24 hours with a 7-day fallback is the default, set per request (`window`).
- Whether opinion may appear in Most read on the site: the API supports either.
- Whether anonymous first-party counters need a consent step in the markets served.
- The importance of old news before launch: there are no counts for it unless history is imported.
