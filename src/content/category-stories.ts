// Extra mock stories for the category pages (spacing-layout-system.md 7B). Fictional: no real
// people, no quotes, no real events. No fact-check content (DR-18).
import type { StoryDef } from "./stories";

/** Time in Dhaka: at("10-07 08:30") is 7 October 2026, 08:30 +06:00. */
function at(monthDayTime: string): string {
  const [monthDay, time] = monthDayTime.split(" ");
  return `2026-${monthDay}T${time}:00+06:00`;
}

export const categoryStories: StoryDef[] = [
  // Economy, South Asia (2 stories; were Bangladesh, DR-412)
  {
    id: "imjuj6m",
    slug: "textile-export-standards",
    format: "news",
    category: "economy",
    regions: ["south-asia", "europe"],
    publishedAt: at("10-04 10:15"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title:
        "পোশাক রপ্তানিতে নতুন মান নির্ধারণ, আন্তর্জাতিক সার্টিফিকেশন বাধ্যতামূলক",
      summary:
        "শিল্প মন্ত্রণালয় জানিয়েছে, আগামী ছয় মাসে সব কারখানাকে টেকসই উৎপাদন সার্টিফিকেট নিতে হবে।",
      imageAlt: "পোশাক কারখানায় গুণমান পরীক্ষা করছেন একজন নিরীক্ষক",
    },
    en: {
      title:
        "New standards for apparel exports, international certification now mandatory",
      summary:
        "The textile ministry says all factories must obtain sustainable production certificates within six months.",
      imageAlt: "An inspector checking quality at a garment factory",
    },
  },
  {
    id: "nwcar7q",
    slug: "port-automation-plan",
    format: "news",
    category: "economy",
    regions: ["south-asia"],
    publishedAt: at("09-26 13:45"),
    readingMinutes: 4,
    image: "wide",
    bn: {
      title:
        "চট্টগ্রাম বন্দরে যানবাহন চলাচলের সম্পূর্ণ স্বয়ংক্রিয় ব্যবস্থা, বাস্তবায়ন শুরু হবে বছরের শেষে",
      summary:
        "এই প্রযুক্তি বাস্তবায়নে প্রাথমিক বিনিয়োগ দুই শত কোটি টাকা প্রয়োজন হবে।",
      imageAlt: "বন্দরের যানবাহন পরিবহন ব্যবস্থার একটি দৃশ্য",
    },
    en: {
      title:
        "Chattogram port gets fully automated vehicle traffic control, implementation starts year-end",
      summary:
        "The technology will require an initial investment of 200 crore taka.",
      imageAlt: "A view of vehicle transportation systems at the port",
    },
  },

  // Geopolitics (8 stories)
  {
    id: "w9tuoqn",
    slug: "regional-security-pact",
    format: "news",
    category: "geopolitics",
    regions: ["south-asia"],
    publishedAt: at("10-05 09:30"),
    readingMinutes: 5,
    image: "photo",
    bn: {
      title:
        "দক্ষিণ এশিয়ার পাঁচ দেশ নতুন সামরিক সহযোগিতা চুক্তিতে স্বাক্ষর করতে প্রস্তুত",
      summary:
        "সমুদ্রসীমান্তে নিরাপত্তা এবং সন্ত্রাস বিরোধী কার্যক্রমে সমন্বয় থাকবে চুক্তির মূল বিষয়।",
      imageAlt: "আঞ্চলিক প্রতিরক্ষা ফোরামে সামরিক কর্মকর্তারা",
    },
    en: {
      title:
        "Five South Asian nations ready to sign new military cooperation pact",
      summary:
        "Maritime security and counter-terrorism coordination will be key aspects of the agreement.",
      imageAlt: "Military officials at a regional defence forum",
    },
  },
  {
    id: "ahwmixf",
    slug: "south-asian-connectivity-corridor",
    format: "analysis",
    category: "geopolitics",
    regions: ["south-asia"],
    publishedAt: at("10-01 15:00"),
    readingMinutes: 7,
    author: "tanvir-ahmed",
    bn: {
      title:
        "দক্ষিণ এশিয়ার যোগাযোগ সিঁড়ি: রাস্তা, রেল ও জলপথের নতুন নেটওয়ার্ক পরিকল্পনা",
    },
    en: {
      title:
        "South Asian connectivity corridor: new network plans for roads, rail and waterways",
    },
  },
  {
    id: "0mjcddr",
    slug: "maritime-boundary-agreement",
    format: "news",
    category: "geopolitics",
    regions: ["south-asia"],
    publishedAt: at("09-29 11:15"),
    readingMinutes: 4,
    bn: {
      title:
        "দুই প্রতিবেশী রাষ্ট্রের মধ্যে সামুদ্রিক সীমানা চূড়ান্তকরণে নতুন আলোচনা দফা",
      summary:
        "জাতিসংঘ সমর্থিত মধ্যস্থতাকারী উভয় পক্ষকে পরবর্তী বৈঠকের জন্য ডেকেছেন।",
      imageAlt: "সমুদ্রে সীমানা নির্ধারণের মানচিত্র",
    },
    en: {
      title:
        "New round of talks to finalize maritime boundary between two neighbours",
      summary: "UN-backed mediator has called both sides to the next meeting.",
      imageAlt: "A map showing maritime boundary demarcation",
    },
  },
  {
    id: "lof16o4",
    slug: "transit-facility-expansion",
    format: "news",
    category: "geopolitics",
    regions: ["south-asia"],
    publishedAt: at("09-27 13:00"),
    readingMinutes: 3,
    image: "classic",
    bn: {
      title:
        "আঞ্চলিক পণ্য পরিবহনে ট্রানজিট সুবিধা সম্প্রসারণের চুক্তি স্বাক্ষর হচ্ছে",
      imageAlt: "সীমান্তে পণ্য পরিবহনের জন্য অপেক্ষা করছে একটি ট্রাক",
    },
    en: {
      title:
        "Treaty signed to expand transit facilities for regional goods movement",
      imageAlt: "A truck waiting for goods clearance at a border",
    },
  },
  {
    id: "e8fkixb",
    slug: "cross-border-water-project",
    format: "news",
    category: "geopolitics",
    regions: ["south-asia"],
    publishedAt: at("09-25 10:30"),
    readingMinutes: 4,
    image: "wide",
    bn: {
      title:
        "আন্তঃসীমান্ত নদী প্রকল্পে নতুন পরিবেশগত মূল্যায়ন সমাপ্ত, সম্ভাব্যতা প্রতিবেদন মঞ্জুর হয়েছে",
      summary:
        "যৌথ জল ব্যবস্থাপনা কমিটি আগামী মাসে বিস্তারিত ডিজাইন নিয়ে বিচার করবে।",
      imageAlt: "আন্তঃসীমান্ত নদীর প্রবাহ পরিমাপ স্টেশন",
    },
    en: {
      title:
        "Environmental impact assessment for cross-border river project completed, feasibility approved",
      summary:
        "Joint water management committee to review detailed design next month.",
      imageAlt: "A trans-border river flow measurement station",
    },
  },
  {
    id: "7brkzd2",
    slug: "diplomatic-mission-opening",
    format: "news",
    category: "geopolitics",
    regions: ["south-asia"],
    publishedAt: at("09-23 08:45"),
    readingMinutes: 2,
    bn: {
      title:
        "পূর্ব আফ্রিকার শক্তিশালী অর্থনীতিতে নতুন রাষ্ট্রদূত নিয়োগ পাচ্ছেন তিনজন বিশ্বাসপ্রাপ্ত কর্মকর্তা",
    },
    en: {
      title: "Three senior diplomats posted to new missions in East Africa",
    },
  },
  {
    id: "p9qsxko",
    slug: "multilateral-trade-framework",
    format: "news",
    category: "geopolitics",
    regions: ["south-asia"],
    publishedAt: at("09-21 14:00"),
    readingMinutes: 3,
    bn: {
      title:
        "বহুজাতিক বাণিজ্য কাঠামোতে নতুন সদস্য যোগদান, প্রথম বৈঠক অনুষ্ঠিত হবে ঢাকায়",
    },
    en: {
      title:
        "New members join multilateral trade framework, first meeting to be held in Dhaka",
    },
  },
  {
    id: "tzsd3ir",
    slug: "cultural-exchange-programme",
    format: "news",
    category: "geopolitics",
    regions: ["south-asia"],
    publishedAt: at("09-19 12:15"),
    readingMinutes: 3,
    image: "photo",
    bn: {
      title:
        "দুই প্রতিবেশীর মধ্যে সাংস্কৃতিক বিনিময় কর্মসূচি চিহ্নিত, শিল্প ও সাহিত্যে মনোযোগ থাকবে",
      imageAlt: "সাংস্কৃতিক অনুষ্ঠানে পরিবেশনা দিচ্ছেন শিল্পীরা",
    },
    en: {
      title:
        "Cultural exchange programme identified between two neighbours, focus on arts and literature",
      imageAlt: "Artists performing at a cultural event",
    },
  },

  // History (11 stories)
  {
    id: "gxfhq1q",
    slug: "ancient-port-cities",
    format: "news",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("10-02 09:20"),
    readingMinutes: 5,
    image: "classic",
    bn: {
      title:
        "প্রাচীন বঙ্গ রাজ্যের বন্দর শহরগুলির ধ্বংসাবশেষ আবিষ্কার, নতুন প্রত্নতাত্ত্বিক অনুসন্ধান শুরু হয়েছে",
      summary:
        "অনুসন্ধান দলটি পরবর্তী তিন মাসে দশটি নতুন স্থান খনন করার পরিকল্পনা করছে।",
      imageAlt: "প্রাচীন বন্দর শহরের খনন প্রাঙ্গণ",
    },
    en: {
      title:
        "Ruins of ancient Bengal port cities discovered, new archaeological survey underway",
      summary:
        "The team plans to excavate ten new sites over the next three months.",
      imageAlt: "An ancient port city excavation site",
    },
  },
  {
    id: "kcdl3n7",
    slug: "medieval-manuscripts-found",
    format: "news",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-30 16:45"),
    readingMinutes: 4,
    bn: {
      title:
        "মধ্যযুগীয় বাংলা সাহিত্যের হাতে লেখা পাণ্ডুলিপি একটি মসজিদের লাইব্রেরিতে খুঁজে পাওয়া গেছে",
      imageAlt: "সংরক্ষণ কেন্দ্রে পরীক্ষা করা হচ্ছে একটি পুরাতন পাণ্ডুলিপি",
    },
    en: {
      title:
        "Rare medieval Bengali literary manuscripts discovered in a mosque library",
      imageAlt: "An ancient manuscript being examined at a conservation centre",
    },
  },
  {
    id: "d1ko077",
    slug: "colonial-era-records",
    format: "analysis",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-28 14:30"),
    readingMinutes: 6,
    author: "rashed-hossain",
    bn: {
      title: "ব্রিটিশ আধিপত্যের আর্কাইভ: বঙ্গের শাসন-প্রতিবেদনে কী লুকিয়ে আছে",
    },
    en: {
      title:
        "The British colonial archive: what lies hidden in Bengal's administrative records",
    },
  },
  {
    id: "1txb5km",
    slug: "independence-struggle-archive",
    format: "news",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-26 11:00"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title:
        "স্বাধীনতা সংগ্রামের অতিরিক্ত দলিল সংগ্রহে জাতীয় সংরক্ষণ কেন্দ্র, প্রকাশনা শুরু হবে পরের বছর",
      summary:
        "এ পর্যন্ত হাজারেরও বেশি অপ্রকাশিত সাক্ষাৎকার ও চিঠিপত্র আসছে প্রতিদিন।",
      imageAlt: "স্বাধীনতা সংগ্রাম যুগের একটি ঐতিহাসিক দলিল",
    },
    en: {
      title:
        "National Archive Centre collects additional independence struggle documents, publication begins next year",
      summary:
        "More than a thousand unpublished interviews and letters are arriving daily.",
      imageAlt: "A historical document from the independence struggle era",
    },
  },
  {
    id: "2bwip09",
    slug: "folklore-preservation-project",
    format: "news",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-24 13:15"),
    readingMinutes: 3,
    bn: {
      title:
        "প্রত্যন্ত গ্রামের লোককথা ও ঐতিহ্য সংরক্ষণ প্রকল্পে রেকর্ডিং সম্পন্ন, অনলাইন ডাটাবেস তৈরি হচ্ছে",
    },
    en: {
      title:
        "Remote village folklore preservation project completes recording, online database being created",
    },
  },
  {
    id: "g7mr352",
    slug: "historical-site-excavation",
    format: "news",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-22 10:30"),
    readingMinutes: 4,
    image: "wide",
    bn: {
      title:
        "প্রাচীন বৌদ্ধ বিহারের নতুন খনিজ সন্ধান, নব-নির্মিত সড়কের নিচে ছিল হাজার বছর পুরাতন নিদর্শন",
      summary:
        "বিশেষজ্ঞরা বলছেন এটি অষ্টম শতাব্দীর মিহিরকুল সাম্রাজ্যের বিহার হতে পারে।",
      imageAlt: "প্রাচীন বিহার খনন স্থল থেকে বের হওয়া মূর্তিফলক",
    },
    en: {
      title:
        "Ancient Buddhist monastery discovered, thousand-year-old remains unearthed beneath new road",
      summary:
        "Experts say it may be a monastery from the eighth-century Mihirakula reign.",
      imageAlt: "Statuary remains excavated from an ancient monastery site",
    },
  },
  {
    id: "94su5kv",
    slug: "biography-research-initiative",
    format: "news",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-20 15:45"),
    readingMinutes: 3,
    image: "classic",
    bn: {
      title:
        "অখ্যাত নারী নেতাদের জীবনী গবেষণা প্রকল্প, পঞ্চাশজন নারীর গল্প সংগ্রহ করা হচ্ছে",
      imageAlt: "ঐতিহাসিক নারী নেতার একটি পুরাতন ফটোগ্রাফ",
    },
    en: {
      title:
        "Biography research project on forgotten women leaders, stories of fifty women being collected",
      imageAlt: "An archival photograph of a historical women leader",
    },
  },
  {
    id: "dqdemdb",
    slug: "ancient-civilization-study",
    format: "analysis",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-23 12:00"),
    readingMinutes: 5,
    author: "sumaiya-islam",
    bn: {
      title:
        "গঙ্গাবদ্ধ অঞ্চলের প্রাচীন সভ্যতা: কৃষি ব্যবস্থা থেকে নগর পরিকল্পনা পর্যন্ত দক্ষতার চিহ্ন",
    },
    en: {
      title:
        "Ancient civilization of the Ganges delta: evidence of sophistication from agriculture to urban planning",
    },
  },
  {
    id: "c2gjeir",
    slug: "war-memorials-restoration",
    format: "news",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-21 09:30"),
    readingMinutes: 3,
    bn: {
      title:
        "মুক্তিযুদ্ধকালীন স্মৃতিস্তম্ভ সংরক্ষণে নতুন বাজেট বরাদ্দ, পঞ্চাশটি স্থান চিহ্নিত হয়েছে প্রথম পর্যায়ে",
    },
    en: {
      title:
        "New budget for restoring war memorials, fifty sites identified in first phase",
    },
  },
  {
    id: "7xinn8p",
    slug: "religious-heritage-documentation",
    format: "news",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-19 14:00"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title:
        "প্রাচীন ধর্মীয় স্থাপত্য ও নিদর্শনের ডিজিটাল নথিকরণ প্রকল্প, তিন বছরে দুই হাজার স্থান রেকর্ড করা হবে",
      summary: "পুরোহিত ও ধর্মীয় নেতারা এই প্রকল্পে সক্রিয়ভাবে অংশ নিচ্ছেন।",
      imageAlt: "প্রাচীন মন্দিরের ডিজিটাল নথিকরণ দৃশ্য",
    },
    en: {
      title:
        "Digital documentation project for ancient religious structures, 2,000 sites to be recorded in three years",
      summary:
        "Religious leaders and priests are actively participating in the project.",
      imageAlt: "Digital documentation of an ancient temple",
    },
  },
  {
    id: "x3fwkkv",
    slug: "royal-family-genealogy",
    format: "news",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-18 11:15"),
    readingMinutes: 3,
    bn: {
      title:
        "প্রাচীন বাংলা রাজবংশের বংশতালিকা সংকলনে পঞ্চাশ বছরের গবেষণা সমাপ্ত, প্রকাশনা হবে ছয় খণ্ডে যা সম্ভবত একটি গুরুত্বপূর্ণ সংযোজন হবে দেশীয় ঐতিহ্যবোধে এবং শিক্ষা ব্যবস্থায়",
    },
    en: {
      title:
        "Fifty years of research on ancient Bengali royal genealogy completed, publication in six volumes",
    },
  },

  // Security (8 stories)
  {
    id: "qi3s5k2",
    slug: "maritime-piracy-operations",
    format: "news",
    category: "security",
    regions: ["south-asia"],
    publishedAt: at("10-04 07:15"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title:
        "বঙ্গোপসাগরে সংগঠিত জলদস্যুতা কমাতে নতুন আন্তর্জাতিক অভিযান পরিচালনা শুরু হয়েছে",
      summary: "তিনটি দেশের নৌবাহিনী যৌথভাবে ২৪ ঘণ্টা টহল কাজ শুরু করেছে।",
      imageAlt: "বঙ্গোপসাগরে টহল দিচ্ছে একটি নৌপুলিশ নৌযান",
    },
    en: {
      title:
        "New international operation launched to reduce organized piracy in the Bay of Bengal",
      summary:
        "Three nations' navies have begun round-the-clock joint patrols.",
      imageAlt: "A coast guard patrol vessel on the Bay of Bengal",
    },
  },
  {
    id: "68z8mjr",
    slug: "border-fence-upgrade",
    format: "news",
    category: "security",
    regions: ["south-asia"],
    publishedAt: at("10-02 13:00"),
    readingMinutes: 3,
    bn: {
      title:
        "সীমান্ত বেড়া আপগ্রেড প্রকল্পে আধুনিক সেন্সর প্রযুক্তি যুক্ত, সম্পূর্ণ হবে দুই বছরে",
    },
    en: {
      title:
        "Border fence upgrade to include modern sensor technology, will be complete in two years",
    },
  },
  {
    id: "ww9i2b9",
    slug: "intelligence-agency-cooperation",
    format: "news",
    category: "security",
    regions: ["south-asia"],
    publishedAt: at("09-29 09:45"),
    readingMinutes: 3,
    image: "classic",
    bn: {
      title:
        "পাঁচ দেশের গোয়েন্দা সংস্থা সন্ত্রাসবাদী নেটওয়ার্ক ভাঙতে সহযোগিতা চুক্তি স্বাক্ষর করেছে",
      imageAlt: "নিরাপত্তা সম্মেলন কক্ষে গোপন আলোচনা চলছে",
    },
    en: {
      title:
        "Intelligence agencies from five countries sign cooperation pact to dismantle terrorist networks",
      imageAlt:
        "Intelligence officials in confidential discussion at a security conference",
    },
  },
  {
    id: "sr40as2",
    slug: "counterterrorism-training",
    format: "news",
    category: "security",
    regions: ["south-asia"],
    publishedAt: at("09-27 10:20"),
    readingMinutes: 4,
    bn: {
      title:
        "সন্ত্রাসবাদ দমন প্রশিক্ষণ কর্মসূচিতে আন্তর্জাতিক বিশেষজ্ঞ যুক্ত, বছরে এক হাজার সদস্য প্রশিক্ষিত হবেন",
    },
    en: {
      title:
        "International experts added to counter-terrorism training programme, 1,000 personnel to be trained annually",
    },
  },
  {
    id: "c0p0uko",
    slug: "coastal-defense-system",
    format: "news",
    category: "security",
    regions: ["south-asia"],
    publishedAt: at("09-25 14:30"),
    readingMinutes: 4,
    image: "wide",
    bn: {
      title:
        "উপকূল রক্ষা ব্যবস্থায় অত্যাধুনিক রাডার নেটওয়ার্ক স্থাপন, প্রতিটি জেলায় একটি কেন্দ্র থাকবে",
      summary:
        "এই প্রকল্পে তিন বছরে পাঁচ শত কোটি টাকা বিনিয়োগ হবে বলে ঘোষণা করা হয়েছে।",
      imageAlt: "উপকূলীয় রাডার ট্র্যাকিং স্টেশনের সাজসজ্জা",
    },
    en: {
      title:
        "Coastal defence system gets advanced radar network, one centre per district planned",
      summary:
        "The project will require 500 crore taka in investment over three years.",
      imageAlt: "Coastal radar tracking station installation",
    },
  },
  {
    id: "4fqlqpl",
    slug: "organized-crime-investigation",
    format: "analysis",
    category: "security",
    regions: ["south-asia"],
    publishedAt: at("09-23 16:00"),
    readingMinutes: 5,
    author: "arif-rahman",
    bn: {
      title:
        "সংগঠিত অপরাধী দল: আঞ্চলিক নেটওয়ার্ক এবং আর্থিক লেনদেন চিহ্নিত করার চ্যালেঞ্জ",
    },
    en: {
      title:
        "Organized crime syndicates: identifying regional networks and financial flows",
    },
  },
  {
    id: "vv25j6b",
    slug: "disaster-response-drills",
    format: "news",
    category: "security",
    regions: ["south-asia"],
    publishedAt: at("09-21 11:45"),
    readingMinutes: 3,
    bn: {
      title:
        "প্রাকৃতিক দুর্যোগ মোকাবিলায় প্রশাসনিক মহাকাঠামো পরীক্ষা, সারাদেশে মহড়া অনুষ্ঠিত হবে অক্টোবর জুড়ে",
    },
    en: {
      title:
        "Administrative infrastructure for disaster response to be tested, nationwide drills in October",
    },
  },
  {
    id: "xtix7hc",
    slug: "transnational-security-protocol",
    format: "news",
    category: "security",
    regions: ["south-asia"],
    publishedAt: at("09-19 13:30"),
    readingMinutes: 3,
    image: "photo",
    bn: {
      title:
        "আন্তর্জাতিক অভিলাষী অপরাধী দমনে সীমান্ত পার করে সমন্বিত অপারেশনের নতুন প্রোটোকল অনুমোদিত হয়েছে",
      imageAlt: "সীমান্তে সমন্বিত নিরাপত্তা অপারেশনের দৃশ্য",
    },
    en: {
      title:
        "New protocol approved for cross-border coordinated operations against international criminals",
      imageAlt: "A coordinated security operation at a border checkpoint",
    },
  },

  // Technology (10 stories)
  {
    id: "jluuawh",
    slug: "5g-network-expansion",
    format: "news",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("10-03 10:00"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title:
        "দেশব্যাপী ৫জি নেটওয়ার্ক সম্প্রসারণ পরিকল্পনা, প্রথম পর্যায়ে ছয়টি শহরে সেবা চালু হবে",
      summary:
        "দূরসঞ্চার নিয়ন্ত্রণ সংস্থা জানিয়েছে, পাঁচ বছরে সারাদেশ কভার হবে।",
      imageAlt: "শহরের ছাদে স্থাপিত একটি ৫জি ট্রান্সমিটার টাওয়ার",
    },
    en: {
      title:
        "Nationwide 5G network expansion plan, service to launch in six cities first",
      summary:
        "The telecom regulator says nationwide coverage will be achieved in five years.",
      imageAlt: "A 5G transmitter tower installed on a city rooftop",
    },
  },
  {
    id: "32e9cr2",
    slug: "data-center-project",
    format: "news",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("10-01 12:30"),
    readingMinutes: 3,
    image: "classic",
    bn: {
      title:
        "ঢাকার নিকটবর্তী এলাকায় দেশের বৃহত্তম ডেটা সেন্টার প্রকল্প অনুমোদিত",
      imageAlt: "অত্যাধুনিক ডেটা সেন্টার সুবিধার ভিতর দৃশ্য",
    },
    en: {
      title: "Largest data centre project approved near Dhaka",
      imageAlt: "Inside view of a state-of-the-art data centre facility",
    },
  },
  {
    id: "rot6jgm",
    slug: "digital-infrastructure-upgrade",
    format: "news",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("09-30 14:15"),
    readingMinutes: 4,
    bn: {
      title:
        "সরকারি ডিজিটাল অবকাঠামো আপগ্রেড প্রকল্পে আন্তর্জাতিক প্রযুক্তি অংশীদার নির্বাচিত হয়েছে, বাস্তবায়ন শুরু হবে পরের মাসে",
    },
    en: {
      title:
        "International technology partner selected for government digital infrastructure upgrade, implementation begins next month",
    },
  },
  {
    id: "ludi4mn",
    slug: "software-export-initiative",
    format: "analysis",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("09-28 09:00"),
    readingMinutes: 6,
    author: "mehnaz-chowdhury",
    bn: {
      title:
        "সফটওয়্যার রপ্তানি: বৃদ্ধির সম্ভাবনা এবং প্রশিক্ষণে বিনিয়োগের চ্যালেঞ্জ",
    },
    en: {
      title:
        "Software exports: growth potential and the challenge of training investment",
    },
  },
  {
    id: "4dy90ks",
    slug: "tech-startup-incubation",
    format: "news",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("09-26 15:45"),
    readingMinutes: 3,
    image: "wide",
    bn: {
      title:
        "প্রযুক্তি স্টার্টআপ উৎসাহী করতে সরকার নতুন ইনকিউবেশন সেন্টার স্থাপন করছে যেখানে প্রাথমিক তহবিল থেকে প্রশিক্ষণ পর্যন্ত সব কিছু পাবেন উদ্যোক্তারা",
      summary:
        "প্রথম বছরে পঞ্চাশটি স্টার্টআপ প্রকল্প নির্বাচিত হবে সহায়তার জন্য।",
      imageAlt: "প্রযুক্তি স্টার্টআপ অফিসের একটি কার্যক্ষেত্র",
    },
    en: {
      title:
        "Government establishes new tech startup incubation centres with seed funding and training support",
      summary:
        "Fifty startup projects will be selected for support in the first year.",
      imageAlt: "A workspace at a tech startup office",
    },
  },
  {
    id: "dw9wtx0",
    slug: "renewable-energy-tech",
    format: "news",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("09-24 11:00"),
    readingMinutes: 3,
    bn: {
      title:
        "নবায়নযোগ্য শক্তি প্রযুক্তিতে স্থানীয় গবেষণা প্রতিষ্ঠান প্রতিযোগিতামূলক, আঞ্চলিক কেন্দ্র হিসেবে স্বীকৃতি পাবে ঢাকার বিশ্ববিদ্যালয়",
    },
    en: {
      title:
        "Local research institutions competitive in renewable energy technology, Dhaka university to be regional hub",
    },
  },
  {
    id: "o5yqhj4",
    slug: "smart-city-infrastructure",
    format: "news",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("09-22 13:20"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title:
        "স্মার্ট শহর অবকাঠামো পাইলট প্রকল্পে ট্রাফিক ব্যবস্থাপনা ও জনসেবা অ্যাপ্লিকেশন চালু হয়েছে",
      imageAlt: "শহরের রাস্তায় স্মার্ট সেন্সর এবং নিয়ন্ত্রণ ব্যবস্থা",
    },
    en: {
      title:
        "Smart city infrastructure pilot launches traffic management and public service applications",
      imageAlt: "Smart sensors and control systems on city streets",
    },
  },
  {
    id: "cj9xllr",
    slug: "cybersecurity-framework",
    format: "analysis",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("09-20 10:15"),
    readingMinutes: 7,
    author: "tanvir-ahmed",
    bn: {
      title:
        "জাতীয় সাইবার নিরাপত্তা কাঠামো: ডিজিটাল সম্পদ রক্ষার নতুন কৌশল এবং প্রযুক্তিগত বাস্তবায়নের রোডম্যাপ যা আসন্ন পাঁচ বছরে সম্পূর্ণভাবে প্রতিষ্ঠিত হবে",
    },
    en: {
      title:
        "National cybersecurity framework: new strategy and roadmap for protecting digital assets",
    },
  },
  {
    id: "t01gyyl",
    slug: "broadband-expansion-rural",
    format: "news",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("09-19 16:00"),
    readingMinutes: 3,
    image: "classic",
    bn: {
      title:
        "প্রত্যন্ত গ্রামে ব্রডব্যান্ড সংযোগ সম্প্রসারণে লক্ষ্য ৯৯ শতাংশ, তিন বছরে দশ লাখ পরিবার সংযুক্ত হবে",
      imageAlt: "গ্রামীণ এলাকায় ব্রডব্যান্ড নেটওয়ার্ক সংযোগের অবকাঠামো",
    },
    en: {
      title:
        "Broadband expansion to remote villages targets 99 percent coverage, one million families to be connected in three years",
      imageAlt: "Broadband network infrastructure in rural areas",
    },
  },
  {
    id: "mqaso5s",
    slug: "fintech-regulation-update",
    format: "news",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("09-18 12:45"),
    readingMinutes: 3,
    bn: {
      title:
        "ডিজিটাল আর্থিক সেবার নতুন প্রবিধান, মোবাইল ওয়ালেট থেকে ক্রিপ্টোকারেন্সি পর্যন্ত সব ক্ষেত্রে স্পষ্ট দিকনির্দেশনা দেওয়া হয়েছে",
    },
    en: {
      title:
        "Digital financial services regulation updated, clear guidance for mobile wallets to cryptocurrencies",
    },
  },
];
