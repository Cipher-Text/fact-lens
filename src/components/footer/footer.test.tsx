import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "./Footer";

const CASES = [
  {
    lang: "bn",
    prefix: "",
    siteNav: "সাইটের তথ্য",
    social: "সামাজিক মাধ্যমে ফ্যাক্ট লেন্স",
    pages: [
      "আমাদের সম্পর্কে",
      "যোগাযোগ",
      "সংশোধনী",
      "গোপনীয়তা নীতি",
      "শর্তাবলি",
    ],
    copyright: /^© [০-৯]{4} ফ্যাক্ট লেন্স/,
    networks: ["ফেসবুক", "ইউটিউব", "এক্স", "ইনস্টাগ্রাম", "লিংকডইন"],
  },
  {
    lang: "en",
    prefix: "/en",
    siteNav: "About the site",
    social: "Fact Lens on social media",
    pages: ["About", "Contact", "Corrections", "Privacy", "Terms"],
    copyright: /^© 20\d\d Fact Lens\. All rights reserved\.$/,
    networks: ["Facebook", "YouTube", "X", "Instagram", "LinkedIn"],
  },
] as const;

const PATHS = ["about", "contact", "corrections", "privacy", "terms"];

describe("Footer (spacing-layout-system.md 7.4, DR-59)", () => {
  for (const c of CASES) {
    describe(c.lang, () => {
      it("is the contentinfo landmark with the logo linking home", () => {
        render(<Footer lang={c.lang} />);
        const footer = screen.getByRole("contentinfo");
        const logo = footer.querySelector("[data-logo]");
        expect(logo).toHaveAttribute("href", c.prefix || "/");
        expect(logo?.className).toContain("text-brand"); // identity only (COL-04)
      });

      it("links About, Contact, Corrections, Privacy and Terms in the page language", () => {
        render(<Footer lang={c.lang} />);
        const nav = screen.getByRole("navigation", { name: c.siteNav });
        const links = within(nav).getAllByRole("link");
        // Source order is the reading order (LAY-14).
        expect(links.map((l) => l.textContent)).toEqual([...c.pages]);
        expect(links.map((l) => l.getAttribute("href"))).toEqual(
          PATHS.map((p) => `${c.prefix}/${p}`),
        );
        for (const link of links) {
          expect(link.className).toContain("text-ink-secondary"); // C-21 Footer.links
          expect(link.className).toContain("hover:text-interactive-hover");
          expect(link.className).toContain("active:text-interactive-pressed");
          expect(link.className).not.toMatch(/underline/); // COL-06
          expect(link.className).not.toMatch(/\bring/); // COL-13: the base outline, no ring classes
        }
      });

      it("is a surface-elevated band with the panel inset, not surface-alt (C-21, LAY-20)", () => {
        render(<Footer lang={c.lang} />);
        const footer = screen.getByRole("contentinfo");
        expect(footer.className).toContain("bg-surface-elevated");
        expect(footer.className).not.toContain("surface-alt");
        expect(footer.querySelector(".panel-inset")).not.toBeNull();
      });

      it("shows the copyright line in metadata size and ink-muted", () => {
        render(<Footer lang={c.lang} />);
        const line = screen
          .getByRole("contentinfo")
          .querySelector("p.type-metadata");
        expect(line?.className).toContain("text-ink-muted");
        expect(line?.textContent).toMatch(c.copyright);
      });

      it("gives each social link a text name for screen readers and hides the icon", () => {
        render(<Footer lang={c.lang} />);
        const list = screen.getByRole("list", { name: c.social });
        const links = within(list).getAllByRole("link");
        expect(links.map((l) => l.getAttribute("aria-label"))).toEqual([
          ...c.networks,
        ]);
        for (const link of links) {
          expect(link).toHaveAccessibleName();
          expect(link.getAttribute("href")).toMatch(/^https:\/\//);
          const svg = link.querySelector("svg");
          expect(svg).toHaveAttribute("aria-hidden", "true");
          expect(svg).toHaveAttribute("fill", "currentColor");
          expect(link.className).toContain("text-ink"); // ink icons (C-21 Footer.social)
        }
      });
    });
  }

  it("shows no interface text from the other language (T-27)", () => {
    const { container } = render(<Footer lang="bn" />);
    const text = [
      container.textContent ?? "",
      ...Array.from(container.querySelectorAll("[aria-label]")).map(
        (el) => el.getAttribute("aria-label") ?? "",
      ),
    ].join(" ");
    expect(text).not.toMatch(/[A-Za-z]/);
  });
});
