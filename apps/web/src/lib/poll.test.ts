import { describe, expect, it } from "vitest";

import { pollResults } from "./poll";

const options = [
  { id: "a", votes: 1 },
  { id: "b", votes: 1 },
  { id: "c", votes: 1 },
];

describe("pollResults", () => {
  it("gives whole percents that add up to 100", () => {
    const { results, total } = pollResults(options);
    expect(total).toBe(3);
    expect(results.map((r) => r.percent)).toEqual([34, 33, 33]);
  });

  it("adds the reader's vote to the chosen option", () => {
    const { results, total } = pollResults(options, "b");
    expect(total).toBe(4);
    expect(results.find((r) => r.id === "b")).toEqual({
      id: "b",
      votes: 2,
      percent: 50,
    });
    expect(results.reduce((sum, r) => sum + r.percent, 0)).toBe(100);
  });

  it("ignores an unknown vote id and handles no votes", () => {
    expect(pollResults(options, "x").total).toBe(3);
    const empty = pollResults([{ id: "a", votes: 0 }]);
    expect(empty.results[0].percent).toBe(0);
  });
});
