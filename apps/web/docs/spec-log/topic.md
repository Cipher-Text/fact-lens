# topic spec log

Branch `page/topic` · Brief `docs/briefs/topic.md` · Issue IMP-18 (the `/topic/<slug>` part) · Started 29 October 2026

This log keeps what the work changes in the specs, made from the progress file at the final checkpoint. Open code items are rows in `docs/ISSUES.md`. After the merge, the log stays as the record of what the work changed in the specs; the brief and the progress file are deleted (`AGENTS.md` Section 9, step 6).

## Kinds

| Kind | Use when |
| --- | --- |
| Reuse | An existing rule, token or component is used in a new place. Name it |
| New token | A tweak has no token step. Give the name, the value and the scale it joins (`CPT-07`) |
| New component | A part that no sheet in `component-system.md` §7 covers. Give the name per `N-01` to `N-05` |
| New rule | A behavior that no rule covers |
| Changed rule | The page needs an existing rule to change. Always a flag |

## Items

| ID | Kind | What | Code (`file:line`) | Rule or token IDs | Source | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| TP-01 | New rule | The topic page layout, layout Section 7E (new): `/topic/<slug>` and `/en/topic/<slug>`, `TopicPageView`. Page order as the Latest page (7D.1): site header (no current item), `ad-top`, C-43 PageTitle with the topic label as the `h1` and no label above it, the list, footer. No `ad-band`. Static for every topic in bn and en; an unknown slug shows the 404 page (7C.1) | `src/app/[lang]/topic/[slug]/page.tsx:10`, `:12`, `:42`; `src/components/topic/TopicPageView.tsx:19`, `:36` | Layout 7C.1, 7C.2 (Topic row), 7D, 9; C-43; DR-370, DR-410 | tajmin, 29 Oct 2026: "similar to latest"; 30 Oct 2026: "Lets keep it simple. Only page title. no label"; "for an unknown topic slug, show 404 page" | Green (design-reviewer, 30 Oct 2026) |
| TP-02 | New rule | The topic page content: the news and analysis stories of the topic, newest first, no opinion, no repeats; 10 first, then 10 per press (7B.2 Load more). With no news or analysis the list is not shown; with 10 or fewer there is no Button (7D.3). The topics belong to the story, so the article Topics (C-34) and the topic page share them | `src/content/index.ts:285`; `src/content/stories.ts:35`; `src/content/reader.ts:44` | Layout 7B.2, 7D.2, 7D.3; C-34; DR-410, DR-414 | tajmin, 29 Oct 2026: "no opinion" | Green (design-reviewer, 30 Oct 2026) |
| TP-03 | Reuse | `MoreStoriesSection`, `MoreStoriesList` on the topic page, named by the `h1` (`h2` titles), with the C-08 `format` Eyebrow mode (DR-417) on every row: a news row shows its category, an analysis row বিশ্লেষণ / Analysis. New optional props `eyebrowMode` and `section` (`data-section` "topic") | `src/components/more-stories/MoreStoriesSection.tsx:32`, `:55`, `:93`; `src/components/more-stories/MoreStoriesList.tsx:14`, `:56`; `src/components/topic/TopicPageView.tsx:48`, `:50` | C-08 (DR-417), C-24, DR-153 (the page mixes categories) | tajmin, 30 Oct 2026: "show category for. news, format for non-news (in this case analysis" | Green (design-reviewer, 30 Oct 2026) |
| TP-04 | Reuse | C-24 `dated`: the extra format Eyebrow of an analysis row shows only when the row has no Eyebrow, so a row never shows two Eyebrows. The category page (no Eyebrow) is unchanged | `src/components/story/StoryCard.tsx:107` | C-24 (DR-415, category formats spec log CF-07), C-08 | Follows TP-03 | Green (design-reviewer, 30 Oct 2026) |
| TP-05 | New component | `TopicPageView`, the topic page template, in component-system Section 3 beside `LatestPageView`, with the `MoreStoriesSection` row of the page. C-34 `Topics.item` and Section 8 no longer say the topic page is not built | `src/components/topic/TopicPageView.tsx:19` | N-05; C-34 | Brief | Green (design-reviewer, 30 Oct 2026) |

## Flags

None open. Written into the specs on `page/topic`: layout 2.31 Section 7E and 7C.2 (TP-01 to TP-03), component-system 1.27 Section 3, C-24, C-34 and Section 8 (TP-03 to TP-05), agent-contract 2.21 Sections 1 and 3.
