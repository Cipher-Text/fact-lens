import { fireEvent, render, screen } from "@testing-library/react";
import { Search } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { Divider, dividerItem } from "@/components/layout/Divider";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { getHomepage } from "@/content";
import { bn } from "@/i18n/bn";
import { en } from "@/i18n/en";

import { Button } from "./Button";
import { Chip } from "./Chip";
import { Eyebrow } from "./Eyebrow";
import { IconButton } from "./IconButton";
import { MetaLine, storyMetaItems } from "./MetaLine";
import { MoreLink } from "./MoreLink";

// R2-04: the small parts against their sheets (component-system.md C-08 to C-13, C-22;
// CPT-05, CPT-06, CPT-10, CPT-13, CPT-15, COL-06, COL-13).

const NO_ROUNDING =
  /\brounded|\bshadow|\bring|\bunderline|\bborder-(?!border-interactive)/;

describe("Divider (C-22)", () => {
  it("draws the section rule with the bar on it, decorative", () => {
    const { container } = render(<Divider />);
    const divider = container.firstElementChild!;
    expect(divider).toHaveAttribute("aria-hidden", "true");
    expect(divider).toHaveClass("h-(--bar-section-height)");
    expect(divider.querySelector("span")).toHaveClass("h-0.5", "bg-border"); // 2px rule
    expect(divider.querySelector("[data-divider-bar]")).toHaveClass(
      "bottom-0",
      "h-full",
      "w-(--bar-section-width)",
      "bg-(--color-bar)",
    );
  });

  it("has a dotted item rule from the divider-item utility, none above the first row", () => {
    // The utility (components.css) draws the 1px dotted gradient rule, space-list-item on each
    // side, and no rule on the first child. No border-style dotted (DR-262).
    expect(dividerItem).toBe("divider-item");
    expect(dividerItem).not.toMatch(/border/);
  });
});

describe("SectionHeading (C-13)", () => {
  it("has a plain text heading, never a link (CPT-13)", () => {
    const { container } = render(
      <SectionHeading id="x">Latest</SectionHeading>,
    );
    const heading = screen.getByRole("heading", { level: 2, name: "Latest" });
    expect(heading).toHaveClass("type-section-title");
    expect(heading.querySelector("a")).toBeNull();
    expect(container.querySelector("[data-divider]")).not.toBeNull();
  });

  it("puts the actions at the end edge in a row of 44px or more", () => {
    render(
      <SectionHeading actions={<button type="button">act</button>}>
        Regions
      </SectionHeading>,
    );
    const row = screen.getByRole("button", { name: "act" }).parentElement!;
    expect(row).toHaveClass("min-h-11", "justify-between");
  });
});

describe("MoreLink (C-10)", () => {
  it("is aligned to the end edge, 44px tall, with a decorative chevron and no underline", () => {
    render(<MoreLink href="/bn/x" section="বাংলাদেশ" strings={bn.common} />);
    const link = screen.getByRole("link", { name: "আরও দেখুন: বাংলাদেশ" });
    expect(link.parentElement).toHaveClass("text-end");
    expect(link).toHaveClass(
      "min-h-11",
      "type-ui-sm",
      "font-semibold",
      "text-interactive",
      "hover:text-interactive-hover",
      "active:text-interactive-pressed",
    );
    expect(link.className).not.toMatch(NO_ROUNDING);
    expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Eyebrow (C-08)", () => {
  const { top } = (() => {
    const home = getHomepage("en");
    return { top: home.hero!.lead };
  })();

  it("links the story's category with hover and pressed colors", () => {
    render(<Eyebrow story={top} strings={en} className="mb-2" />);
    const link = screen.getByRole("link", {
      name: en.categories[top.category],
    });
    expect(link).toHaveAttribute("href", `/en/category/${top.category}`);
    expect(link).toHaveClass(
      "text-interactive",
      "hover:text-interactive-hover",
      "active:text-interactive-pressed",
    );
    expect(link.className).not.toMatch(NO_ROUNDING);
    expect(link.parentElement).toHaveClass("type-eyebrow");
  });
});

describe("MetaLine (C-09)", () => {
  it("joins items with a drawn 4px square separator, hidden from screen readers (CPT-10)", () => {
    const { container } = render(
      <MetaLine
        items={[<span key="a">A</span>, <span key="b">B</span>, "C"]}
      />,
    );
    const separators = container.querySelectorAll("[data-meta-separator]");
    expect(separators).toHaveLength(2);
    for (const separator of separators) {
      expect(separator).toHaveAttribute("aria-hidden", "true");
      expect(separator).toHaveClass("size-1", "mx-2.5", "bg-(--color-meta)");
      expect(separator.className).not.toMatch(/rounded/);
    }
    expect(container.textContent).toBe("ABC");
  });

  it("has no separator for one item and uses the metadata role at weight 400", () => {
    const { container } = render(<MetaLine items={["A"]} />);
    expect(container.querySelector("[data-meta-separator]")).toBeNull();
    expect(container.firstElementChild).toHaveClass(
      "type-metadata",
      "text-(--color-meta)",
    );
    expect(container.firstElementChild!.className).not.toMatch(/font-/);
  });

  it("shows the time only, with no separator, when the story has no reading time (DR-272)", () => {
    const story = getHomepage("bn").hero!.lead;
    const noReading = { ...story, readingMinutes: undefined };
    const { container } = render(
      <MetaLine items={storyMetaItems(noReading, bn.story)} />,
    );
    expect(container.querySelectorAll("time")).toHaveLength(1);
    expect(container.querySelector("[data-meta-separator]")).toBeNull();
  });

  it("builds the time item, and the reading time only when asked", () => {
    const story = getHomepage("bn").hero!.lead;
    const withReading = { ...story, readingMinutes: 4 };
    expect(storyMetaItems(withReading, bn.story)).toHaveLength(2);
    expect(
      storyMetaItems(withReading, bn.story, { readingTime: false }),
    ).toHaveLength(1);
  });
});

describe("Chip (C-11)", () => {
  it("label is text on the bar color, not a control", () => {
    const { container } = render(<Chip variant="label">মতামত</Chip>);
    const chip = container.firstElementChild!;
    expect(chip.tagName).toBe("SPAN");
    expect(chip).toHaveClass(
      "bg-(--color-bar)",
      "text-on-interactive",
      "px-2",
      "py-0.5",
    );
    expect(chip.className).not.toMatch(/rounded|hover:/);
  });
});

describe("Button (C-12)", () => {
  it("primary is one 48px size with an interactive fill and hover and pressed fills", () => {
    render(<Button>ভোট দিন</Button>);
    const button = screen.getByRole("button", { name: "ভোট দিন" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass(
      "min-h-(--button-height)",
      "px-(--button-padding)",
      "bg-interactive",
      "text-on-interactive",
      "type-button",
      "whitespace-nowrap",
      "not-aria-disabled:hover:bg-interactive-hover",
      "not-aria-disabled:active:bg-interactive-pressed",
    );
    expect(button.className).not.toMatch(NO_ROUNDING);
  });

  it("fills its column with fullWidth", () => {
    render(<Button fullWidth>Vote</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });

  it("is disabled with aria-disabled: focus stays, the click does nothing", () => {
    const onClick = vi.fn();
    render(
      <Button aria-disabled="true" onClick={onClick}>
        Vote
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
    expect(button).toHaveClass(
      "aria-disabled:bg-surface-alt",
      "aria-disabled:text-ink-disabled",
    );
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("text has no fill and an ink-secondary label", () => {
    render(<Button variant="text">মুছুন</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass(
      "text-ink-secondary",
      "px-3.5",
      "not-aria-disabled:hover:text-interactive-hover",
      "not-aria-disabled:active:text-interactive-pressed",
    );
    expect(button.className).not.toMatch(/\bbg-/);
  });
});

describe("IconButton (C-12)", () => {
  it("has an accessible name, a 20px hidden icon and the 44px size", () => {
    render(<IconButton label="Search" icon={Search} />);
    const button = screen.getByRole("button", { name: "Search" });
    expect(button).toHaveClass("size-(--icon-button-size)", "bg-interactive");
    expect(button.querySelector("svg")).toHaveClass("size-5");
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(button.className).not.toMatch(NO_ROUNDING);
  });

  it("ghost has the ghost size by default; the 44px and field sizes stay (DR-349)", () => {
    const { rerender } = render(
      <IconButton label="a" icon={Search} variant="ghost" />,
    );
    expect(screen.getByRole("button")).toHaveClass(
      "size-(--icon-button-size-ghost)",
    );
    rerender(
      <IconButton label="a" icon={Search} variant="ghost" size="default" />,
    );
    expect(screen.getByRole("button")).toHaveClass("size-(--icon-button-size)");
    rerender(<IconButton label="a" icon={Search} size="field" />);
    expect(screen.getByRole("button")).toHaveClass("h-full", "aspect-square");
  });

  it("ghost has no wash: ink icon, interactive-hover on hover, interactive-pressed when pressed (DR-349)", () => {
    render(<IconButton label="a" icon={Search} variant="ghost" />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass(
      "text-ink",
      "not-aria-disabled:hover:text-interactive-hover",
      "not-aria-disabled:active:text-interactive-pressed",
    );
    expect(button.className).not.toMatch(/\bbg-/);
  });

  it("filled shows surface-alt and ink-disabled at an end, keeps focus and ignores the click", () => {
    const onClick = vi.fn();
    render(
      <IconButton label="Next" icon={Search} aria-disabled onClick={onClick} />,
    );
    const button = screen.getByRole("button", { name: "Next" });
    expect(button).toHaveClass(
      "aria-disabled:bg-surface-alt",
      "aria-disabled:text-ink-disabled",
    );
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
