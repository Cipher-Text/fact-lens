import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getHomepage, getPoll } from "@/content";
import { getDictionary } from "@/i18n";

import { DailyPoll } from "./DailyPoll";
import { GroupedCategories, MAX_INSETS } from "./GroupedCategories";
import { MOCK_SEND_MS, NewsletterSignup } from "./NewsletterSignup";
import { pollStorageKey } from "./usePollVote";

function renderSection(lang: "bn" | "en", variant: "full" | "sparse" = "full") {
  const grouped = getHomepage(lang, { variant }).grouped!;
  return render(
    <GroupedCategories
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

describe("GroupedCategories (P-3)", () => {
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
    expect(
      container.querySelector("[data-grouped-rail] [data-ad-slot]"),
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
    const items = within(section).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items.map((li) => li.querySelectorAll("img").length)).toEqual([
      1, 0, 0,
    ]);
    expect(within(items[0]).getByRole("heading", { level: 3 })).toHaveClass(
      "type-story-title",
    );
    expect(within(items[1]).getByRole("heading", { level: 3 })).toHaveClass(
      "type-story-title-sm",
    );
  });

  it("has the newsletter, then the poll, in the rail with no ad colors (7.4)", () => {
    const { container } = renderSection("en");
    const rail = container.querySelector("[data-grouped-rail]")!;
    expect(
      [...rail.children].map((el) =>
        el.hasAttribute("data-newsletter") ? "newsletter" : "poll",
      ),
    ).toEqual(["newsletter", "poll"]);
    expect(rail.innerHTML).not.toContain("surface-alt");
    expect(rail.querySelector("#newsletter")).not.toBeNull();
  });

  it("uses the page language for every interface string (T-27)", () => {
    const { container } = renderSection("en");
    expect(container.textContent).not.toMatch(/[ঀ-৿]/);
  });
});

describe("NewsletterSignup", () => {
  afterEach(() => vi.useRealTimers());

  it("shows an error for a bad email, in the page language", async () => {
    const user = userEvent.setup();
    render(
      <NewsletterSignup lang="bn" strings={getDictionary("bn").newsletter} />,
    );
    const field = screen.getByLabelText("ইমেইল ঠিকানা");
    await user.type(field, "reader@");
    await user.click(screen.getByRole("button", { name: "সাবস্ক্রাইব করুন" }));
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("সঠিক ইমেইল ঠিকানা লিখুন।");
    expect(field).toHaveFocus();
    // Editing the field clears the error.
    await user.type(field, "x");
    expect(field).not.toHaveAttribute("aria-invalid");
  });

  it("goes from sending to done for a good email", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const strings = getDictionary("en").newsletter;
    const { container } = render(
      <NewsletterSignup lang="en" strings={strings} />,
    );
    await user.type(
      screen.getByLabelText("Email address"),
      "reader@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Subscribe" }));
    const section = container.querySelector("[data-newsletter]")!;
    expect(section).toHaveAttribute("data-status", "sending");
    expect(screen.getByRole("button", { name: "Sending…" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await act(() => vi.advanceTimersByTimeAsync(MOCK_SEND_MS));
    expect(section).toHaveAttribute("data-status", "done");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(strings.done);
    expect(screen.getByRole("status")).toHaveFocus();
  });

  it("links the consent line to the privacy page in the page language", () => {
    render(
      <NewsletterSignup lang="en" strings={getDictionary("en").newsletter} />,
    );
    expect(
      screen.getByRole("link", { name: "privacy policy" }),
    ).toHaveAttribute("href", "/en/privacy");
  });
});

describe("DailyPoll", () => {
  const poll = getPoll("bn");
  const strings = getDictionary("bn").poll;

  it("asks for an answer before it takes a vote", async () => {
    const user = userEvent.setup();
    render(<DailyPoll poll={poll} strings={strings} />);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    await user.click(screen.getByRole("button", { name: "ভোট দিন" }));
    expect(screen.getByText("একটি উত্তর বেছে নিন।")).toBeInTheDocument();
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
    expect(container).toHaveTextContent("মোট ১,৪০১টি ভোট");
    expect(container.textContent).not.toMatch(/[0-9]/);
    expect(screen.getByRole("status")).toHaveTextContent(strings.voted);

    // A new visit shows the results, not the form.
    unmount();
    render(<DailyPoll poll={poll} strings={strings} />);
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByText("৩৯%")).toBeInTheDocument();
  });
});
