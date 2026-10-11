import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { bn } from "@/i18n/bn";
import { en } from "@/i18n/en";

import { AdSlot, type AdSlotVariant } from "./AdSlot";

// C-16 AdSlot and spacing-layout-system.md Section 9.
const variants: { variant: AdSlotVariant; slot: string; box: string }[] = [
  { variant: "top", slot: "ad-top", box: "h-(--ad-top-h)" },
  { variant: "band", slot: "ad-band", box: "h-(--ad-band-h)" },
  { variant: "inset", slot: "ad-inset", box: "h-(--ad-inset-h)" },
  { variant: "rail", slot: "ad-rail", box: "h-(--ad-rail-h)" },
];

describe("AdSlot", () => {
  for (const { variant, slot, box } of variants) {
    it(`${variant} reserves its height token and has no spacing (LAY-09, LAY-10, LAY-19)`, () => {
      const { container } = render(
        <AdSlot variant={variant} lang="en" strings={en.ads} />,
      );
      const row = container.firstElementChild as HTMLElement;
      expect(row).toHaveAttribute("data-ad-slot", slot);
      expect(row).toHaveClass("bg-surface-alt");
      expect(row.className).not.toMatch(/\b-?[pm][xytblrse]?-/);
      expect(row.className).not.toMatch(/\b(sticky|fixed)\b/);
      expect(row.innerHTML).toContain(box);
    });
  }

  it("is a region named by the label, in the page language (C-16, T-27)", () => {
    render(<AdSlot variant="band" lang="bn" strings={bn.ads} />);
    expect(screen.getByRole("region", { name: "বিজ্ঞাপন" })).toBeVisible();
    expect(screen.queryByText("Advertisement")).toBeNull();
  });

  it("uses one picture with a source per tier and a phone fallback (9.2)", () => {
    const { container } = render(
      <AdSlot variant="band" lang="en" strings={en.ads} />,
    );
    const sources = [...container.querySelectorAll("source")].map((s) => [
      s.getAttribute("media"),
      s.getAttribute("srcset"),
    ]);
    expect(sources).toEqual([
      ["(min-width: 64rem)", "/mock/ad-970x250.svg"],
      ["(min-width: 48rem)", "/mock/ad-728x90.svg"],
      ["(min-width: 21rem)", "/mock/ad-336x280.svg"],
    ]);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("src", "/mock/ad-300x250.svg");
    expect(img).toHaveAttribute("width", "300");
    expect(img).toHaveAttribute("height", "250");
  });

  it("links to the advertiser as sponsored, with alt text that names it (9.2)", () => {
    const { container } = render(
      <AdSlot variant="top" lang="en" strings={en.ads} />,
    );
    const link = container.querySelector("a")!;
    expect(link).toHaveAttribute("rel", "sponsored noopener");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("img")).toHaveAccessibleName(/Sample Advertiser/);
  });

  it("loads the top ad at once and lazy-loads the others (9.1)", () => {
    for (const { variant } of variants) {
      const { container, unmount } = render(
        <AdSlot variant={variant} lang="en" strings={en.ads} />,
      );
      expect(container.querySelector("img")).toHaveAttribute(
        "loading",
        variant === "top" ? "eager" : "lazy",
      );
      unmount();
    }
  });

  it("hides the rail under 1280 and shows its 300x600 creative from 1280 (DR-245)", () => {
    const { container } = render(
      <AdSlot variant="rail" lang="en" strings={en.ads} />,
    );
    const row = container.firstElementChild as HTMLElement;
    expect(row).toHaveClass("hidden", "xl:grid");
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/mock/ad-300x600.svg",
    );
  });
});
