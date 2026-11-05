// Extra older mock stories for category pages. Fictional: no real people, no
// quotes, no real events. No fact-check content (DR-18).
import type { StoryDef } from "./stories";

/** Time in Dhaka: at("09-07 08:30") is 7 September 2026, 08:30 +06:00. */
function at(monthDayTime: string): string {
  const [monthDay, time] = monthDayTime.split(" ");
  return `2026-${monthDay}T${time}:00+06:00`;
}

export const olderCategoryStories: StoryDef[] = [
  // Geopolitics (6 stories)
  {
    id: "iqvka56",
    slug: "regional-maritime-patrol-accord",
    format: "news",
    category: "geopolitics",
    regions: ["south-asia"],
    publishedAt: at("09-14 12:45"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title:
        "দক্ষিণ এশিয়ার সামুদ্রিক টহল সমন্বয় চুক্তি অনুমোদন, চারটি দেশ স্বাক্ষরকারী",
      summary:
        "জাহাজ দুর্ঘটনা প্রতিরোধ এবং পরিবেশ সংরক্ষণ এই চুক্তির মূল লক্ষ্য।",
      imageAlt:
        "আন্তর্জাতিক সামুদ্রিক টহল বাহিনীর প্রতিনিধিরা একসাথে দাঁড়িয়ে আছেন",
    },
    en: {
      title:
        "South Asian maritime patrol coordination pact approved, four nations sign",
      summary:
        "Ship accident prevention and environmental protection are the main objectives of the agreement.",
      imageAlt:
        "Representatives of international maritime patrol forces standing together",
    },
  },
  {
    id: "3vszl06",
    slug: "bilateral-labor-agreement-signed",
    format: "news",
    category: "geopolitics",
    regions: ["south-asia"],
    publishedAt: at("09-12 15:30"),
    readingMinutes: 3,
    bn: {
      title:
        "দুই দেশের মধ্যে শ্রমিক বিনিময় চুক্তি স্বাক্ষরিত, দক্ষ কর্মী প্রেরণ সহজ হবে",
    },
    en: {
      title:
        "Labour exchange agreement signed between two countries, skilled worker deployment to be easier",
    },
  },
  {
    id: "tnqlp8m",
    slug: "intra-asia-transport-corridor",
    format: "news",
    category: "geopolitics",
    regions: ["asia", "south-asia"],
    topics: ["regional-cooperation"],
    publishedAt: at("09-10 10:15"),
    readingMinutes: 4,
    image: "wide",
    bn: {
      title:
        "এশীয় পরিবহন করিডোর প্রকল্পে নতুন সংযোগ পথ অনুমোদন, রেল ও সড়ক নেটওয়ার্ক সম্প্রসারণ",
      summary:
        "এই প্রকল্পে আঞ্চলিক বাণিজ্য পঞ্চাশ শতাংশ বৃদ্ধির সম্ভাবনা রয়েছে।",
      imageAlt: "এশীয় পরিবহন করিডোরের নতুন সড়ক নির্মাণ স্থল",
    },
    en: {
      title:
        "Asian transport corridor project approves new connection routes, rail and road network expansion",
      summary:
        "The project has potential to increase regional trade by fifty percent.",
      imageAlt:
        "Construction site for the new road in the Asian transport corridor",
    },
  },
  {
    id: "0bivwf5",
    slug: "regional-economic-integration-prospects",
    format: "analysis",
    category: "geopolitics",
    regions: ["south-asia"],
    topics: ["regional-cooperation"],
    publishedAt: at("09-08 14:00"),
    readingMinutes: 6,
    author: "tanvir-ahmed",
    bn: {
      title:
        "দক্ষিণ এশিয়ার অর্থনৈতিক একীকরণ: পাঁচ বছরের রোডম্যাপ এবং বাস্তবায়নের বাধা",
    },
    en: {
      title:
        "South Asian economic integration: five-year roadmap and implementation obstacles",
    },
  },
  {
    id: "znnij6g",
    slug: "diplomatic-youth-exchange-program",
    format: "news",
    category: "geopolitics",
    regions: ["south-asia"],
    publishedAt: at("09-06 11:45"),
    readingMinutes: 3,
    image: "classic",
    bn: {
      title:
        "আঞ্চলিক যুবক কূটনীতি বিনিময় কর্মসূচি চালু, প্রতি বছর তিন শত যুবক অংশগ্রহণ করবেন",
      imageAlt: "যুব কূটনীতি সম্মেলনে অংশগ্রহণকারী তরুণরা আলোচনা করছেন",
    },
    en: {
      title:
        "Regional youth diplomacy exchange programme launched, three hundred youths to participate annually",
      imageAlt:
        "Young participants in youth diplomacy conference discussing with peers",
    },
  },
  {
    id: "l4751cc",
    slug: "infrastructure-financing-multilateral",
    format: "news",
    category: "geopolitics",
    regions: ["south-asia"],
    publishedAt: at("09-03 09:20"),
    readingMinutes: 3,
    bn: {
      title:
        "অবকাঠামো উন্নয়নে আন্তর্জাতিক তহবিল গঠন, পাঁচটি উন্নয়ন ব্যাংক অংশীদার হয়েছে",
    },
    en: {
      title:
        "International fund for infrastructure development formed, five development banks as partners",
    },
  },

  // Economy (6 stories)
  {
    id: "4me7iod",
    slug: "export-merchandise-august-report",
    format: "news",
    category: "economy",
    regions: ["south-asia"],
    publishedAt: at("09-16 08:45"),
    readingMinutes: 3,
    image: "photo",
    bn: {
      title:
        "আগস্ট মাসে পোশাক রপ্তানিতে পাঁচ শতাংশ বৃদ্ধি, নতুন বাজারে সম্প্রসারণ সফল",
      summary: "পোশাক শিল্প মালিক সমিতি বলেছে পরবর্তী ত্রৈমাসিক আরও ভালো হবে।",
      imageAlt: "পোশাক পণ্য সংস্করণ কেন্দ্রে বাক্স প্যাকেজিং করা হচ্ছে",
    },
    en: {
      title:
        "August apparel exports up five percent, expansion to new markets successful",
      summary:
        "Garment manufacturers association says next quarter will be even better.",
      imageAlt:
        "Garment products being packaged in boxes at a processing centre",
    },
  },
  {
    id: "iuw2sad",
    slug: "pharmaceutical-pricing-regulation",
    format: "news",
    category: "economy",
    regions: ["south-asia"],
    publishedAt: at("09-14 13:15"),
    readingMinutes: 3,
    bn: {
      title:
        "ঔষধের মূল্য নির্ধারণ নীতি আপডেট, জেনেরিক ওষুধে সাশ্রয় বাড়বে বলে প্রত্যাশা",
    },
    en: {
      title:
        "Medicine pricing policy updated, savings on generic drugs expected to increase",
    },
  },
  {
    id: "8oejaci",
    slug: "leather-industry-modernization",
    format: "news",
    category: "economy",
    regions: ["south-asia"],
    publishedAt: at("09-11 15:45"),
    readingMinutes: 4,
    image: "wide",
    bn: {
      title:
        "চামড়া শিল্পের আধুনিকীকরণ প্রকল্পে পরিবেশ বান্ধব প্রযুক্তি স্থাপন, উৎপাদন খরচ কমবে",
      summary: "এই প্রকল্পে মোট তিনশত কোটি টাকা বিনিয়োগের পরিকল্পনা রয়েছে।",
      imageAlt: "চামড়া প্রক্রিয়াকরণ কারখানায় নতুন পরিবেশ বান্ধব মেশিন",
    },
    en: {
      title:
        "Leather industry modernization project installs eco-friendly technology, production costs to decrease",
      summary:
        "The project plans three hundred crore taka in total investment.",
      imageAlt:
        "New environmentally friendly machinery at a leather processing factory",
    },
  },
  {
    id: "occhv1m",
    slug: "trade-deficit-analysis-quarterly",
    format: "analysis",
    category: "economy",
    regions: ["south-asia"],
    publishedAt: at("09-09 10:30"),
    readingMinutes: 5,
    author: "mehnaz-chowdhury",
    bn: {
      title:
        "ত্রৈমাসিক বাণিজ্য ঘাটতি: আমদানি চাপ এবং রপ্তানি বৈচিত্র্যের প্রয়োজনীয়তা",
    },
    en: {
      title:
        "Quarterly trade deficit: import pressures and the need for export diversification",
    },
  },
  {
    id: "a2e24a8",
    slug: "fmcg-sector-investment-drive",
    format: "news",
    category: "economy",
    regions: ["south-asia"],
    publishedAt: at("09-07 12:00"),
    readingMinutes: 3,
    bn: {
      title:
        "দ্রুত গতির ভোক্তা পণ্য খাতে বিনিয়োগ বৃদ্ধি, তরুণ উদ্যোক্তারা নতুন ব্র্যান্ড চালু করছেন",
    },
    en: {
      title:
        "Increased investment in FMCG sector, young entrepreneurs launching new brands",
    },
  },
  {
    id: "67ayluw",
    slug: "tourism-revenue-growth-summer",
    format: "news",
    category: "economy",
    regions: ["south-asia"],
    publishedAt: at("09-04 14:30"),
    readingMinutes: 3,
    image: "classic",
    bn: {
      title:
        "গ্রীষ্মকালীন পর্যটন রাজস্ব দ্বিগুণ হয়েছে, আন্তর্জাতিক পর্যটক আগমন বেড়েছে",
      imageAlt: "পর্যটক প্রধান এলাকায় সমুদ্র সৈকত ভ্রমণ করছেন পর্যটকরা",
    },
    en: {
      title:
        "Summer tourism revenue doubled, international visitor arrivals increased",
      imageAlt:
        "Tourists enjoying beach activities at a popular tourist destination",
    },
  },

  // Security (6 stories)
  {
    id: "smuxa0h",
    slug: "joint-maritime-exercises-completed",
    format: "news",
    category: "security",
    regions: ["south-asia"],
    publishedAt: at("09-15 07:30"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title:
        "দুই দেশের নৌ বাহিনীর যৌথ সামরিক মহড়া সম্পন্ন, অপারেশনাল সমন্বয় উন্নত হয়েছে",
      summary: "এই মহড়ায় উভয় দেশের থেকে বারোটি যুদ্ধজাহাজ অংশগ্রহণ করেছে।",
      imageAlt:
        "সামরিক মহড়ায় যুদ্ধজাহাজ সমুদ্রে সমন্বিত কার্যক্রম পরিচালনা করছে",
    },
    en: {
      title:
        "Joint military exercises between two nations' navies completed, operational coordination improved",
      summary:
        "Twelve warships from both countries participated in the exercise.",
      imageAlt:
        "Warships conducting coordinated operations at sea during military exercise",
    },
  },
  {
    id: "a0lzudj",
    slug: "border-infrastructure-reinforcement",
    format: "news",
    category: "security",
    regions: ["south-asia"],
    publishedAt: at("09-12 09:45"),
    readingMinutes: 3,
    bn: {
      title:
        "সীমান্তীয় অবকাঠামো শক্তিশালীকরণে অতিরিক্ত বাজেট বরাদ্দ, তিনটি নতুন চেকপয়েন্ট স্থাপন",
    },
    en: {
      title:
        "Additional budget for border infrastructure reinforcement, three new checkpoints to be established",
    },
  },
  {
    id: "6kbir9e",
    slug: "disaster-preparedness-annual-review",
    format: "news",
    category: "security",
    regions: ["south-asia"],
    topics: ["rivers", "monsoon", "flood-forecasting"],
    publishedAt: at("09-10 13:30"),
    readingMinutes: 3,
    image: "wide",
    bn: {
      title:
        "দুর্যোগ প্রস্তুতি পরিকল্পনা বার্ষিক পর্যালোচনা সম্পন্ন, নতুন ঝুঁকি মূল্যায়ন যুক্ত হয়েছে",
      summary:
        "প্রশিক্ষণ কর্মসূচিতে জলবায়ু সংকট মোকাবিলার উপাদান নতুনভাবে অন্তর্ভুক্ত করা হয়েছে।",
      imageAlt:
        "দুর্যোগ প্রস্তুতি প্রশিক্ষণ সেশনে অংশগ্রহণকারীরা নিরাপত্তা প্রোটোকল শিখছেন",
    },
    en: {
      title:
        "Annual disaster preparedness plan review completed, new risk assessments added",
      summary:
        "Climate crisis response elements newly included in training programmes.",
      imageAlt:
        "Participants learning safety protocols at a disaster preparedness training session",
    },
  },
  {
    id: "jsa7q0q",
    slug: "counter-trafficking-regional-strategy",
    format: "analysis",
    category: "security",
    regions: ["south-asia"],
    publishedAt: at("09-08 11:00"),
    readingMinutes: 5,
    author: "arif-rahman",
    bn: {
      title:
        "মানব পাচার প্রতিরোধ: আঞ্চলিক কৌশল এবং সীমান্ত নিয়ন্ত্রণের সমন্বয়",
    },
    en: {
      title:
        "Human trafficking prevention: regional strategy and border control coordination",
    },
  },
  {
    id: "0fpp0jn",
    slug: "law-enforcement-capacity-training",
    format: "news",
    category: "security",
    regions: ["south-asia"],
    publishedAt: at("09-05 15:15"),
    readingMinutes: 3,
    bn: {
      title:
        "প্রয়োগকারী সংস্থাগুলির ক্ষমতা বৃদ্ধিতে আন্তর্জাতিক প্রশিক্ষণ কর্মসূচি চালু, তদন্ত দক্ষতা উন্নত হবে",
    },
    en: {
      title:
        "International training programme launched to enhance law enforcement capacity, investigation skills to improve",
    },
  },
  {
    id: "n06axe5",
    slug: "defense-procurement-modernization",
    // Analysis older than the 5 in the analysis block, so More stories shows one analysis
    // row with its label (tajmin, 28 Oct 2026).
    format: "analysis",
    category: "security",
    regions: ["south-asia"],
    publishedAt: at("09-02 10:20"),
    readingMinutes: 4,
    image: "classic",
    bn: {
      title:
        "প্রতিরক্ষা সরঞ্জাম আধুনিকীকরণ প্রকল্পে নতুন বিমান সংগ্রহ পরিকল্পনা অনুমোদিত",
      imageAlt: "প্রতিরক্ষা বাহিনীর নতুন সামরিক প্রযুক্তি প্রদর্শনী",
    },
    en: {
      title:
        "Defence modernization project approves plan for new aircraft acquisition",
      imageAlt: "Defence forces display of new military technology",
    },
  },

  // Technology (6 stories)
  {
    id: "g7coicu",
    slug: "ai-ethics-framework-adoption",
    format: "news",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("09-14 10:00"),
    readingMinutes: 3,
    image: "photo",
    bn: {
      title:
        "কৃত্রিম বুদ্ধিমত্তার নৈতিক নিয়ন্ত্রণ ফ্রেমওয়ার্ক দেশব্যাপী গৃহীত হয়েছে, প্রযুক্তি উদ্যোক্তারা আগ্রহী",
      summary:
        "এই ফ্রেমওয়ার্ক তথ্যের গোপনীয়তা রক্ষার নতুন নির্দেশনা নির্ধারণ করেছে।",
      imageAlt:
        "প্রযুক্তি কোম্পানিতে কৃত্রিম বুদ্ধিমত্তা নৈতিকতা কর্মশালা চলছে",
    },
    en: {
      title:
        "National AI ethics framework adopted, technology entrepreneurs interested",
      summary:
        "The framework sets new guidelines for protecting information privacy.",
      imageAlt: "AI ethics workshop underway at a technology company",
    },
  },
  {
    id: "ajcgm91",
    slug: "open-source-software-initiative",
    format: "news",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("09-12 14:00"),
    readingMinutes: 3,
    bn: {
      title:
        "সরকার স্থানীয় উন্মুক্ত সফটওয়্যার উন্নয়ন প্রকল্পে বিনিয়োগ বৃদ্ধি করছে, ডিজিটাল স্বাধীনতা লক্ষ্য",
    },
    en: {
      title:
        "Government increases investment in local open-source software development, digital independence goal",
    },
  },
  {
    id: "s0jpfrf",
    slug: "semiconductor-testing-facility",
    format: "news",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("09-10 11:30"),
    readingMinutes: 4,
    image: "wide",
    bn: {
      title:
        "দেশের প্রথম অর্ধপরিবাহী পরীক্ষা সুবিধা চালু, স্থানীয় চিপ ডিজাইন উদ্যোগ এগিয়ে যাবে",
      summary:
        "এই সুবিধা তিনটি বিশ্ববিদ্যালয় এবং পাঁচটি স্থানীয় প্রযুক্তি কোম্পানি দ্বারা পরিচালিত হবে।",
      imageAlt:
        "অর্ধপরিবাহী পরীক্ষা সুবিধায় অত্যাধুনিক পরীক্ষামূলক যন্ত্রপাতি",
    },
    en: {
      title:
        "Country's first semiconductor testing facility launched, local chip design initiative to advance",
      summary:
        "The facility will be operated by three universities and five local tech companies.",
      imageAlt:
        "State-of-the-art testing equipment at the semiconductor testing facility",
    },
  },
  {
    id: "a3wdc34",
    slug: "digital-payment-transformation-policy",
    format: "analysis",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("09-08 09:45"),
    readingMinutes: 5,
    author: "rashed-hossain",
    bn: {
      title:
        "ডিজিটাল পেমেন্ট রূপান্তর: নগদ অর্থনীতি থেকে সম্পূর্ণ ডিজিটালকরণের পথ",
    },
    en: {
      title:
        "Digital payment transformation: path from cash economy to full digitalization",
    },
  },
  {
    id: "07o36sy",
    slug: "space-technology-research-center",
    format: "news",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("09-06 13:20"),
    readingMinutes: 3,
    bn: {
      title:
        "মহাকাশ প্রযুক্তি গবেষণা কেন্দ্র স্থাপনে চূড়ান্ত অনুমোদন, প্রথম স্যাটেলাইট প্রকল্প পরিকল্পিত",
    },
    en: {
      title:
        "Final approval for space technology research centre, first satellite project planned",
    },
  },
  {
    id: "6w1h725",
    slug: "biotechnology-lab-accreditation",
    format: "news",
    category: "technology",
    regions: ["south-asia"],
    publishedAt: at("09-03 15:45"),
    readingMinutes: 3,
    image: "classic",
    bn: {
      title:
        "জৈব প্রযুক্তি গবেষণাগার আন্তর্জাতিক স্বীকৃতি পেয়েছে, স্বাস্থ্যসেবা উদ্ভাবন ত্বরান্বিত হবে",
      imageAlt:
        "জৈব প্রযুক্তি গবেষণাগারে বিজ্ঞানীরা মাইক্রোস্কোপে গবেষণা করছেন",
    },
    en: {
      title:
        "Biotechnology research lab receives international accreditation, healthcare innovation to accelerate",
      imageAlt:
        "Scientists at biotechnology research lab examining samples under microscope",
    },
  },

  // History (6 stories)
  {
    id: "z0i8dxz",
    slug: "ancient-city-settlement-unearthed",
    format: "news",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-16 10:30"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title:
        "প্রাচীন শহর বসতি খনন কাজে নতুন তিন শত খ্রিস্টপূর্ব পর্যন্ত নিদর্শন পাওয়া গেছে",
      summary:
        "পণ্ডিতরা বলছেন এটি প্রাচীন সিল্ক রুটের একটি গুরুত্বপূর্ণ বাণিজ্য কেন্দ্র ছিল।",
      imageAlt: "প্রাচীন শহর খনন স্থলে প্রাপ্ত পুরানো মাটির পাত্র এবং নিদর্শন",
    },
    en: {
      title:
        "Ancient city settlement excavation unearths artefacts up to three hundred BCE",
      summary:
        "Scholars say it was an important trade centre on the ancient Silk Route.",
      imageAlt:
        "Ancient pottery and artefacts discovered at an ancient city excavation site",
    },
  },
  {
    id: "bm24a4q",
    slug: "historical-manuscript-collection-digitized",
    format: "news",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-13 12:15"),
    readingMinutes: 3,
    bn: {
      title:
        "ঐতিহাসিক পাণ্ডুলিপি সংগ্রহ ডিজিটালকরণ সমাপ্ত, জাতীয় আর্কাইভ ইতিহাস প্রকাশ করছে",
    },
    en: {
      title:
        "Historical manuscript collection digitization completed, national archive releases historical records",
    },
  },
  {
    id: "5ihb1t7",
    slug: "temple-restoration-completion",
    format: "news",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-11 14:45"),
    readingMinutes: 3,
    image: "wide",
    bn: {
      title:
        "দুশত বছর পুরানো প্রাচীন মন্দির সংরক্ষণ প্রকল্প সম্পন্ন, স্থাপত্য ঐতিহ্য পুনরুদ্ধার হয়েছে",
      summary:
        "সংরক্ষণ দল ঐতিহ্যবাহী পাথর খোদাই কৌশল ব্যবহার করে সমস্ত মেরামত করেছে।",
      imageAlt: "সংরক্ষণের পর দাঁড়িয়ে থাকা সুন্দর প্রাচীন মন্দিরের সম্মুখভাগ",
    },
    en: {
      title:
        "Two-hundred-year-old ancient temple restoration project completed, architectural heritage restored",
      summary:
        "Restoration team used traditional stone carving techniques for all repairs.",
      imageAlt:
        "The beautifully restored facade of the ancient temple after conservation",
    },
  },
  {
    id: "oxz7pdi",
    slug: "colonial-governance-history-study",
    format: "analysis",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-09 10:00"),
    readingMinutes: 6,
    author: "sumaiya-islam",
    bn: {
      title:
        "ব্রিটিশ শাসনকালীন প্রশাসনিক পরিবর্তন: স্থানীয় প্রতিষ্ঠান থেকে কেন্দ্রীভূত নিয়ন্ত্রণের পথ",
    },
    en: {
      title:
        "Administrative transformation under British rule: path from local institutions to centralized control",
    },
  },
  {
    id: "3ap0khe",
    slug: "oral-history-project-documentation",
    format: "news",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-07 11:30"),
    readingMinutes: 3,
    bn: {
      title:
        "স্থানীয় ইতিহাস সংরক্ষণ প্রকল্পে মুখরোচক কাহিনী সংগ্রহ, পঞ্চাশ জন বয়স্ক সাক্ষাৎকার নেওয়া হয়েছে",
    },
    en: {
      title:
        "Local history preservation project collects oral narratives, interviews conducted with fifty elders",
    },
  },
  {
    id: "a674r6c",
    slug: "archaeological-artifact-dating-completed",
    format: "news",
    category: "history",
    regions: ["south-asia"],
    publishedAt: at("09-04 13:00"),
    readingMinutes: 3,
    image: "classic",
    bn: {
      title:
        "প্রাচীন নিদর্শন সময় নির্ণয় প্রকল্প সমাপ্ত, আঠারো শত নিদর্শনের বয়স নির্ধারণ করা হয়েছে",
      imageAlt:
        "গবেষণাগারে প্রাচীন নিদর্শন পরীক্ষা করে সময় নির্ণয় করছেন পণ্ডিত",
    },
    en: {
      title:
        "Archaeological artefact dating project completed, eighteen hundred artefacts' ages determined",
      imageAlt:
        "Scholar determining age of ancient artefacts through laboratory analysis",
    },
  },
];
