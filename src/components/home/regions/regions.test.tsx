import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { getHomepage } from "@/content";
import { getDictionary } from "@/i18n";

import { Regions } from "./Regions";

beforeAll(() => {
  // jsdom has no ResizeObserver or matchMedia.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
});

function renderSection(lang: "bn" | "en", variant: "full" | "sparse" = "full") {
  const regions = getHomepage(lang, { variant }).regions!;
  const view = render(
    <Regions lang={lang} regions={regions} t={getDictionary(lang)} />,
  );
  return { ...view, regions };
}

describe("Regions (P-3b)", () => {
  it("is the #regions section named by its heading, with every region in the HTML", () => {
    const { container, regions } = renderSection("bn");
    const section = screen.getByRole("region", { name: "অঞ্চল" });
    expect(section.id).toBe("regions");
    const panels = container.querySelectorAll("[data-region]");
    expect([...panels].map((p) => p.id)).toEqual(
      regions.map((r) => `region-${r.region}`),
    );
    // চীন is a region here (DR-19); the region with no stories is gone (7.3).
    expect(regions.map((r) => r.region)).toContain("china");
    expect(regions.map((r) => r.region)).not.toContain("africa");
  });

  it("has one tab per region; the first is selected and its panel shows", () => {
    const { regions } = renderSection("bn");
    const tabs = within(screen.getByRole("tablist")).getAllByRole("tab");
    expect(tabs).toHaveLength(regions.length);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("tabindex", "0");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");
    const panel = document.getElementById(
      tabs[0].getAttribute("aria-controls")!,
    )!;
    expect(panel).toHaveAttribute("role", "tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", tabs[0].id);
    expect(panel.className).not.toContain("max-sm:hidden");
    const other = document.getElementById(
      tabs[1].getAttribute("aria-controls")!,
    )!;
    expect(other.className).toContain("max-sm:hidden");
  });

  it("moves the selection with the arrow keys, Home and End", () => {
    const { regions } = renderSection("en");
    const tablist = screen.getByRole("tablist");
    const tabs = within(tablist).getAllByRole("tab");
    tabs[0].focus();
    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(tabs[1]);
    fireEvent.keyDown(tablist, { key: "End" });
    expect(tabs[regions.length - 1]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(tablist, { key: "ArrowLeft" });
    expect(tabs[regions.length - 1]).toHaveAttribute("aria-selected", "true");
  });

  it("has previous and next buttons with names in the page language (7.4)", () => {
    renderSection("bn");
    const previous = screen.getByRole("button", { name: "আগের অঞ্চল" });
    const next = screen.getByRole("button", { name: "পরের অঞ্চল" });
    // At the start, previous is disabled. jsdom has no layout (the row does not
    // scroll), so the next button's state is tested in the browser (regions.spec.ts).
    expect(previous).toHaveAttribute("aria-disabled", "true");
    expect(next).toHaveAttribute("aria-controls", "regions-row");
    // Hidden below 600 (7.2: the slider buttons may hide per device).
    expect(previous.parentElement!.className).toMatch(/(^| )hidden( |$)/);
    expect(previous.parentElement!.className).toContain("sm:flex");
  });

  it("shows the buttons only while more regions exist than are in view (7.3, DR-140)", () => {
    const { regions } = renderSection("en", "sparse");
    expect(regions.length).toBeLessThanOrEqual(4);
    const buttons = screen.getByRole("button", {
      name: "Previous region",
    }).parentElement!;
    // 2 regions are in view at 600 to 1023 and 3 from 1024. With 3 regions the
    // buttons show only at 600 to 1023; with 4 they also show at 1024 to 1279.
    expect(buttons.className).toContain("xl:hidden");
    expect(buttons.className).toContain("lg:max-xl:hidden");
    expect(buttons.className).not.toContain("sm:max-lg:hidden");
  });

  it("keeps the buttons at every width with 5 or more regions", () => {
    const { regions } = renderSection("en");
    expect(regions.length).toBeGreaterThan(4);
    const buttons = screen.getByRole("button", {
      name: "Previous region",
    }).parentElement!;
    expect(buttons.className).not.toContain(":hidden");
  });

  it("uses the region-row class for 2, 3 and 4 regions in view", () => {
    const { container } = renderSection("en");
    const row = container.querySelector("[data-region-row]")!;
    expect(row).toHaveClass("region-row");
  });

  it("builds each panel from an image story and two text stories", () => {
    const { container } = renderSection("en");
    for (const panel of container.querySelectorAll("[data-region]")) {
      expect(panel.querySelectorAll("[data-story-card]")).toHaveLength(1);
      expect(
        panel.querySelectorAll("[data-story-list-item]").length,
      ).toBeLessThanOrEqual(2);
      // No "more" link per column (7.4).
      expect(panel.querySelector('a[href*="/regions"]')).toBeNull();
    }
  });

  it("has one 'See more' link at the section end, to the regions page (DR-142)", () => {
    const { container } = renderSection("en");
    const links = within(
      container.querySelector('[data-section="regions"]') as HTMLElement,
    ).getAllByRole("link", { name: /See more/ });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/en/regions");
    renderSection("bn");
    expect(
      screen.getByRole("link", { name: /আরও দেখুন: অঞ্চল/ }),
    ).toHaveAttribute("href", "/regions");
  });

  it("selects the region in the URL hash (nav and drawer links)", () => {
    window.location.hash = "#region-europe";
    renderSection("en");
    expect(
      screen.getByRole("tab", { name: getDictionary("en").regions.europe }),
    ).toHaveAttribute("aria-selected", "true");
    window.location.hash = "";
  });
});
