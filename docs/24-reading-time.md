# 24 — Reading time

**Status: PROPOSED. Not approved, not built.** This records how the reading time of a news item is worked out and the decision behind it ([ADR-031](./17-architecture-decisions.md)). Nothing here is in the database, the API, the contracts or the newsroom yet.

## 1. What it is

"6 min read" on an article page and on the story cards. The public site already shows it: its mockup stores a number by hand on a story, and when there is none it works it out from the text (`apps/web`, `content/reader.ts`): `max(1, round(words / rate))`, with **230 words a minute for English and 170 for Bangla** (Bangla is read a little slower per word). The backend has nothing: no field, no calculation, and the public list items and news page do not return it.

## 2. The rule

1. **Calculated by default.** The reading time is worked out from the word count of the body of that language version.
2. **An editor may enter a number.** If one is entered, it wins. **Blank means calculated.**
3. **It is per language version, not per news item.** The same article takes a different time in English and in Bangla.

## 3. How it is calculated

| Question | Answer |
| --- | --- |
| Which text | The body of the translation (a Tiptap document). Paragraphs, headings, list items and quotes count. Image captions and credits, and the title and standfirst, do not. |
| How words are counted | By word, with `Intl.Segmenter` (`granularity: 'word'`, only the segments that are words) in the language of the version. Splitting on spaces is wrong for Bangla, which has its own punctuation (`।`) and joins. |
| Rate | Words a minute **per language**, in the runtime configuration (`reading.words_per_minute`, a value per language code), not in code. Defaults: `en` 230, `bn-BD` 170. A language with no rate uses the English one. Editors can tune it without a release. |
| Result | `max(1, round(words / rate))`, a whole number of minutes. |
| When | When it is returned, from the stored body. It is **not stored**, so it cannot go out of date and a change of rate applies to everything. (If this proves costly it can be cached per translation version, which does not change the rule.) |

## 4. The override

- One nullable column on the translation: `news_translation.reading_minutes_override` (whole number, 1 to 120, `NULL` means calculated). A translation belongs to a revision, so a new revision copies the override with the text.
- **Set in the newsroom,** on the translation, next to the text. The field shows what the calculated value would be ("Auto: 4 min") and a hint when the entered number differs from it by more than half. This is what stops a stale override after the text is edited.
- An override is **not cleared automatically** when the text changes: that would surprise editors. It is cleared by emptying the field.
- Changing it is part of saving the translation, so the existing edit rules apply (a submitted revision is locked, [ADR-014](./17-architecture-decisions.md)).

## 5. What the API returns

- **Public** (the news page, the public lists and Read next, [23](./23-read-next.md)): `readingMinutes`, the effective number only.
- **Newsroom** (the news item detail): `readingMinutes` (effective), `readingMinutesOverride` (the entered number or null) and `readingMinutesAuto` (what the calculation gives), so the form can show both.

## 6. Tests to write with it

- English and Bangla bodies give different times for the same word count.
- Punctuation and the Bangla `।` are not counted as words; captions and credits are not counted.
- An empty body gives 1.
- The override wins; blank falls back to the calculated value; 0 and 121 are refused.
- A changed rate in the configuration changes the result; an unknown language uses the English rate.
- A new revision keeps the override of the one it copies.

## 7. Build order

Small and self-contained, and the cards need it. It can be built on its own, before the rest of Read next:

1. The word count and the calculation, with the configuration key and its defaults (contracts: `reading.words_per_minute`, validated like the other configuration keys).
2. `readingMinutes` on the public news item and the public list items.
3. The override column, the contract field, the newsroom input and the "Auto" hint.

## 8. Open question

- **25.** Does the first version ship **with** the override, or calculated only? The override is one nullable column and easy to add later; calculated only is simpler and avoids a field that editors forget. The proposal above includes it; either is fine.
