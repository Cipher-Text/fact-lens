# 19 — Open questions

These require product, editorial or business input; they are not unresolved merely because implementation detail remains.

1. Which desks and editorial roles exist at launch, and who may approve/fact-check/correct each desk’s work? (The seed holds four provisional desks and eight provisional roles with placeholder capability sets; for example, a copy editor can currently resolve comments and cancel assignments.)
2. What are the canonical public locale policies for English and Bengali, including whether localized slugs may diverge?
3. What correction display policy is required: inline notice, correction history page, or both?
4. Which source types may be ingested automatically (including which specific Telegram channels), and what copyright/terms/robots policy governs retrieval and raw snapshot retention?
5. Which contributor contact fields may migrate and who can view them?
6. What publishing SLA, RPO/RTO, traffic baseline and peak-event assumptions should set capacity targets?
7. Which OIDC provider constraints apply: managed tenancy, self-hosting, region, MFA, directory integration and lifecycle automation?
8. Which distribution channels are launch requirements versus later experiments?
9. What analytics consent, retention and newsroom access policy applies to public readers and internal users (including consent-gating the GA4 tag)?
10. IP-hash retention window and IP-hashing algorithm for AdEvent records: what policy governs how long hashed IPs are kept and how they may be used?
11. What editorial transformation-threshold policy applies to AI-drafted rewrites of ingested source articles before they may be approved — e.g. minimum original reporting/editing, mandatory attribution wording, and any source types excluded from rewrite entirely?
12. Should FactLens support public comments on articles? This carries significant moderation, spam/abuse and legal exposure — many newsrooms have removed on-site comments in favor of social-platform discussion. Needs an explicit editorial/business decision before any design work begins; not assumed in scope.
13. Should FactLens support a paid subscription/paywall alongside advertising? This is a monetization/business decision (pricing, payment provider, what content is gated) requiring explicit confirmation, the same way advertising scope required confirmation — not assumed in scope.
14. What is the public URL scheme, and how do legacy URLs map to it? `apps/web` serves Bangla at `/` and English under `/en` with codes `bn` and `en`; the docs use `en` and `bn-BD`; cipher-press uses no locale prefix (cookie-based language) and slugs such as `/news/[slug]`. Needs one decision on locale codes, prefix policy and the legacy redirect map (see docs 14 and 16, Phase 0).
15. Is fact-checking part of the product? `apps/web` rule `DR-18` says Fact Lens has no fact-checking product and forbids a fact-check label or verdict feature, while docs 02 and 05 list fact-checking in the newsroom workflow and a claims/evidence graph (Phase 7). Needs one decision; the docs or the web rule must change.
16. Retention windows are unset. `pnpm seed` creates no `retention.*` configuration, because the policies behind questions 4, 9 and 10 are undecided. The desks it seeds are provisional (question 1).
17. Identity provider and sign-in details. The newsroom now signs in with a server-side authorization code flow and PKCE, and the API validates bearer tokens, but only the fake local provider has been used. The real provider (question 7) decides the roles claim name, how MFA is signalled (`amr`), token lifetime, refresh and logout. Desk-scoped roles (a role held for one desk only) are not modeled.
18. Media rules. Which image types beyond JPEG, PNG and WebP (GIF, AVIF, SVG) are needed; the upload size limit (10 MB now); who may upload and who may delete (reporters upload today; deleting needs `media.manage`); what licence wording editors must use; how long an asset with expired rights stays in the library.
19. Confirm the revision rule: a submitted revision is locked, and sending a news item back or revising a published news item opens a new revision ([06](./06-editorial-workflow.md)). The alternative is to reopen the same revision, which loses the record of what was reviewed.
20. Session length. Access tokens are the session (no refresh yet). Is a sign-in per token lifetime acceptable to editors, or is silent refresh a launch requirement?
21. Untranslated categories and tags. Decided: omit. Something with no name in a language is left out of that language's menu, news item page and lists; languages are never mixed. Falling back to another language's name was considered and rejected. Still open: should the menu have sub-menus (the column exists, nothing uses it), and should tags be capped at 30 per news item as now?
22. Read next rules. Are the proposed selection rules and weights in [23](./23-read-next.md) (editor's picks, then shared topics 3, regions 2, sections 1 with a recency boost, then the newest of the section) acceptable as a first version, to be tuned on real content?
23. Topics. The public site has a managed topic list (what or who, one Latin address, a name per language, a page at `/topic/<slug>`), and the plan lists Topic as an entity that is not built. Are topics the existing tags, or their own table? Read next and the topic page both depend on it.
24. Opinion in Read next. The public site's lists keep opinion out of news, but its Read next mockup shows an opinion piece. May opinion appear in Read next, and under what condition (the proposal: at most one, and only one that shares a topic)?
25. Reading time override. Does the first version of [24](./24-reading-time.md) ship with the editor's override (blank means calculated), or calculated only? The override is one nullable column and easy to add later.
26. Trending search terms. Does the "Trending" row of the search dialog start from an editorial list (up to 6 terms per language, set in the newsroom), with terms computed from searches added later and the editorial terms pinned first, as proposed in [26](./26-search-and-trending.md)?
27. Bangla search. Are the `simple` text-search configuration plus trigram matching on titles enough for the first version, or must stemming or a Bangla-specific dictionary be in place before launch? PostgreSQL has no Bangla stemmer.
28. Search queries kept. May search queries be kept, anonymously and as counts only, to improve search ("searches with no results") and to compute trending terms, and for how long? Any query that looks like personal data would not be counted.

Resolved: advertising is confirmed part of the Phase 1 launch scope, carrying forward CipherPress's current Advertiser/Campaign/Placement/Ad/Event design as-is (see [product and platform scope](./02-product-and-platform-scope.md) and [domain model](./05-domain-model.md)).

Resolved: Telegram channels are a named ingestion source type, using the Bot API (see [ingestion and automation](./08-ingestion-and-automation.md)); which specific channels remains covered by open question 4.
