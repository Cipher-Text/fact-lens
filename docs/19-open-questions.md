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
19. Confirm the revision rule: a submitted revision is locked, and sending a story back or revising a published story opens a new revision ([06](./06-editorial-workflow.md)). The alternative is to reopen the same revision, which loses the record of what was reviewed.
20. Session length. Access tokens are the session (no refresh yet). Is a sign-in per token lifetime acceptable to editors, or is silent refresh a launch requirement?
21. Untranslated categories and tags. Today something with no name in a language is left out of that language's menu, story page and lists; languages are never mixed. The alternative is to fall back to another language's name. Also: should the menu have sub-menus (the column exists, nothing uses it), and should tags be capped at 30 per story as now?

Resolved: advertising is confirmed part of the Phase 1 launch scope, carrying forward CipherPress's current Advertiser/Campaign/Placement/Ad/Event design as-is (see [product and platform scope](./02-product-and-platform-scope.md) and [domain model](./05-domain-model.md)).

Resolved: Telegram channels are a named ingestion source type, using the Bot API (see [ingestion and automation](./08-ingestion-and-automation.md)); which specific channels remains covered by open question 4.
