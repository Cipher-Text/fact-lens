import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDictionary } from "@/i18n";

import ErrorBoundary from "./error";

const { useParams } = vi.hoisted(() => ({ useParams: vi.fn() }));
vi.mock("next/navigation", () => ({ useParams }));

describe("localized unavailable page", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["en", "bn"] as const)("renders the %s copy and home link", (lang) => {
    useParams.mockReturnValue({ lang });
    render(<ErrorBoundary error={new Error("API unavailable")} reset={vi.fn()} />);
    const t = getDictionary(lang);

    expect(screen.getByRole("heading", { name: t.unavailable.title })).toBeInTheDocument();
    expect(screen.getByText(t.unavailable.body)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t.header.navHome })).toHaveAttribute(
      "href",
      lang === "en" ? "/en" : "/",
    );
  });
});
