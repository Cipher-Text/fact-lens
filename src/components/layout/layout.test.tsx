import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Divider } from "./Divider";
import { PageTitle } from "./PageTitle";
import { PeerCard, PeerRow } from "./PeerRow";
import { Rail } from "./Rail";
import { SectionHeading } from "./SectionHeading";
import { Shell } from "./Shell";
import { WithRail } from "./WithRail";
import { Wrapper } from "./Wrapper";

describe("Shell, WithRail, Wrapper and Rail", () => {
  it("use the container classes from layout.css", () => {
    render(
      <Shell as="section" data-testid="shell">
        <WithRail data-testid="grid">
          <Wrapper data-testid="wrapper" />
          <Rail as="aside" data-testid="rail" />
        </WithRail>
      </Shell>,
    );
    const shell = screen.getByTestId("shell");
    expect(shell.tagName).toBe("SECTION");
    expect(shell).toHaveClass("shell");
    expect(screen.getByTestId("grid")).toHaveClass("with-rail");
    expect(screen.getByTestId("rail").tagName).toBe("ASIDE");
  });

  it("keep the wrapper before the rail in the source (LAY-14)", () => {
    render(
      <WithRail data-testid="grid">
        <Wrapper data-testid="wrapper" />
        <Rail data-testid="rail" />
      </WithRail>,
    );
    const children = [...screen.getByTestId("grid").children];
    expect(children.map((el) => el.getAttribute("data-testid"))).toEqual([
      "wrapper",
      "rail",
    ]);
    for (const el of children) expect(el.className).not.toMatch(/\border-/);
  });
});

describe("Divider", () => {
  it("draws Divider.rule as one 1px solid border-color rule, hidden from screen readers (C-22)", () => {
    const { container } = render(<Divider variant="rule" />);
    const rule = container.firstElementChild!;
    expect(rule).toHaveAttribute("aria-hidden", "true");
    expect(rule).toHaveAttribute("data-divider", "rule");
    expect(rule).toHaveClass("h-(--divider-rule)", "w-full", "bg-border");
    expect(rule.children).toHaveLength(0);
  });

  it("keeps Divider.section as the default variant", () => {
    const { container } = render(<Divider />);
    expect(container.firstElementChild).toHaveAttribute(
      "data-divider",
      "section",
    );
  });
});

describe("SectionHeading", () => {
  it("renders the heading with its id and the section title role", () => {
    render(<SectionHeading id="bd">বাংলাদেশ</SectionHeading>);
    const heading = screen.getByRole("heading", { level: 2, name: "বাংলাদেশ" });
    expect(heading).toHaveAttribute("id", "bd");
    expect(heading).toHaveClass("text-section", "text-ink");
  });

  it("can be a level 3 heading", () => {
    render(<SectionHeading as="h3">Latest</SectionHeading>);
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });
});

describe("PeerRow and PeerCard", () => {
  it("has 1 column, and 2 from sm (LAY-07)", () => {
    render(<PeerRow data-testid="row" />);
    const classes = screen.getByTestId("row").className;
    expect(classes).toContain("grid-cols-1");
    expect(classes).toContain("sm:grid-cols-2");
    expect(classes).not.toMatch(/grid-cols-[34]/);
  });

  it("sets --card-parts for the subgrid (LAY-08)", () => {
    render(<PeerCard as="li" parts={5} data-testid="card" />);
    const card = screen.getByTestId("card");
    expect(card.tagName).toBe("LI");
    expect(card).toHaveClass("peer-card");
    expect(card.style.getPropertyValue("--card-parts")).toBe("5");
  });
});

describe("PageTitle (C-43)", () => {
  it("shows no description by default", () => {
    const { container } = render(<PageTitle title="Latest" />);
    expect(container.querySelector("[data-page-title-description]")).toBeNull();
    expect(container.querySelector("[data-page-title] p")).toBeNull();
  });

  it("puts the description below the h1, in the band: text-lg (deck), ink-secondary, no measure cap (analysis hub)", () => {
    const { container } = render(
      <PageTitle title="Analysis" description="In-depth analysis" />,
    );
    const h1 = screen.getByRole("heading", { level: 1 });
    const description = container.querySelector(
      "[data-page-title-description]",
    )!;
    expect(description.tagName).toBe("P");
    expect(description).toHaveTextContent("In-depth analysis");
    expect(description).toHaveClass(
      "mt-3",
      "font-editorial",
      "text-lg",
      "leading-relaxed",
      "text-ink-secondary",
    );
    expect(
      h1.compareDocumentPosition(description) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelector("[data-page-title]")).toContainElement(
      description as HTMLElement,
    );
  });
});
