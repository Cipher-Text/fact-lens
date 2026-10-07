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
  header: {
    menu: "Menu",
    closeMenu: "Close menu",
    drawerNav: "All sections",
    mainNav: "Main sections",
    home: "Fact Lens, front page",
    search: "Search",
    searchField: "What are you looking for?",
    searchSubmit: "Search",
    closeSearch: "Close search",
    // Mock search (DR-01): the prototype has no results page.
    searchUnavailable: "This prototype does not show search results.",
    subscribe: "Subscribe",
  },
  home: {
    // Visually hidden: the page heading for screen readers.
    title: "Fact Lens: front page",
  },
  hero: {
    // Visually hidden name of the P-1 section.
    title: "Top stories",
    latest: "Latest",
  },
  story: {
    readingTime: "{minutes} min read",
    breaking: "Breaking",
  },
  common: {
    more: "See more",
    // Accessible name of a "more" link: the visible text, then the section name.
    moreAbout: "See more: {section}",
  },
  ads: {
    label: "Advertisement",
    placeholder: "Ad space",
  },
  // Working labels until the IA label table exists (IA-06, U-01).
  categories: {
    bangladesh: "Bangladesh",
    geopolitics: "Geopolitics and Diplomacy",
    security: "Security and Conflict",
    history: "History and Context",
    economy: "Economy and Trade",
    technology: "Technology and Strategic Power",
  },
  // Entries under Regions. Working labels until the IA table exists (U-01).
  regions: {
    title: "Regions",
    china: "China",
    india: "India",
    myanmar: "Myanmar",
    "middle-east": "Middle East",
    "southeast-asia": "Southeast Asia",
    europe: "Europe",
    africa: "Africa",
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
  // Temporary page for FL-03. Remove with the page in FL-13.
  layoutParts: {
    title: "Layout parts",
    note: "Temporary page for checking the shell, wrapper, rail, peer row and ad rows. Make the window narrow and wide.",
    withRailTitle: "Section with a rail",
    noRailTitle: "Section without a rail",
    wrapper: "Wrapper: takes the width that the rail leaves.",
    rail: "Rail: 304px wide from 1024px, beside the wrapper. Below 1024px it goes under the wrapper.",
    wrapperFull:
      "Wrapper: this section has no rail, so the wrapper spans the shell.",
    cardEyebrow: "Sample",
    cardTitleShort: "A peer row card",
    cardTitleLong:
      "A long sample headline: the parts of the card beside it stay on the same rows through subgrid, however long the title is",
    cardSummary:
      "This card has a summary. The card beside it has none, so that row stays empty there.",
    cardMeta: "Temporary sample",
  },
};
