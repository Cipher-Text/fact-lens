import { describe, expect, it } from "vitest";

import { parseSaved } from "./saved";

describe("parseSaved (rd-saved in local storage)", () => {
  it("reads a list of slugs", () => {
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
