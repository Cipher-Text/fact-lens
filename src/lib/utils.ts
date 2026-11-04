import { createCn } from "cn/config";

/**
 * Class merging (clsx + tailwind-merge). The Fact Lens type scale adds steps that the
 * default merge tables do not know (typography-system.md Section 3): without them
 * `text-section` and `text-nav` read as colors and `font-eyebrow` as a font family, and a
 * later `text-ink` or `font-ui` removes them.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["section", "nav"] }],
      "font-weight": [{ font: ["eyebrow"] }],
      tracking: [{ tracking: ["eyebrow"] }],
    },
  },
});
