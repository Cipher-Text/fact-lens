// Mock ads (spacing-layout-system.md 9.2). One booking per slot, one creative
// per size that the slot serves. Local SVG files only: no ad network and no
// remote images (mock-content rule 9). The advertiser is fictional.
import type { AdSlotId, Lang } from "./types";

export interface AdCreativeDef {
  /** Creative size as `<width>x<height>`, the same text as in the file name. */
  size: string;
  width: number;
  height: number;
}

export interface AdDef {
  slot: AdSlotId;
  advertiser: Record<Lang, string>;
  link: string;
  startsOn: string; // ISO date
  endsOn: string; // ISO date
  /** Sizes that the slot serves, from the table in 9 and the sheet C-16. */
  creatives: AdCreativeDef[];
}

const size = (width: number, height: number): AdCreativeDef => ({
  size: `${width}x${height}`,
  width,
  height,
});

const advertiser = { bn: "নমুনা বিজ্ঞাপনদাতা", en: "Sample Advertiser" };
const link = "https://example.com/";
const dates = { startsOn: "2026-10-01", endsOn: "2026-12-31" };

export const ads: AdDef[] = [
  {
    slot: "ad-top",
    advertiser,
    link,
    ...dates,
    creatives: [size(320, 100), size(728, 90), size(970, 250)],
  },
  {
    slot: "ad-band",
    advertiser,
    link,
    ...dates,
    creatives: [
      size(336, 280),
      size(300, 250),
      size(728, 90),
      size(970, 250),
    ],
  },
  {
    slot: "ad-inset",
    advertiser,
    link,
    ...dates,
    creatives: [size(300, 250), size(728, 90)],
  },
  {
    // 300x600 or 300x250 from 1280 (DR-241). Both are mock files.
    slot: "ad-rail",
    advertiser,
    link,
    ...dates,
    creatives: [size(300, 600), size(300, 250)],
  },
];
