import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./SiteFooter";

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
      "ব্যবহারের শর্তাবলি",
    ],
    networks: ["ফেসবুক", "ইউটিউব", "এক্স", "ইনস্টাগ্রাম"],
  },
  {
    lang: "en",
    prefix: "/en",
    siteNav: "About the site",
    social: "Fact Lens on social media",
    pages: ["About", "Contact", "Corrections", "Privacy", "Terms"],
    networks: ["Facebook", "YouTube", "X", "Instagram"],
  },
] as const;

const PATHS = ["about", "contact", "corrections", "privacy", "terms"];

describe("SiteFooter (spacing-layout-system.md 7.4, DR-59)", () => {
  for (const c of CASES) {
    describe(c.lang, () => {
      it("is the contentinfo landmark with the logo linking home", () => {
        render(<SiteFooter lang={c.lang} />);
        const footer = screen.getByRole("contentinfo");
        const logo = footer.querySelector("[data-logo]");
        expect(logo).toHaveAttribute("href", c.prefix || "/");
        expect(logo?.className).toContain("text-brand"); // identity only (COL-04)
      });

      it("links About, Contact, Corrections, Privacy and Terms in the page language", () => {
        render(<SiteFooter lang={c.lang} />);
        const nav = screen.getByRole("navigation", { name: c.siteNav });
        const links = within(nav).getAllByRole("link");
        // Source order is the reading order (LAY-14).
        expect(links.map((l) => l.textContent)).toEqual([...c.pages]);
        expect(links.map((l) => l.getAttribute("href"))).toEqual(
          PATHS.map((p) => `${c.prefix}/${p}`),
        );
        for (const link of links) {
          expect(link.className).toContain("text-interactive"); // COL-05
          expect(link.className).not.toMatch(/\bring/); // COL-13: the base outline, no ring classes
        }
      });

      it("gives each social link a text name for screen readers and hides the icon", () => {
        render(<SiteFooter lang={c.lang} />);
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
        }
      });
    });
  }

  it("shows no interface text from the other language (T-27)", () => {
    const { container } = render(<SiteFooter lang="bn" />);
    const text = [
      container.textContent ?? "",
      ...Array.from(container.querySelectorAll("[aria-label]")).map(
        (el) => el.getAttribute("aria-label") ?? "",
      ),
    ].join(" ");
    expect(text).not.toMatch(/[A-Za-z]/);
  });
});
