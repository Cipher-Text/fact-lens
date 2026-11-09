import { describe, expect, it } from "vitest";

import { topicRobots } from "./seo";

describe("topicRobots (DR-432)", () => {
  it("is noindex, follow below 3 stories", () => {
    for (const count of [0, 1, 2]) {
      expect(topicRobots(count)).toEqual({ index: false, follow: true });
    }
  });

  it("sets nothing from 3 stories", () => {
    for (const count of [3, 10, 14]) expect(topicRobots(count)).toBeUndefined();
  });
});
