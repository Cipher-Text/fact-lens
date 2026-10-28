import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { bn } from "@/i18n/bn";
import { en } from "@/i18n/en";

import { homepagePlans } from "./homepage";
import { ads } from "./ads";
import { categoryMostRead } from "./category-most-read";
import {
  articleLangsOf,
  currentStoryRef,
  getAd,
  getArticleByRef,
  getCategoryPage,
  getHomepage,
  getPoll,
  getStory,
  type Homepage,
  type Story,
} from "./index";
import { articleDefs } from "./reader-articles";
import { stories } from "./stories";
import { topics } from "./topics";
import { parseStoryRef, storyRef } from "./urls";
import { regionIds, type CategoryId, type RegionId } from "./types";

const BENGALI = /[ঀ-৿]/;
const langs = ["bn", "en"] as const;

// Bangladesh is not a category (DR-412).
const categoryIds: CategoryId[] = [
  "geopolitics",
  "security",
  "history",
  "economy",
  "technology",
];

/** Every story on a homepage, in page order. */
function allStories(home: Homepage): Story[] {
  return [
    ...(home.hero
      ? [home.hero.lead, ...home.hero.top, ...home.hero.latest]
      : []),
    ...(home.analysisOpinion
      ? [...home.analysisOpinion.analysis, ...home.analysisOpinion.opinion]
      : []),
    ...[home.featured.southAsia, home.featured.geopolitics].flatMap((s) =>
      s ? [s.lead, ...s.rail] : [],
    ),
    ...(home.grouped?.categories.flatMap((c) => c.stories) ?? []),
    ...(home.mostRead ?? []),
    ...(home.regions?.flatMap((r) => r.stories) ?? []),
  ];
}

describe("story data", () => {
  it("has unique ids", () => {
    const ids = stories.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives each story an id of 6 to 8 base36 characters (layout 7C, DR-413)", () => {
    for (const def of stories)
      expect(def.id, def.slug).toMatch(/^[0-9a-z]{6,8}$/);
  });

  it("gives each story a unique Latin slug (layout 7C.1)", () => {
    const slugs = stories.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("uses the three formats only: no explainer, no op-ed (DR-414)", () => {
    for (const def of stories) {
      expect(["news", "analysis", "opinion"], def.slug).toContain(def.format);
    }
  });

  it("gives each story one or more regions from the region list (DR-411)", () => {
    for (const def of stories) {
      expect(def.regions.length, def.slug).toBeGreaterThan(0);
      for (const region of def.regions)
        expect(regionIds, def.slug).toContain(region);
    }
  });

  it("has no Bangladesh category and no domestic story (DR-412)", () => {
    for (const def of stories) expect(def.category).not.toBe("bangladesh");
    expect(stories.map((s) => s.slug)).not.toContain("chattogram-rain-warning");
  });

  it("gives each story the same id in Bangla and English", () => {
    for (const def of stories) {
      expect(getStory(def.slug, "bn").id).toBe(getStory(def.slug, "en").id);
    }
  });

  it("writes Bangla stories in Bangla and English stories in English (T-27)", () => {
    for (const def of stories) {
      for (const text of [def.bn.title, def.bn.summary, def.bn.imageAlt]) {
        if (!text) continue;
        expect(text, def.slug).toMatch(BENGALI);
        expect(text, def.slug).not.toMatch(/[A-Za-z]/);
      }
      for (const text of [def.en.title, def.en.summary, def.en.imageAlt]) {
        if (text) expect(text, def.slug).not.toMatch(BENGALI);
      }
    }
  });

  it("has a summary in both languages or in neither", () => {
    for (const def of stories) {
      expect(Boolean(def.bn.summary), def.slug).toBe(Boolean(def.en.summary));
    }
  });

  it("gives every image alt text in both languages", () => {
    for (const lang of langs) {
      for (const def of stories.filter((s) => s.image)) {
        expect(
          getStory(def.slug, lang).image?.alt.trim(),
          def.slug,
        ).toBeTruthy();
      }
    }
  });

  it("uses local SVG placeholder images that exist in public/mock (rule 6)", () => {
    for (const def of stories.filter((s) => s.image)) {
      const { image } = getStory(def.slug, "bn");
      expect(image?.src).toMatch(/^\/mock\/[a-z0-9-]+\.svg$/);
      const file = join(process.cwd(), "public", image!.src);
      expect(existsSync(file), image!.src).toBe(true);
      const [, w, h] =
        /viewBox="0 0 (\d+) (\d+)"/.exec(readFileSync(file, "utf8")) ?? [];
      expect(Number(w) / Number(h)).toBeCloseTo(
        image!.width / image!.height,
        5,
      );
    }
  });

  it("uses recent ISO 8601 dates", () => {
    for (const def of stories) {
      expect(def.publishedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+06:00$/,
      );
      expect(Number.isNaN(Date.parse(def.publishedAt))).toBe(false);
    }
  });

  it("gives every opinion piece an author", () => {
    for (const def of stories.filter((s) => s.format === "opinion")) {
      expect(def.author, def.slug).toBeDefined();
    }
  });

  it("has long Bangla headlines over 120 characters (spacing-layout-system.md 13)", () => {
    const long = stories.filter((s) => s.bn.title.length > 120);
    expect(long.length).toBeGreaterThanOrEqual(2);
  });

  it("has stories with no image", () => {
    expect(stories.filter((s) => !s.image).length).toBeGreaterThanOrEqual(5);
  });

  it("has no fact-check content (DR-18)", () => {
    const text =
      JSON.stringify(stories) + JSON.stringify([getPoll("bn"), getPoll("en")]);
    expect(text).not.toMatch(
      /ফ্যাক্টচেক|fact[\s-]?check|verdict|রায়:|সত্য-মিথ্যা/i,
    );
  });

  it("does not use চীন as a category (DR-19)", () => {
    for (const def of stories) {
      expect(categoryIds).toContain(def.category);
    }
    expect(Object.keys(bn.categories)).not.toContain("china");
    expect(Object.values(bn.categories)).not.toContain("চীন");
    expect(bn.regions.china).toBe("চীন");
  });

  it("has a label for every category and region in both string tables", () => {
    for (const table of [bn, en]) {
      expect(Object.keys(table.categories).sort()).toEqual(
        [...categoryIds].sort(),
      );
      expect(Object.keys(table.regions)).toEqual([...regionIds]);
      for (const region of homepagePlans.full.regions) {
        expect(table.regions[region as RegionId]).toBeTruthy();
      }
    }
  });

  it("has a Latin slug and a label in both languages for every topic (DR-410)", () => {
    for (const [id, topic] of Object.entries(topics)) {
      expect(topic.slug, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(topic.bn, id).toMatch(BENGALI);
      expect(topic.en, id).not.toMatch(BENGALI);
    }
    for (const def of articleDefs) {
      expect(def.topics.length, def.slug).toBeGreaterThan(0);
      for (const id of def.topics) expect(topics[id], def.slug).toBeDefined();
    }
  });
});

describe("getHomepage full", () => {
  for (const lang of langs) {
    describe(lang, () => {
      const home = getHomepage(lang);

      it("returns every story in the page language", () => {
        expect(home.lang).toBe(lang);
        for (const story of allStories(home)) expect(story.lang).toBe(lang);
      });

      it("has a lead, two top stories (DR-44) and 5 to 6 Latest items", () => {
        expect(home.hero).not.toBeNull();
        expect(home.hero!.top).toHaveLength(2);
        expect(home.hero!.latest.length).toBeGreaterThanOrEqual(5);
        expect(home.hero!.latest.length).toBeLessThanOrEqual(6);
        expect(home.hero!.lead.image).toBeDefined();
      });

      it("has analysis and opinion columns with the right formats", () => {
        const section = home.analysisOpinion!;
        expect(section.analysis.length).toBeGreaterThanOrEqual(3);
        expect(section.opinion.length).toBeGreaterThanOrEqual(3);
        for (const s of section.analysis) expect(s.format).toBe("analysis");
        for (const s of section.opinion) {
          expect(s.format).toBe("opinion");
          expect(s.author?.name).toBeTruthy();
        }
      });

      it("has both featured sections with a lead, one image story and two stories", () => {
        for (const section of [
          home.featured.southAsia!,
          home.featured.geopolitics!,
        ]) {
          expect(section.lead.image).toBeDefined();
          expect(section.rail).toHaveLength(3);
          expect(section.rail[0].image).toBeDefined();
        }
      });

      it("features the region দক্ষিণ এশিয়া with its own stories (DR-412)", () => {
        const section = home.featured.southAsia!;
        expect(section.source).toEqual({ kind: "region", id: "south-asia" });
        for (const s of [section.lead, ...section.rail])
          expect(s.regions).toContain("south-asia");
      });

      it("features the category ভূরাজনীতি with its own stories", () => {
        const section = home.featured.geopolitics!;
        expect(section.source).toEqual({ kind: "category", id: "geopolitics" });
        for (const s of [section.lead, ...section.rail])
          expect(s.category).toBe("geopolitics");
      });

      it("has the remaining categories in the grouped section, with the poll", () => {
        const grouped = home.grouped!;
        expect(grouped.categories.map((c) => c.category)).toEqual([
          "security",
          "history",
          "economy",
          "technology",
        ]);
        for (const block of grouped.categories) {
          expect(block.stories.length).toBeGreaterThanOrEqual(2);
          for (const s of block.stories)
            expect(s.category).toBe(block.category);
        }
        expect(grouped.poll.lang).toBe(lang);
        expect(grouped.poll.options.length).toBeGreaterThanOrEqual(2);
        expect(grouped.poll.options.length).toBeLessThanOrEqual(4);
      });

      it("has 5 most-read items (DR-51)", () => {
        expect(home.mostRead).toHaveLength(5);
      });

      it("gives each most-read item its rank from the data, 1 to 5 (DR-290)", () => {
        expect(home.mostRead!.map((s) => s.rank)).toEqual([1, 2, 3, 4, 5]);
      });

      it("has 6 or more regions, with চীন, and drops the region with no stories", () => {
        const ids = home.regions!.map((r) => r.region);
        expect(ids.length).toBeGreaterThanOrEqual(6);
        expect(ids).toContain("china");
        expect(homepagePlans.full.regions).toContain("oceania");
        expect(ids).not.toContain("oceania");
        for (const block of home.regions!) {
          expect(block.stories.length).toBeGreaterThan(0);
          for (const s of block.stories)
            expect(s.regions).toContain(block.region);
        }
      });
    });
  }

  it("returns the same story ids in Bangla and English", () => {
    const ids = (h: Homepage) => allStories(h).map((s) => s.id);
    expect(ids(getHomepage("bn"))).toEqual(ids(getHomepage("en")));
  });
});

describe("getHomepage sparse (spacing-layout-system.md 7.3)", () => {
  const home = getHomepage("bn", { variant: "sparse" });

  it("P-1: one top story, a lead with no image, a short Latest", () => {
    expect(home.hero!.top).toHaveLength(1);
    expect(home.hero!.lead.image).toBeUndefined();
    expect(home.hero!.latest.length).toBeLessThan(5);
  });

  it("P-4: one column is empty", () => {
    expect(home.analysisOpinion!.opinion).toHaveLength(0);
    expect(home.analysisOpinion!.analysis.length).toBeGreaterThan(0);
  });

  it("P-2: no rail stories, and one featured section with no content", () => {
    expect(home.featured.southAsia!.rail).toHaveLength(0);
    expect(home.featured.geopolitics).toBeNull();
  });

  it("P-3: an odd number of categories", () => {
    expect(home.grouped!.categories.length % 2).toBe(1);
  });

  it("P-5: fewer than 5 items", () => {
    expect(home.mostRead!.length).toBeLessThan(5);
  });

  it("P-3b: 4 regions or fewer, and the empty one is dropped", () => {
    expect(homepagePlans.sparse.regions).toContain("oceania");
    expect(home.regions!.length).toBeLessThanOrEqual(4);
    expect(home.regions!.map((r) => r.region)).not.toContain("oceania");
  });
});

describe("same story ids in both languages (R2-03)", () => {
  const ids = (h: Homepage) => allStories(h).map((s) => s.id);

  it("has the same ids in the sparse homepage", () => {
    expect(ids(getHomepage("bn", { variant: "sparse" }))).toEqual(
      ids(getHomepage("en", { variant: "sparse" })),
    );
  });

  it("has a title in both languages for every story", () => {
    for (const def of stories) {
      expect(def.bn.title.trim(), def.slug).toBeTruthy();
      expect(def.en.title.trim(), def.slug).toBeTruthy();
    }
  });

  it("keeps the same image and slug in both languages", () => {
    for (const def of stories) {
      const bnStory = getStory(def.slug, "bn");
      const enStory = getStory(def.slug, "en");
      expect(bnStory.slug).toBe(enStory.slug);
      expect(bnStory.image?.src).toBe(enStory.image?.src);
    }
  });
});

describe("poll", () => {
  for (const lang of langs) {
    it(`has a question and 2 to 4 answers in ${lang}`, () => {
      const poll = getPoll(lang);
      expect(poll.lang).toBe(lang);
      expect(poll.question.trim()).toBeTruthy();
      expect(poll.options.length).toBeGreaterThanOrEqual(2);
      expect(poll.options.length).toBeLessThanOrEqual(4);
      for (const o of poll.options) {
        expect(o.label.trim()).toBeTruthy();
        if (lang === "bn") expect(o.label).toMatch(BENGALI);
        else expect(o.label).not.toMatch(BENGALI);
      }
    });
  }

  it("has the same answer ids in both languages", () => {
    expect(getPoll("bn").options.map((o) => o.id)).toEqual(
      getPoll("en").options.map((o) => o.id),
    );
  });
});

describe("mock ads (spacing-layout-system.md 9, C-16)", () => {
  const slots = ["ad-top", "ad-band", "ad-inset", "ad-rail"] as const;
  // Sizes each slot serves, from the table in 9.
  const allowed: Record<(typeof slots)[number], string[]> = {
    "ad-top": ["320x100", "320x50", "728x90", "970x250", "970x90"],
    "ad-band": ["336x280", "300x250", "728x90", "970x250", "970x90"],
    "ad-inset": ["300x250", "728x90"],
    "ad-rail": ["300x600", "300x250"],
  };

  it("has exactly one booking for each slot", () => {
    expect(ads.map((a) => a.slot).sort()).toEqual([...slots].sort());
  });

  for (const lang of langs) {
    for (const slot of slots) {
      it(`serves only allowed local creatives for ${slot} in ${lang}`, () => {
        const ad = getAd(slot, lang);
        expect(ad.advertiser.trim()).toBeTruthy();
        expect(ad.alt).toContain(ad.advertiser);
        expect(ad.creatives.length).toBeGreaterThan(0);
        for (const c of ad.creatives) {
          expect(allowed[slot]).toContain(`${c.width}x${c.height}`);
          expect(c.src).toMatch(/^\/mock\/ad-\d+x\d+\.svg$/);
          const file = join(process.cwd(), "public", c.src);
          expect(existsSync(file), c.src).toBe(true);
          const [, w, h] =
            /viewBox="0 0 (\d+) (\d+)"/.exec(readFileSync(file, "utf8")) ?? [];
          expect([Number(w), Number(h)]).toEqual([c.width, c.height]);
        }
      });
    }
  }

  it("has a rail creative of 300x600 or 300x250 (DR-241)", () => {
    const sizes = getAd("ad-rail", "en").creatives.map(
      (c) => `${c.width}x${c.height}`,
    );
    expect(sizes).toEqual(expect.arrayContaining(["300x600"]));
  });

  it("uses no remote image or link scheme other than https", () => {
    for (const ad of ads) expect(ad.link).toMatch(/^https:\/\//);
  });

  it("throws for a slot with no booking", () => {
    // @ts-expect-error not a slot
    expect(() => getAd("ad-inline", "bn")).toThrow(/No mock ad/);
  });
});

describe("no newsletter content (DR-239)", () => {
  it("has none in the content files", () => {
    const text = JSON.stringify([stories, ads, getPoll("bn"), getPoll("en")]);
    expect(text).not.toMatch(/newsletter|নিউজলেটার/i);
  });
});

describe("getStory", () => {
  it("throws for an unknown slug", () => {
    expect(() => getStory("no-such-story", "bn")).toThrow(/Unknown story slug/);
  });
});

// The category page (spacing-layout-system.md 7B).
describe("category pages", () => {
  for (const category of categoryIds) {
    it(`${category}: 16 stories or more, every section full, More news has a second load`, () => {
      const defs = stories.filter((def) => def.category === category);
      expect(defs.length).toBeGreaterThanOrEqual(16);
      for (const lang of langs) {
        const page = getCategoryPage(category, lang);
        expect(page.feature?.image).toBeTruthy();
        expect(page.latest).toHaveLength(5);
        expect(page.cards).toHaveLength(3);
        for (const s of page.cards) expect(s.image).toBeTruthy();
        expect(page.mostRead.map((s) => s.rank)).toEqual([1, 2, 3, 4, 5]);
        // 10 at a time: more than 10 left gives a second load.
        expect(page.more.length).toBeGreaterThan(10);
        const shown = [
          page.feature!,
          ...page.latest,
          ...page.cards,
          ...page.more,
        ];
        // Every story of the category once, newest first after the feature story, all in it.
        expect(new Set(shown.map((s) => s.id)).size).toBe(defs.length);
        for (const s of [...shown, ...page.mostRead])
          expect(s.category).toBe(category);
      }
    });

    it(`${category}: the most read ranking has 8 ids that exist in the category`, () => {
      const ids = categoryMostRead[category];
      expect(ids).toHaveLength(8);
      expect(new Set(ids).size).toBe(8);
      for (const id of ids) expect(getStory(id, "bn").category).toBe(category);
    });
  }
});

describe("article URLs (layout 7C, DR-413)", () => {
  const river = stories.find((s) => s.slug === "river-data-framework")!;
  const ledgers = stories.find((s) => s.slug === "old-dhaka-trade-ledgers")!;

  it("builds and splits the segment <slug>-<id>", () => {
    expect(storyRef(river)).toBe(`river-data-framework-${river.id}`);
    expect(parseStoryRef(storyRef(river))).toEqual({
      slug: "river-data-framework",
      id: river.id,
    });
    // "framework" has 9 characters, so it is not an id.
    expect(parseStoryRef("river-data-framework")).toBeNull();
  });

  it("sends an old root whose last word looks like an id to the current segment", () => {
    // "centre" has the shape of an id but is not one.
    const centre = stories.find((s) => s.slug === "cyber-response-centre")!;
    expect(parseStoryRef("cyber-response-centre")?.id).toBe("centre");
    // No full text, so no page: nothing to send the reader to.
    expect(currentStoryRef("cyber-response-centre", "bn")).toBeNull();
    expect(centre).toBeDefined();
  });

  it("finds the current segment for a wrong slug or the old root", () => {
    expect(currentStoryRef(`wrong-slug-${river.id}`, "bn")).toBe(
      storyRef(river),
    );
    expect(currentStoryRef("river-data-framework", "en")).toBe(storyRef(river));
  });

  it("leaves a current segment, an unknown id and a missing language alone", () => {
    expect(currentStoryRef(storyRef(river), "bn")).toBeNull();
    expect(currentStoryRef("no-such-story-zzzzzzz", "bn")).toBeNull();
    // Bangla only (DR-401): no English page to send the reader to.
    expect(currentStoryRef(`old-slug-${ledgers.id}`, "en")).toBeNull();
    expect(currentStoryRef(`old-slug-${ledgers.id}`, "bn")).toBe(
      storyRef(ledgers),
    );
  });

  it("finds an article by its segment in the languages it exists in (DR-401)", () => {
    expect(getArticleByRef(storyRef(river), "en")?.story.slug).toBe(
      "river-data-framework",
    );
    expect(getArticleByRef(storyRef(ledgers), "bn")).not.toBeNull();
    expect(getArticleByRef(storyRef(ledgers), "en")).toBeNull();
    expect(getArticleByRef(`wrong-${river.id}`, "bn")).toBeNull();
    expect(articleLangsOf("old-dhaka-trade-ledgers")).toEqual(["bn"]);
  });
});
