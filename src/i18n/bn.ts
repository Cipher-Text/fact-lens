// Bangla interface strings. en.ts has the same keys (T-27).
export const bn = {
  site: {
    name: "ফ্যাক্ট লেন্স",
    description: "বাংলাদেশ ও বিশ্বের খবর, বিশ্লেষণ ও মতামত",
  },
  language: {
    // The switch names the other language in that language (DR-78).
    other: "English",
  },
  theme: {
    label: "থিম",
    optionSystem: "সিস্টেম",
    optionLight: "লাইট",
    optionDark: "ডার্ক",
  },
  header: {
    menu: "মেনু",
    closeMenu: "মেনু বন্ধ করুন",
    drawerNav: "সব বিভাগ",
    mainNav: "প্রধান বিভাগ",
    home: "ফ্যাক্ট লেন্স, প্রথম পাতা",
    search: "অনুসন্ধান",
    searchField: "কী খুঁজছেন?",
    searchSubmit: "খুঁজুন",
    closeSearch: "অনুসন্ধান বন্ধ করুন",
    // Mock search (DR-01): the prototype has no results page.
    searchUnavailable: "এই প্রোটোটাইপে অনুসন্ধানের ফল দেখানো হয় না।",
    subscribe: "সাবস্ক্রাইব",
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
  story: {
    // {minutes} is already in Bangla digits.
    readingTime: "পড়তে {minutes} মিনিট",
    breaking: "সদ্যপ্রাপ্ত",
  },
  common: {
    more: "আরও দেখুন",
    // Accessible name of a "more" link: the visible text, then the section name.
    moreAbout: "আরও দেখুন: {section}",
  },
  ads: {
    label: "বিজ্ঞাপন",
    placeholder: "বিজ্ঞাপনের জায়গা",
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
  // Temporary page for FL-02. Remove with the page in FL-13.
  foundations: {
    title: "ডিজাইন ভিত্তি",
    note: "অস্থায়ী পাতা। রঙ ও টাইপ রোল যাচাইয়ের জন্য।",
    colorsTitle: "রঙ",
    typeTitle: "টাইপ রোল",
    formatTitle: "সংখ্যা ও তারিখ",
    bangla: "বাংলা",
    english: "ইংরেজি",
    selectionHint:
      "লেখা নির্বাচনের রঙ দেখতে এই বাক্যের কিছু অংশ নির্বাচন করুন।",
    groups: {
      surfaces: "সারফেস",
      ink: "লেখার রঙ",
      brand: "ব্র্যান্ড ও ইন্টারঅ্যাকটিভ",
      accent: "অ্যাকসেন্ট",
      borders: "বর্ডার",
      status: "স্ট্যাটাস",
      utility: "ইউটিলিটি",
    },
  },
  // Temporary page for FL-03. Remove with the page in FL-13.
  layoutParts: {
    title: "লেআউট অংশ",
    note: "অস্থায়ী পাতা। শেল, র‍্যাপার, রেল, পিয়ার সারি ও বিজ্ঞাপনের সারি যাচাইয়ের জন্য। জানালা সরু ও চওড়া করে দেখুন।",
    withRailTitle: "রেলসহ সেকশন",
    noRailTitle: "রেল ছাড়া সেকশন",
    wrapper: "র‍্যাপার: রেলের পরে বাকি প্রস্থ জুড়ে থাকে।",
    rail: "রেল: ১০২৪ পিক্সেল থেকে ৩০৪ পিক্সেল চওড়া, র‍্যাপারের পাশে। এর কম চওড়া পর্দায় র‍্যাপারের নিচে।",
    wrapperFull:
      "র‍্যাপার: এই সেকশনে রেল নেই, তাই র‍্যাপার পুরো শেল জুড়ে থাকে।",
    cardEyebrow: "নমুনা",
    cardTitleShort: "পিয়ার সারির কার্ড",
    cardTitleLong:
      "দীর্ঘ শিরোনামের নমুনা: পাশের কার্ডের অংশগুলো সাবগ্রিড দিয়ে একই সারিতে থাকে, শিরোনাম যত লম্বাই হোক",
    cardSummary:
      "এই কার্ডে সারসংক্ষেপ আছে। পাশের কার্ডে নেই, তাই সেখানে এই সারি খালি থাকে।",
    cardMeta: "অস্থায়ী নমুনা",
  },
};
