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
    otherShort: "বাংলা",
    // On the category page, after the switch from an article that has no English text (DR-401).
    onlyInOther: "This story is in Bangla only.",
  },
  theme: {
    // The name of the switch; it is on when the theme is dark (DR-167).
    dark: "Dark theme",
  },
  header: {
    menu: "Menu",
    closeMenu: "Close menu",
    drawerNav: "All sections",
    mainNav: "Main sections",
    home: "Fact Lens, front page",
    search: "Search",
    searchField: "What are you looking for?",
    searchPlaceholder: "Search",
    searchSubmit: "Search",
    clear: "Clear",
    trending: "Trending",
    closeSearch: "Close search",
    // Mock search (DR-01): the prototype has no results page.
    searchUnavailable: "This prototype does not show search results.",
    // SkipLink (C-17, DR-269).
    skipLink: "Skip to main content",
    navHome: "Home",
    // The NavBar and Drawer item over the regions (component-system.md Section 3.3, DR-345).
    navRegions: "Regions",
    // The name of the caret button that opens the sub-items of a drawer row.
    expand: "sub-sections",
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
  // The category page (spacing-layout-system.md 7B).
  categoryPage: {
    // Visually hidden name of CategoryCoverSection.
    cover: "Top story",
    latest: "Latest",
    // Older stories under the most read section, 10 at a time.
    moreStories: "More stories",
    loadMore: "Load more",
  },
  analysisOpinion: {
    // The section name follows the column order: analysis, then opinion (7.4).
    title: "Analysis and Opinion",
    analysis: "Analysis",
    opinion: "Opinion",
  },
  // The analysis hub /analysis (layout 7C.2, Analysis hub row). The title is analysisOpinion.analysis.
  analysisPage: {
    // Visually hidden name of the mosaic.
    top: "Top analysis",
    // Visually hidden name of the cover (AnalysisCoverSection).
    cover: "Lead analysis",
    // The short line below the page title (tajmin, 3 Nov 2026).
    description:
      "In-depth analysis, explanatory journalism and long-form narratives by Fact Lens Team",
  },
  // P-5 Most read (spacing-layout-system.md 7.2).
  mostRead: {
    title: "Most read",
  },
  // P-3b slider buttons (spacing-layout-system.md 7.4). Not under regions: the nav
  // lists every key of regions as a region.
  regionSlider: {
    previous: "Previous region",
    next: "Next region",
  },
  story: {
    readingTime: "{minutes} min read",
    justNow: "Just in",
    hourAgo: "{hours} hour ago",
    hoursAgo: "{hours} hours ago",
  },
  common: {
    more: "See more",
    // Accessible name of a "more" link: the visible text, then the section name.
    moreAbout: "See more: {section}",
  },
  // P-3 rail. Mock only (DR-01): the poll keeps no server count.
  poll: {
    title: "Daily poll",
    vote: "Vote",
    yourVote: "Your vote",
    total: "{count} votes",
  },
  ads: {
    label: "Advertisement",
  },
  // The minimum footer (spacing-layout-system.md 7.4, DR-59). Working labels (U-30).
  footer: {
    label: "Footer",
    siteNav: "About the site",
    social: "Fact Lens on social media",
    about: "About",
    contact: "Contact",
    corrections: "Corrections",
    privacy: "Privacy",
    terms: "Terms",
    copyright: "© {year} {name}. All rights reserved.",
    // The text name of each icon link, for screen readers.
    facebook: "Facebook",
    youtube: "YouTube",
    x: "X",
    instagram: "Instagram",
    linkedin: "LinkedIn",
  },
  // Working labels until the IA label table exists (IA-06, U-01).
  // Bangladesh is not a category (DR-412).
  categories: {
    geopolitics: "Geopolitics and Diplomacy",
    security: "Security and Conflict",
    history: "History and Context",
    economy: "Economy and Trade",
    technology: "Technology and Strategic Power",
  },
  // P-3b heading (component-system.md Section 3.3, DR-345). Its own string, apart from the
  // nav item and from the region table.
  regionsSection: {
    title: "Regions",
  },
  // Entries under Regions, in the order of the working list (layout 7C, DR-411).
  // Labels approved by tajmin, 28 Oct 2026. Working labels until IA-06 (U-01).
  regions: {
    americas: "Americas",
    europe: "Europe",
    russia: "Russia",
    "middle-east": "Middle East",
    "south-asia": "South Asia",
    china: "China",
    asia: "Asia",
    oceania: "Oceania",
  },
  // The article page (wild card reader).
  reader: {
    home: "Front page",
    by: "By",
    published: "Published",
    updated: "Updated",
    readTime: "{n} min read",
    minutesLeft: "{n} min left",
    percentRead: "{p} read",
    readingTimeLabel: "Reading time",
    finished: "Finished",
    keyPoints: "The short version",
    keyPointsNote: "The story in 30 seconds",
    context: "Context",
    tabWhy: "Why it matters",
    tabBackground: "Background",
    contents: "In this story",
    share: "Share",
    close: "Close",
    copy: "Copy",
    copied: "Copied",
    reading: "Reading",
    readingTools: "Reading tools",
    shareStory: "Share this story",
    shareOn: "Share on {network}",
    shareMore: "Share with another app",
    email: "Email",
    copyLink: "Copy link",
    linkCopied: "Link copied",
    copyFailed: "The link could not be copied",
    sectionLink: "Copy a link to this section",
    copyQuote: "Copy quote",
    quoteCopied: "Quote copied",
    quoteShare: "Share the selected text",
    save: "Save for later",
    savedToast: "Saved to read later",
    removedToast: "Removed from your list",
    textSize: "Text size",
    textSizes: "Default,Large,Extra large",
    textSizeGlyphs: "A,A+,A++",
    backToTop: "Back to the top",
    googleShort: "Add on Google",
    googleCardTitle: "Make Fact Lens a preferred source on Google",
    googleCardText:
      "See more of our reporting in Top Stories when you search. It takes one click, and you can remove it at any time.",
    topics: "Topics",
    readNext: "More stories",
    networks: {
      whatsapp: "WhatsApp",
      facebook: "Facebook",
      x: "X",
      linkedin: "LinkedIn",
      telegram: "Telegram",
    },
  },
};
