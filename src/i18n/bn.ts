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
    // On the category page, after the switch from an article that has no Bangla text (DR-401).
    onlyInOther: "এই খবরটি শুধু ইংরেজিতে আছে।",
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
    title: "শীর্ষ খবর",
    latest: "সর্বশেষ",
  },
  // The category page (spacing-layout-system.md 7B).
  categoryPage: {
    // Visually hidden name of CategoryFeatureSection.
    feature: "প্রধান খবর",
    latest: "সর্বশেষ",
    // Older stories under the most read section, 10 at a time.
    moreStories: "আরও পড়ুন",
    loadMore: "আরও লোড করুন",
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
  // Bangladesh is not a category (DR-412).
  categories: {
    geopolitics: "ভূরাজনীতি ও কূটনীতি",
    security: "নিরাপত্তা ও সংঘাত",
    history: "ইতিহাস ও প্রেক্ষাপট",
    economy: "অর্থনীতি ও বাণিজ্য",
    technology: "প্রযুক্তি ও কৌশলগত শক্তি",
  },
  // P-3b heading (component-system.md Section 3.3, DR-345). Its own string, apart from the
  // nav item and from the region table.
  regionsSection: {
    title: "অঞ্চলসমূহ",
  },
  // Entries under অঞ্চলসমূহ, in the order of the working list (layout 7C, DR-411).
  // Labels approved by tajmin, 28 Oct 2026. Working English labels until IA-06 (U-01).
  regions: {
    americas: "আমেরিকা",
    europe: "ইউরোপ",
    russia: "রাশিয়া",
    "middle-east": "মধ্যপ্রাচ্য",
    "south-asia": "দক্ষিণ এশিয়া",
    china: "চীন",
    asia: "এশিয়া",
    oceania: "ওশেনিয়া",
  },
  // The article page (wild card reader).
  reader: {
    home: "প্রথম পাতা",
    by: "লিখেছেন",
    published: "প্রকাশ",
    updated: "আপডেট",
    readTime: "পড়তে {n} মিনিট",
    minutesLeft: "আর {n} মিনিট",
    percentRead: "{p} পড়া হয়েছে",
    readingTimeLabel: "পড়ার সময়",
    finished: "পড়া শেষ",
    keyPoints: "সংক্ষেপে",
    keyPointsNote: "আধা মিনিটে খবরটি",
    context: "প্রেক্ষাপট",
    tabWhy: "কেন জরুরি",
    tabBackground: "পটভূমি",
    contents: "এই লেখায়",
    share: "শেয়ার",
    close: "বন্ধ করুন",
    copy: "কপি",
    copied: "কপি হয়েছে",
    reading: "পড়া",
    readingTools: "পড়ার সরঞ্জাম",
    shareStory: "খবরটি শেয়ার করুন",
    shareOn: "{network}-এ শেয়ার করুন",
    shareMore: "অন্য অ্যাপে শেয়ার",
    email: "ইমেইল",
    copyLink: "লিংক কপি করুন",
    linkCopied: "লিংক কপি হয়েছে",
    copyFailed: "লিংক কপি করা যায়নি",
    sectionLink: "এই অংশের লিংক কপি করুন",
    copyQuote: "উদ্ধৃতি কপি",
    quoteCopied: "উদ্ধৃতি কপি হয়েছে",
    quoteShare: "বেছে নেওয়া অংশ শেয়ার করুন",
    save: "পরে পড়ুন",
    savedToast: "পরে পড়ার তালিকায় রাখা হয়েছে",
    removedToast: "তালিকা থেকে সরানো হয়েছে",
    textSize: "লেখার আকার",
    textSizes: "সাধারণ,বড়,খুব বড়",
    textSizeGlyphs: "অ,অ+,অ++",
    backToTop: "শুরুতে ফিরুন",
    googleShort: "গুগলে যোগ করুন",
    googleCardTitle: "গুগলে ফ্যাক্ট লেন্সকে আপনার পছন্দের উৎস করুন",
    googleCardText:
      "সার্চের শীর্ষ খবরে আমাদের প্রতিবেদন আরও বেশি দেখবেন। এক ক্লিকে যোগ করা যায়, যেকোনো সময় সরানো যায়।",
    topics: "বিষয়",
    readNext: "আরও পড়ুন",
    networks: {
      whatsapp: "হোয়াটসঅ্যাপ",
      facebook: "ফেসবুক",
      x: "এক্স",
      linkedin: "লিংকডইন",
      telegram: "টেলিগ্রাম",
    },
  },
};
