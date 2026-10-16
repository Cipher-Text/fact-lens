import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { getHomepage, getPoll } from "@/content";
import { getDictionary } from "@/i18n";

import { DailyPoll } from "./DailyPoll";
import {
  GroupedCategoriesSection,
  MAX_INSETS,
} from "./GroupedCategoriesSection";
import { pollStorageKey } from "./usePollVote";

function renderSection(lang: "bn" | "en", variant: "full" | "sparse" = "full") {
  const grouped = getHomepage(lang, { variant }).grouped!;
  return render(
    <GroupedCategoriesSection
      lang={lang}
      categories={grouped.categories}
      poll={grouped.poll}
      t={getDictionary(lang)}
    />,
  );
}

const rowsOf = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-grouped-row]")].map((row) =>
    [...row.querySelectorAll("[data-category-block]")].map((el) =>
      el.getAttribute("data-category-block"),
    ),
  );

beforeEach(() => window.localStorage.clear());

describe("GroupedCategoriesSection (P-3)", () => {
  it("puts the categories in rows of two in the wrapper, then the rail (LAY-05, LAY-14)", () => {
    const { container } = renderSection("bn");
    const grid = container.querySelector(".with-rail")!;
    expect(
      [...grid.children].map((el) =>
        el.hasAttribute("data-grouped-wrapper") ? "wrapper" : "rail",
      ),
    ).toEqual(["wrapper", "rail"]);
    expect(rowsOf(container)).toEqual([
      ["security", "history"],
      ["economy", "technology"],
    ]);
    const row = container.querySelector("[data-grouped-row]")!;
    expect(row.className).toContain("sm:grid-cols-2");
    expect(row.className).not.toMatch(/grid-cols-[34]/); // LAY-07
  });

  it("has an ad-inset between rows, in the wrapper (Section 9)", () => {
    const { container } = renderSection("bn");
    const wrapper = container.querySelector("[data-grouped-wrapper]")!;
    expect(
      [...wrapper.children].map(
        (el) => el.getAttribute("data-ad-slot") ?? "row",
      ),
    ).toEqual(["row", "ad-inset", "row"]);
    // The only ad in the rail is ad-rail (checked below); no inset there.
    expect(
      container.querySelector('[data-grouped-rail] [data-ad-slot="ad-inset"]'),
    ).toBeNull();
    expect(MAX_INSETS).toBe(3);
  });

  it("keeps an odd last category alone in its row (7.3)", () => {
    const { container } = renderSection("bn", "sparse");
    expect(rowsOf(container)).toEqual([["security", "history"], ["economy"]]);
  });

  it("gives each category its heading and nav anchor (IMP-14)", () => {
    renderSection("bn");
    const section = screen.getByRole("region", { name: "অর্থনীতি ও বাণিজ্য" });
    expect(section).toHaveAttribute("id", "category-economy");
    // The feature story is a StoryCard (title, summary, 3:2 image); then a list of 2 (C-23).
    const feature = section.querySelector("[data-story-card]")!;
    expect(
      within(feature as HTMLElement).getByRole("heading", { level: 3 }),
    ).toHaveClass("type-story-title");
    expect(feature.querySelector("img")).not.toBeNull();
    expect(feature.className).not.toMatch(/rounded|border/);
    const items = within(section).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    for (const li of items) {
      expect(within(li).getByRole("heading", { level: 3 })).toHaveClass(
        "type-story-title-sm",
      );
    }
    // The block heading is plain text, not a link (DR-122).
    expect(
      within(section).getByRole("heading", { level: 2 }).querySelector("a"),
    ).toBeNull();
  });

  it("has the poll, then the rail ad, in the rail; no newsletter, no ad colors in the poll (DR-239, 7.4)", () => {
    const { container } = renderSection("en");
    const rail = container.querySelector("[data-grouped-rail]")!;
    expect(
      [...rail.children].map((el) => el.getAttribute("data-ad-slot") ?? "poll"),
    ).toEqual(["poll", "ad-rail"]);
    // The rail ad is in the HTML at every width and hidden under 1280 (9.1, DR-244).
    expect(rail.querySelector('[data-ad-slot="ad-rail"]')).toHaveClass(
      "hidden",
      "xl:grid",
    );
    expect(rail.querySelector("[data-poll]")!.innerHTML).not.toMatch(
      /(^|[\s"])bg-surface-alt/,
    );
    expect(container.querySelector("#newsletter")).toBeNull();
    expect(container.textContent).not.toMatch(/newsletter/i);
  });

  it("ends each block with a MoreLink to the category page (DR-110)", () => {
    renderSection("en");
    const section = screen.getByRole("region", { name: "Economy and Trade" });
    expect(
      within(section).getByRole("link", {
        name: "See more: Economy and Trade",
      }),
    ).toHaveAttribute("href", "/en/category/economy");
  });

  it("uses the page language for every interface string (T-27)", () => {
    const { container } = renderSection("en");
    expect(container.textContent).not.toMatch(/[ঀ-৿]/);
  });
});

describe("DailyPoll", () => {
  const poll = getPoll("bn");
  const strings = getDictionary("bn").poll;

  it("does nothing when the vote button is pressed with no choice (C-26)", async () => {
    const user = userEvent.setup();
    render(<DailyPoll poll={poll} strings={strings} />);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByRole("group", { name: poll.question })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "ভোট দিন" }));
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.queryByRole("status")).toBeNull();
    expect(window.localStorage.getItem(pollStorageKey(poll.id))).toBeNull();
  });

  it("records one vote per browser and shows the results in Bangla digits", async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(
      <DailyPoll poll={poll} strings={strings} />,
    );
    await user.click(screen.getByRole("radio", { name: "জলবায়ু ও দুর্যোগ" }));
    await user.click(screen.getByRole("button", { name: "ভোট দিন" }));

    expect(window.localStorage.getItem(pollStorageKey(poll.id))).toBe(
      "climate",
    );
    expect(screen.queryByRole("radio")).toBeNull();
    const mine = container.querySelector('[data-poll-result="climate"]')!;
    expect(mine).toHaveTextContent("আপনার ভোট");
    // 538 + 1 of 1,401 votes is 38.47%; the largest remainder rounds it to 39%, so the four add up to 100.
    expect(mine).toHaveTextContent("৩৯%");
    expect(container).toHaveTextContent("১,৪০১ জন ভোট দিয়েছেন");
    expect(container.textContent).not.toMatch(/[0-9]/);
    expect(screen.getByRole("status")).toBe(
      container.querySelector("[data-poll-results]"),
    );

    // A new visit shows the results, not the form.
    unmount();
    render(<DailyPoll poll={poll} strings={strings} />);
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByText("৩৯%")).toBeInTheDocument();
  });
});
