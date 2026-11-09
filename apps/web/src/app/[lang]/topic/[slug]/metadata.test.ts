import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Story, TopicPage } from "@/content";

// generateMetadata of the topic page with a mocked loader: no mock topic has fewer than 3
// stories, so the noindex case is tested here (DR-432, layout 7E.2).
const getTopicPage = vi.fn<(lang: string, slug: string) => TopicPage>();
vi.mock("@/content", () => ({
  getTopicPage: (lang: string, slug: string) => getTopicPage(lang, slug),
  getTopicSlugs: () => [],
}));

const { generateMetadata } = await import("./page");

function topicWith(count: number): TopicPage {
  return {
    lang: "en",
    topic: { id: "archives", slug: "archives", label: "Archives" },
    stories: Array.from(
      { length: count },
      (_, i) => ({ id: `s${i}` }) as Story,
    ),
  };
}

async function metadataFor(count: number) {
  getTopicPage.mockReturnValue(topicWith(count));
  return generateMetadata({
    params: Promise.resolve({ lang: "en", slug: "archives" }),
  } as Parameters<typeof generateMetadata>[0]);
}

describe("topic page generateMetadata robots (DR-432)", () => {
  beforeEach(() => getTopicPage.mockReset());

  it("is noindex, follow with 2 stories", async () => {
    expect((await metadataFor(2)).robots).toEqual({
      index: false,
      follow: true,
    });
  });

  it("sets no robots rule with 3 stories", async () => {
    const metadata = await metadataFor(3);
    expect(metadata.robots).toBeUndefined();
    expect(metadata.title).toBe("Archives");
  });
});
