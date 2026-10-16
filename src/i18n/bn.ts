// Bangla interface strings. en.ts has the same keys (T-27).
export const bn = {
  site: {
    name: "ফ্যাক্ট লেন্স",
    description: "বাংলাদেশ ও বিশ্বের খবর, বিশ্লেষণ ও মতামত",
  },
  language: {
    // The switch names the other language in that language (DR-78).
    other: "English",
    // The phone top bar has less room (spacing-layout-system.md Section 6).
    otherShort: "En",
  },
  theme: {
    // The name of the switch; it is on when the theme is dark (DR-167).
    dark: "ডার্ক থিম",
  },
  header: {
    menu: "মেনু",
    closeMenu: "মেনু বন্ধ করুন",
    drawerNav: "সব বিভাগ",
    mainNav: "প্রধান বিভাগ",
    home: "ফ্যাক্ট লেন্স, প্রথম পাতা",
    search: "অনুসন্ধান",
    searchField: "কী খুঁজছেন?",
    searchPlaceholder: "খুঁজুন",
    searchSubmit: "খুঁজুন",
    clear: "মুছুন",
    trending: "ট্রেন্ডিং",
    closeSearch: "অনুসন্ধান বন্ধ করুন",
    // Mock search (DR-01): the prototype has no results page.
    searchUnavailable: "এই প্রোটোটাইপে অনুসন্ধানের ফল দেখানো হয় না।",
    // SkipLink (C-17, DR-269).
    skipLink: "মূল খবরে যান",
    navHome: "হোম",
    // The NavBar and Drawer item over the regions (component-system.md Section 3.3, DR-345).
    navRegions: "অঞ্চলসমূহ",
    // The name of the caret button that opens the sub-items of a drawer row.
    expand: "উপবিভাগ",
  },
  home: {
    // Visually hidden: the page heading for screen readers.
    title: "ফ্যাক্ট লেন্স: প্রথম পাতা",
  },
  hero: {
    // Visually hidden name of the P-1 section.
    title: "প্রধান খবর",
    latest: "সর্বশেষ",
  },
  analysisOpinion: {
    // The section name follows the column order: analysis, then opinion (7.4).
    title: "বিশ্লেষণ ও মতামত",
    analysis: "বিশ্লেষণ",
    opinion: "মতামত",
  },
  // P-5.
  mostRead: {
    title: "সর্বাধিক পঠিত",
  },
  // P-3b slider buttons (spacing-layout-system.md 7.4). Not under regions: the nav
  // lists every key of regions as a region.
  regionSlider: {
    previous: "আগের অঞ্চল",
    next: "পরের অঞ্চল",
  },
  story: {
    // {minutes} is already in Bangla digits.
    readingTime: "পড়তে {minutes} মিনিট",
    justNow: "এইমাত্র",
    hourAgo: "{hours} ঘণ্টা আগে",
    hoursAgo: "{hours} ঘণ্টা আগে",
  },
  common: {
    more: "আরও দেখুন",
    // Accessible name of a "more" link: the visible text, then the section name.
    moreAbout: "আরও দেখুন: {section}",
  },
  // P-3 rail. Mock only (DR-01): the poll keeps no server count.
  poll: {
    title: "আজকের জরিপ",
    vote: "ভোট দিন",
    yourVote: "আপনার ভোট",
    total: "{count} জন ভোট দিয়েছেন",
  },
  ads: {
    label: "বিজ্ঞাপন",
  },
  // The minimum footer (spacing-layout-system.md 7.4, DR-59). Working labels (U-30).
  footer: {
    label: "ফুটার",
    siteNav: "সাইটের তথ্য",
    social: "সামাজিক মাধ্যমে ফ্যাক্ট লেন্স",
    about: "আমাদের সম্পর্কে",
    contact: "যোগাযোগ",
    corrections: "সংশোধনী",
    privacy: "গোপনীয়তা নীতি",
    terms: "শর্তাবলি",
    copyright: "© {year} {name}। সর্বস্বত্ব সংরক্ষিত।",
    // The text name of each icon link, for screen readers.
    facebook: "ফেসবুক",
    youtube: "ইউটিউব",
    x: "এক্স",
    instagram: "ইনস্টাগ্রাম",
    linkedin: "লিংকডইন",
  },
  // Category labels (mock-content skill). চীন is a region, not a category (DR-19).
  categories: {
    bangladesh: "বাংলাদেশ",
    geopolitics: "ভূরাজনীতি ও কূটনীতি",
    security: "নিরাপত্তা ও সংঘাত",
    history: "ইতিহাস ও প্রেক্ষাপট",
    economy: "অর্থনীতি ও বাণিজ্য",
    technology: "প্রযুক্তি ও কৌশলগত শক্তি",
  },
  // Entries under অঞ্চল. Working labels until the IA table exists (U-01).
  regions: {
    title: "অঞ্চল",
    china: "চীন",
    india: "ভারত",
    myanmar: "মিয়ানমার",
    "middle-east": "মধ্যপ্রাচ্য",
    "southeast-asia": "দক্ষিণ-পূর্ব এশিয়া",
    europe: "ইউরোপ",
    africa: "আফ্রিকা",
  },
};
