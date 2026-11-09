import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins class names and drops falsy values", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });

  it("keeps the last of two conflicting Tailwind utilities", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  // The type scale steps that the default merge tables do not know (typography 3.2, TS-08).
  it("keeps a scale step next to a text color", () => {
    expect(cn("text-section", "text-ink")).toBe("text-section text-ink");
    expect(cn("text-nav", "text-ink")).toBe("text-nav text-ink");
    expect(cn("text-xs", "text-ink-muted")).toBe("text-xs text-ink-muted");
  });

  it("merges the scale steps as font sizes: the last one wins", () => {
    expect(cn("text-section", "text-xs")).toBe("text-xs");
    expect(cn("text-xs", "text-nav")).toBe("text-nav");
  });

  it("keeps the family next to the eyebrow weight", () => {
    expect(cn("font-ui", "font-eyebrow")).toBe("font-ui font-eyebrow");
    expect(cn("font-editorial", "font-semibold")).toBe(
      "font-editorial font-semibold",
    );
  });

  it("merges the eyebrow weight with other weights: the last one wins", () => {
    expect(cn("font-eyebrow", "font-semibold")).toBe("font-semibold");
    expect(cn("font-semibold", "font-eyebrow")).toBe("font-eyebrow");
  });

  it("keeps the eyebrow tracking next to the size and leading", () => {
    expect(cn("text-xs leading-tight tracking-eyebrow case-eyebrow")).toBe(
      "text-xs leading-tight tracking-eyebrow case-eyebrow",
    );
  });
});
