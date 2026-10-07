import type { Dictionary } from "./types";

// English interface strings. bn.ts has the same keys (T-27).
export const en: Dictionary = {
  site: {
    name: "Fact Lens",
    description: "News, analysis and opinion from Bangladesh and the world",
  },
  language: {
    // The switch names the other language in that language (DR-78).
    other: "বাংলা",
  },
  theme: {
    label: "Theme",
    optionSystem: "System",
    optionLight: "Light",
    optionDark: "Dark",
  },
  home: {
    placeholder: "The homepage is being built.",
    foundationsLink: "See the temporary design foundations page",
  },
  // Temporary page for FL-02. Remove with the page in FL-13.
  foundations: {
    title: "Design foundations",
    note: "Temporary page for checking the colors and type roles.",
    colorsTitle: "Colors",
    typeTitle: "Type roles",
    formatTitle: "Numbers and dates",
    bangla: "Bangla",
    english: "English",
    selectionHint: "Select some of this text to see the selection color.",
    groups: {
      surfaces: "Surfaces",
      ink: "Ink",
      brand: "Brand and interactive",
      accent: "Accent tints",
      borders: "Borders",
      status: "Status",
      utility: "Utility",
    },
  },
};
