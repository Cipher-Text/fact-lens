import { describe, expect, it } from "vitest";

import { migrateSaved, parseSaved } from "./saved";

describe("parseSaved (rd-saved in local storage)", () => {
  it("reads a list of story ids", () => {
    expect(parseSaved('["a","b"]')).toEqual(["a", "b"]);
  });

  it("reads a missing value as an empty list", () => {
    expect(parseSaved(null)).toEqual([]);
  });

  it("reads a value that is not JSON as an empty list", () => {
    expect(parseSaved("{not json")).toEqual([]);
    expect(parseSaved("")).toEqual([]);
  });

  it("reads JSON that is not a list as an empty list", () => {
    expect(parseSaved('{"a":1}')).toEqual([]);
    expect(parseSaved('"a"')).toEqual([]);
    expect(parseSaved("null")).toEqual([]);
  });

  it("drops items that are not strings", () => {
    expect(parseSaved('["a",1,null,"b"]')).toEqual(["a", "b"]);
  });
});

describe("migrateSaved (slugs saved before the URL format)", () => {
  const story = { id: "t3txcff", slug: "river-data-framework" };

  it("turns this story's old slug into its id, once", () => {
    expect(migrateSaved(["a", "river-data-framework"], story)).toEqual([
      "a",
      "t3txcff",
    ]);
    expect(migrateSaved(["t3txcff", "river-data-framework"], story)).toEqual([
      "t3txcff",
    ]);
  });

  it("leaves a list without the slug as it is", () => {
    const list = ["t3txcff", "other-slug"];
    expect(migrateSaved(list, story)).toBe(list);
  });
});
