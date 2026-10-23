import { describe, expect, it } from "vitest";

import type { Block } from "@/content";

import { contextPosition } from "./placement";

const p = (text: string): Block => ({ type: "p", text });
const h2: Block = { type: "h2", id: "a", text: "A" };
const list: Block = { type: "list", items: ["x"] };

describe("contextPosition (the context card in the body)", () => {
  it("goes before the first section heading", () => {
    expect(contextPosition([p("1"), p("2"), h2, p("3")])).toBe(2);
  });

  it("goes before the first paragraph when there is no heading", () => {
    expect(contextPosition([list, p("1"), p("2")])).toBe(1);
  });

  it("goes at the top when there is no heading and no paragraph", () => {
    expect(contextPosition([list])).toBe(0);
  });
});
