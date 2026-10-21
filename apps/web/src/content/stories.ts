// Mock stories in Bangla and English (DR-01). Fictional but realistic: no real
// people, no quotes, no real events. No fact-check content (DR-18).
// Each story is written once with a bn and an en part, so a story and its
// translation share one id. Components read stories through ./index.ts only.
import type { CategoryId, Format, RegionId } from "./types";

type ImageFile = keyof typeof imageFiles;

export const imageFiles = {
  wide: { src: "/mock/landscape-16x9.svg", width: 1600, height: 900 },
  photo: { src: "/mock/landscape-3x2.svg", width: 1500, height: 1000 },
  classic: { src: "/mock/landscape-4x3.svg", width: 1200, height: 900 },
} as const;

interface StoryText {
  title: string;
  summary?: string;
  imageAlt?: string;
}

export interface StoryDef {
  id: string;
  format: Format;
  category: CategoryId;
  region?: RegionId;
  publishedAt: string;
  readingMinutes?: number;
  image?: ImageFile;
  author?: AuthorId;
  bn: StoryText;
  en: StoryText;
}

type AuthorId = keyof typeof authors;

export const authors = {
  "farhana-kabir": { bn: "ফারহানা কবির", en: "Farhana Kabir" },
  "tanvir-ahmed": { bn: "তানভীর আহমেদ", en: "Tanvir Ahmed" },
  "rashed-hossain": { bn: "রাশেদ হোসেন", en: "Rashed Hossain" },
  "sumaiya-islam": { bn: "সুমাইয়া ইসলাম", en: "Sumaiya Islam" },
  "arif-rahman": { bn: "আরিফ রহমান", en: "Arif Rahman" },
  "mehnaz-chowdhury": { bn: "মেহনাজ চৌধুরী", en: "Mehnaz Chowdhury" },
} as const;

/** Time in Dhaka: at("10-07 08:30") is 7 October 2026, 08:30 +06:00. */
function at(monthDayTime: string): string {
  const [monthDay, time] = monthDayTime.split(" ");
  return `2026-${monthDay}T${time}:00+06:00`;
}

export const stories: StoryDef[] = [
  // Hero
  {
    id: "river-data-framework",
    format: "news",
    category: "bangladesh",
    publishedAt: at("10-07 09:15"),
    readingMinutes: 6,
    image: "wide",
    bn: {
      title:
        "অভিন্ন নদীর তথ্য বিনিময়ে চার দেশের খসড়া কাঠামো, বর্ষার আগেই চালুর লক্ষ্য",
      summary:
        "ঢাকায় দুই দিনের বৈঠক শেষে কর্মকর্তারা জানান, পানিপ্রবাহ ও বৃষ্টিপাতের তথ্য প্রতি ছয় ঘণ্টায় ভাগ করা হবে। চূড়ান্ত চুক্তির আগে প্রতিটি দেশের মন্ত্রিসভার অনুমোদন লাগবে।",
      imageAlt: "নদীর তীরে পানি পরিমাপের একটি কেন্দ্র",
    },
    en: {
      title:
        "Four countries agree draft framework to share river data before the monsoon",
      summary:
        "After two days of talks in Dhaka, officials said flow and rainfall data would be shared every six hours. Each cabinet must approve the plan before a final agreement.",
      imageAlt: "A river gauge station on a riverbank",
    },
  },
  {
    id: "deep-sea-port-trial-ship",
    format: "news",
    category: "economy",
    publishedAt: at("10-07 08:40"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      // Long Bangla headline (spacing-layout-system.md 13).
      title:
        "বঙ্গোপসাগরের নতুন গভীর সমুদ্রবন্দরে প্রথম পরীক্ষামূলক জাহাজ ভিড়ল, তবে সড়ক ও রেল সংযোগ শেষ না হওয়ায় পুরো সক্ষমতায় যেতে আরও দুই বছর লাগতে পারে বলে জানাচ্ছেন কর্মকর্তারা",
      summary:
        "বন্দর কর্তৃপক্ষ বলছে, প্রথম ধাপে বছরে দশ লাখ কনটেইনার ওঠানামার লক্ষ্য রয়েছে।",
      imageAlt: "বন্দরের জেটিতে ভেড়ানো একটি কনটেইনার জাহাজ",
    },
    en: {
      title:
        "First trial ship docks at new Bay of Bengal deep-sea port, but full capacity may take two more years",
      summary:
        "The port authority says the first phase aims to handle one million containers a year.",
      imageAlt: "A container ship moored at a port jetty",
    },
  },
  {
    id: "joint-border-patrol-rules",
    format: "explainer",
    category: "security",
    publishedAt: at("10-07 07:55"),
    readingMinutes: 5,
    bn: {
      title: "সীমান্তে যৌথ টহলের নতুন নিয়ম: কী বদলাচ্ছে, কী থাকছে আগের মতো",
      summary:
        "দুই দেশের সীমান্তরক্ষী বাহিনীর বৈঠকে রাতের টহল ও যোগাযোগের নতুন পদ্ধতিতে সম্মতি হয়েছে।",
    },
    en: {
      title:
        "New rules for joint border patrols: what changes and what stays the same",
      summary:
        "Border forces of both countries agreed on night patrols and a new way to stay in contact.",
    },
  },

  {
    id: "border-crossing-digital-pass",
    format: "news",
    category: "security",
    publishedAt: at("10-07 07:50"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title:
        "স্থলবন্দরে যাত্রীদের জন্য ডিজিটাল পাস চালু, অপেক্ষার সময় কমার আশা",
      summary:
        "প্রথম পর্যায়ে তিনটি স্থলবন্দরে নতুন ব্যবস্থায় যাত্রীদের কাগজপত্র যাচাই হবে অনলাইনে।",
      imageAlt: "স্থলবন্দরের চেকপোস্টে সারিতে দাঁড়ানো যাত্রীরা",
    },
    en: {
      title:
        "Digital pass launched for land port travelers, with shorter waits expected",
      summary:
        "In the first phase, travelers' documents at three land ports will be checked online.",
      imageAlt: "Travelers queuing at a land port checkpoint",
    },
  },

  // Latest
  {
    id: "exports-september",
    format: "news",
    category: "economy",
    publishedAt: at("10-07 10:05"),
    bn: { title: "রপ্তানি আয়ে সেপ্টেম্বরে ৭ শতাংশ প্রবৃদ্ধি" },
    en: { title: "Export earnings grow 7 percent in September" },
  },
  {
    id: "foreign-secretary-kathmandu",
    format: "news",
    category: "geopolitics",
    publishedAt: at("10-07 09:50"),
    bn: {
      title: "আঞ্চলিক সংযোগ ফোরামে যোগ দিতে পররাষ্ট্রসচিব কাঠমান্ডু যাচ্ছেন",
    },
    en: {
      title:
        "Foreign secretary heads to Kathmandu for regional connectivity forum",
    },
  },
  {
    id: "new-submarine-cable",
    format: "news",
    category: "technology",
    publishedAt: at("10-07 09:30"),
    bn: { title: "নতুন সাবমেরিন কেবলে পরীক্ষামূলক ইন্টারনেট সেবা শুরু" },
    en: {
      title: "Trial internet service begins on a new submarine cable link",
    },
  },
  {
    id: "chattogram-rain-warning",
    format: "news",
    category: "bangladesh",
    publishedAt: at("10-07 09:10"),
    readingMinutes: 2,
    bn: {
      title: "চট্টগ্রামে ভারী বৃষ্টির সতর্কতা, পাহাড়ধসের ঝুঁকিতে চার উপজেলা",
    },
    en: {
      title:
        "Heavy rain warning in Chattogram; four sub-districts at risk of landslides",
    },
  },
  {
    id: "coast-guard-patrol-boats",
    format: "news",
    category: "security",
    publishedAt: at("10-07 08:20"),
    bn: { title: "উপকূলে জলদস্যুতা ঠেকাতে কোস্টগার্ডের নতুন টহল নৌযান" },
    en: {
      title: "Coast guard adds patrol boats to curb piracy along the coast",
    },
  },
  {
    id: "liberation-war-press-archive",
    format: "news",
    category: "history",
    publishedAt: at("10-07 07:30"),
    bn: { title: "মুক্তিযুদ্ধ নিয়ে বিদেশি সংবাদপত্রের সংগ্রহ এখন অনলাইনে" },
    en: {
      title: "Foreign newspaper archive on the 1971 Liberation War goes online",
    },
  },

  // Analysis
  {
    id: "small-state-balancing",
    format: "analysis",
    category: "geopolitics",
    publishedAt: at("10-07 06:00"),
    readingMinutes: 9,
    image: "photo",
    author: "farhana-kabir",
    bn: {
      title:
        "ছোট রাষ্ট্রের ভারসাম্যের কূটনীতি: বড় শক্তির প্রতিযোগিতায় বাংলাদেশের সুযোগ ও ঝুঁকি",
      summary:
        "দুই দিকের চাপ সামলে স্বাধীন নীতি ধরে রাখতে হলে অর্থনৈতিক অংশীদারি বহুমুখী করাই প্রধান শর্ত।",
      imageAlt: "সম্মেলনকক্ষে সারি করে রাখা কয়েকটি দেশের পতাকা",
    },
    en: {
      title:
        "The balancing diplomacy of small states: Bangladesh's chances and risks amid great-power rivalry",
      summary:
        "Keeping an independent policy under pressure from both sides depends first on more varied economic partners.",
      imageAlt: "A row of national flags in a conference room",
    },
  },
  {
    id: "reserve-indicators",
    format: "analysis",
    category: "economy",
    publishedAt: at("10-06 20:00"),
    readingMinutes: 7,
    image: "classic",
    author: "tanvir-ahmed",
    bn: {
      title: "ডলার সংকট কাটছে কি? রিজার্ভের তিনটি সূচক যা বলছে",
      imageAlt: "ব্যাংকের কাউন্টারে বৈদেশিক মুদ্রার নোট",
    },
    en: {
      title:
        "Is the dollar shortage easing? What three reserve indicators show",
      imageAlt: "Foreign currency notes on a bank counter",
    },
  },
  {
    id: "chip-supply-map",
    format: "analysis",
    category: "technology",
    publishedAt: at("10-06 17:30"),
    readingMinutes: 8,
    image: "photo",
    author: "sumaiya-islam",
    bn: {
      title: "চিপ সরবরাহের মানচিত্র বদলাচ্ছে, দক্ষিণ এশিয়া কোথায় দাঁড়িয়ে",
      imageAlt: "একটি সার্কিট বোর্ডের কাছ থেকে তোলা ছবি",
    },
    en: {
      title: "The chip supply map is changing. Where does South Asia stand?",
      imageAlt: "A close view of a circuit board",
    },
  },
  {
    id: "bay-security-calculation",
    format: "analysis",
    category: "security",
    publishedAt: at("10-06 15:00"),
    readingMinutes: 10,
    author: "rashed-hossain",
    bn: {
      title: "সমুদ্রসীমা মীমাংসার পর বঙ্গোপসাগরে নিরাপত্তার নতুন হিসাব",
    },
    en: {
      title:
        "After the maritime boundary was settled, a new security calculation in the Bay of Bengal",
    },
  },

  // Opinion
  {
    id: "opinion-connectivity-not-port",
    format: "opinion",
    category: "economy",
    publishedAt: at("10-07 07:00"),
    readingMinutes: 5,
    author: "mehnaz-chowdhury",
    bn: { title: "বন্দর নয়, আসল প্রশ্ন সংযোগের" },
    en: { title: "The real question is connectivity, not the port" },
  },
  {
    id: "opinion-climate-finance",
    format: "opinion",
    category: "geopolitics",
    publishedAt: at("10-06 21:00"),
    readingMinutes: 6,
    author: "arif-rahman",
    bn: { title: "জলবায়ু তহবিলের প্রতিশ্রুতি কাগজে থাকলে চলবে না" },
    en: { title: "Climate finance pledges must not stay on paper" },
  },
  {
    id: "opinion-digital-economy-youth",
    format: "opinion",
    category: "technology",
    publishedAt: at("10-06 18:00"),
    readingMinutes: 5,
    author: "sumaiya-islam",
    bn: { title: "তরুণদের জন্য ডিজিটাল অর্থনীতি: নীতি আছে, পথ নেই" },
    en: {
      title:
        "A digital economy for the young: the policy exists, the path does not",
    },
  },
  {
    id: "opinion-regional-history",
    format: "opinion",
    category: "history",
    publishedAt: at("10-06 12:00"),
    readingMinutes: 4,
    author: "farhana-kabir",
    bn: { title: "ইতিহাসের পাঠ্যবইয়ে আঞ্চলিক দৃষ্টিভঙ্গি জরুরি" },
    en: { title: "History textbooks need a regional view" },
  },
  {
    id: "opinion-energy-transition-labour",
    format: "opinion",
    category: "economy",
    publishedAt: at("10-06 09:00"),
    readingMinutes: 5,
    author: "tanvir-ahmed",
    bn: { title: "জ্বালানি রূপান্তরে শ্রমিকের জায়গা কোথায়" },
    en: { title: "Where do workers stand in the energy transition?" },
  },

  // Featured: বাংলাদেশ
  {
    id: "coastal-embankment-project",
    format: "news",
    category: "bangladesh",
    publishedAt: at("10-07 08:00"),
    readingMinutes: 5,
    image: "wide",
    bn: {
      title:
        "উপকূলের ১৯ জেলায় নতুন বাঁধ প্রকল্প, প্রথম ধাপে বরাদ্দ ৪ হাজার কোটি টাকা",
      summary:
        "পানিসম্পদ মন্ত্রণালয় বলছে, ঘূর্ণিঝড় মৌসুমের আগে সবচেয়ে ঝুঁকিপূর্ণ ৭০ কিলোমিটার বাঁধের কাজ শেষ হবে।",
      imageAlt: "উপকূলে মাটি ফেলে বাঁধ উঁচু করার কাজ",
    },
    en: {
      title:
        "New embankment project for 19 coastal districts, with Tk 4,000 crore in the first phase",
      summary:
        "The water resources ministry says work on the 70 most vulnerable kilometres will finish before the cyclone season.",
      imageAlt: "Workers raising a coastal embankment with soil",
    },
  },
  {
    id: "dhaka-single-ticket",
    format: "news",
    category: "bangladesh",
    publishedAt: at("10-07 07:45"),
    readingMinutes: 3,
    image: "classic",
    bn: {
      title: "ঢাকার গণপরিবহনে একক টিকিট চালু হচ্ছে জানুয়ারিতে",
      imageAlt: "মেট্রো স্টেশনের প্ল্যাটফর্মে যাত্রীরা",
    },
    en: {
      title: "Single ticket for Dhaka public transport to start in January",
      imageAlt: "Passengers on a metro station platform",
    },
  },
  {
    id: "primary-teacher-training",
    format: "news",
    category: "bangladesh",
    publishedAt: at("10-06 19:20"),
    readingMinutes: 4,
    bn: {
      // Long Bangla headline with no image.
      title:
        "প্রাথমিক বিদ্যালয়ের শিক্ষকদের নতুন প্রশিক্ষণ কর্মসূচিতে ডিজিটাল পাঠদান, শিশুদের মানসিক স্বাস্থ্য এবং প্রতিবন্ধী শিক্ষার্থীদের অন্তর্ভুক্তির ওপর বিশেষ জোর দেওয়া হবে বলে জানিয়েছে শিক্ষা মন্ত্রণালয়",
    },
    en: {
      title:
        "Primary teacher training to focus on digital lessons, child mental health and inclusion",
    },
  },
  {
    id: "aman-harvest-north",
    format: "news",
    category: "bangladesh",
    publishedAt: at("10-06 16:00"),
    readingMinutes: 3,
    bn: { title: "উত্তরাঞ্চলে আমন ধানের ভালো ফলনের আশা" },
    en: { title: "Good aman rice harvest expected in the north" },
  },

  // Featured: ভূরাজনীতি
  {
    id: "bay-trilateral-dialogue",
    format: "news",
    category: "geopolitics",
    publishedAt: at("10-07 06:45"),
    readingMinutes: 6,
    image: "wide",
    bn: {
      title: "বঙ্গোপসাগর ঘিরে নতুন ত্রিপক্ষীয় সংলাপ, ঢাকার ভূমিকা নিয়ে আগ্রহ",
      summary:
        "প্রথম বৈঠকে সমুদ্রপথের নিরাপত্তা, দুর্যোগে সহায়তা ও মৎস্যসম্পদ নিয়ে আলোচনা হয়েছে। পরের বৈঠক হবে আগামী বছরের শুরুতে।",
      imageAlt: "গোল টেবিলে আলোচনায় বসা কয়েকজন প্রতিনিধি",
    },
    en: {
      title:
        "New three-way dialogue on the Bay of Bengal draws interest in Dhaka's role",
      summary:
        "The first meeting covered sea-lane security, disaster help and fisheries. The next meeting is planned for early next year.",
      imageAlt: "Delegates in talks around a round table",
    },
  },
  {
    id: "regional-power-grid",
    format: "news",
    category: "geopolitics",
    publishedAt: at("10-06 22:10"),
    readingMinutes: 4,
    image: "classic",
    bn: {
      title: "দক্ষিণ এশিয়ায় বিদ্যুৎ বাণিজ্যের আঞ্চলিক গ্রিড আলোচনায় অগ্রগতি",
      imageAlt: "মাঠের ওপর দিয়ে যাওয়া বিদ্যুৎ সঞ্চালন লাইন",
    },
    en: {
      title: "Progress in talks on a regional power-trade grid for South Asia",
      imageAlt: "Power transmission lines across a field",
    },
  },
  {
    id: "peacekeeping-women-target",
    format: "news",
    category: "geopolitics",
    publishedAt: at("10-06 18:40"),
    readingMinutes: 3,
    bn: { title: "শান্তিরক্ষা মিশনে নারী সদস্য বাড়াতে নতুন লক্ষ্য" },
    en: {
      title: "New target to raise the number of women in peacekeeping missions",
    },
  },
  {
    id: "visa-joint-committee",
    format: "news",
    category: "geopolitics",
    publishedAt: at("10-06 14:30"),
    readingMinutes: 3,
    bn: { title: "ভিসা সহজ করতে দুই প্রতিবেশীর যৌথ কমিটি" },
    en: { title: "Two neighbours form a joint committee to ease visas" },
  },

  // Grouped: নিরাপত্তা ও সংঘাত
  {
    id: "cyber-response-centre",
    format: "news",
    category: "security",
    publishedAt: at("10-07 05:30"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title: "সাইবার হামলা মোকাবিলায় জাতীয় সাড়াদান কেন্দ্রের পরিধি বাড়ছে",
      summary:
        "কেন্দ্রটি এখন সরকারি ব্যাংক ও বন্দরের নেটওয়ার্কও নজরে রাখবে। আগামী মাস থেকে চব্বিশ ঘণ্টার একটি হটলাইন চালু হবে।",
      imageAlt: "অন্ধকার ঘরে কয়েকটি কম্পিউটার পর্দা",
    },
    en: {
      title: "National cyber response centre expands its remit",
      summary:
        "The centre will also watch the networks of state banks and ports. A round-the-clock hotline starts next month.",
      imageAlt: "Several computer screens in a dark room",
    },
  },
  {
    id: "fishing-boat-trackers",
    format: "news",
    category: "security",
    publishedAt: at("10-06 13:00"),
    readingMinutes: 3,
    bn: { title: "সমুদ্রে মাছ ধরার নৌকায় স্যাটেলাইট ট্র্যাকার বাধ্যতামূলক" },
    en: { title: "Satellite trackers made compulsory on sea fishing boats" },
  },
  {
    id: "hill-road-security-posts",
    format: "news",
    category: "security",
    publishedAt: at("10-06 11:00"),
    readingMinutes: 5,
    bn: {
      // Long Bangla headline with no image.
      title:
        "পার্বত্য অঞ্চলে সড়ক নির্মাণের সঙ্গে নিরাপত্তা চৌকি সরানোর পরিকল্পনা নিয়ে স্থানীয় জনপ্রতিনিধি ও প্রশাসনের মধ্যে আলোচনা চলছে, সিদ্ধান্ত আসতে পারে আগামী মাসে",
    },
    en: {
      title:
        "Local leaders and officials discuss moving security posts as hill roads are built",
    },
  },

  // Grouped: ইতিহাস ও প্রেক্ষাপট
  {
    id: "old-dhaka-trade-ledgers",
    format: "news",
    category: "history",
    publishedAt: at("10-06 16:30"),
    readingMinutes: 5,
    image: "classic",
    bn: {
      title: "পুরান ঢাকার এক বাড়িতে মিলল উনিশ শতকের বাণিজ্যের খাতা",
      summary:
        "খাতাগুলোতে নদীপথে পাট ও মসলার লেনদেনের হিসাব আছে। গবেষকেরা সেগুলো সংরক্ষণ ও ডিজিটাল করার পরিকল্পনা করছেন।",
      imageAlt: "টেবিলে খুলে রাখা পুরোনো হাতে লেখা খাতা",
    },
    en: {
      title: "Nineteenth-century trade ledgers found in an Old Dhaka house",
      summary:
        "The books record river trade in jute and spices. Researchers plan to conserve and digitise them.",
      imageAlt: "An old handwritten ledger open on a table",
    },
  },
  {
    id: "southern-silk-route",
    format: "explainer",
    category: "history",
    publishedAt: at("10-06 10:00"),
    readingMinutes: 8,
    bn: {
      title: "রেশম পথের দক্ষিণ শাখা: বাংলার বন্দর যেভাবে বিশ্বকে যুক্ত করেছিল",
    },
    en: {
      title: "The southern silk route: how Bengal's ports linked the world",
    },
  },
  {
    id: "partition-oral-history",
    format: "news",
    category: "history",
    publishedAt: at("10-05 18:00"),
    readingMinutes: 4,
    bn: { title: "দেশভাগের স্মৃতি সংরক্ষণে মৌখিক ইতিহাস প্রকল্প" },
    en: { title: "Oral history project records memories of Partition" },
  },

  // Grouped: অর্থনীতি ও বাণিজ্য
  {
    id: "garment-latin-america",
    format: "news",
    category: "economy",
    publishedAt: at("10-07 06:30"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title: "পোশাক খাতে নতুন বাজার খুঁজতে লাতিন আমেরিকায় বাণিজ্য মিশন",
      summary:
        "ব্যবসায়ীরা প্রথমবার ব্রাজিল ও চিলির ক্রেতাদের সঙ্গে সরাসরি বৈঠক করবেন। লক্ষ্য ইউরোপ ও যুক্তরাষ্ট্রের বাইরে রপ্তানি বাড়ানো।",
      imageAlt: "পোশাক কারখানায় সেলাই মেশিনের সারি",
    },
    en: {
      title:
        "Garment sector sends trade mission to Latin America to find new markets",
      summary:
        "Exporters will meet buyers in Brazil and Chile directly for the first time. The aim is to grow sales beyond Europe and the United States.",
      imageAlt: "Rows of sewing machines in a garment factory",
    },
  },
  {
    id: "inflation-third-month",
    format: "news",
    category: "economy",
    publishedAt: at("10-06 20:30"),
    readingMinutes: 3,
    bn: { title: "মূল্যস্ফীতি টানা তিন মাস কমেছে, খাদ্যপণ্যে চাপ রয়ে গেছে" },
    en: {
      title: "Inflation falls for a third month, but food prices stay high",
    },
  },
  {
    id: "remittance-digital-channel",
    format: "news",
    category: "economy",
    publishedAt: at("10-06 12:40"),
    readingMinutes: 3,
    bn: { title: "প্রবাসী আয় পাঠাতে নতুন ডিজিটাল চ্যানেল, কমবে খরচ" },
    en: { title: "New digital channel to cut the cost of sending remittances" },
  },

  // Grouped: প্রযুক্তি ও কৌশলগত শক্তি
  {
    id: "farm-drone-tests",
    format: "news",
    category: "technology",
    publishedAt: at("10-06 15:40"),
    readingMinutes: 4,
    image: "classic",
    bn: {
      title: "দেশে তৈরি প্রথম কৃষি ড্রোন পরীক্ষায় সফল",
      summary:
        "ড্রোনটি এক ঘণ্টায় পাঁচ একর জমিতে সার ছিটাতে পারে। পরের ধাপে কৃষকদের হাতে ভাড়ায় দেওয়ার পরীক্ষা হবে।",
      imageAlt: "ধানক্ষেতের ওপর উড়ন্ত একটি ড্রোন",
    },
    en: {
      title: "First locally built farm drone passes its tests",
      summary:
        "The drone can spray five acres of fertiliser in an hour. The next step is a trial of renting it to farmers.",
      imageAlt: "A drone flying over a rice field",
    },
  },
  {
    id: "ai-policy-draft",
    format: "news",
    category: "technology",
    publishedAt: at("10-06 11:30"),
    readingMinutes: 3,
    bn: { title: "কৃত্রিম বুদ্ধিমত্তা নীতিমালার খসড়ায় মতামত চাইল সরকার" },
    en: { title: "Government asks for comments on draft AI policy" },
  },
  {
    id: "char-satellite-internet",
    format: "news",
    category: "technology",
    publishedAt: at("10-05 17:00"),
    readingMinutes: 4,
    bn: { title: "দুর্গম চরে স্যাটেলাইট ইন্টারনেটের পরীক্ষামূলক সংযোগ" },
    en: { title: "Satellite internet reaches remote river islands in a trial" },
  },

  // Regions. চীন is a region, not a category (DR-19). Africa has no stories.
  {
    id: "china-renewables-understanding",
    format: "news",
    category: "economy",
    region: "china",
    publishedAt: at("10-07 05:00"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title: "চীনের সঙ্গে নবায়নযোগ্য জ্বালানি প্রকল্পে নতুন সমঝোতা",
      imageAlt: "খোলা মাঠে সৌরবিদ্যুতের প্যানেল",
    },
    en: {
      title: "New understanding with China on renewable energy projects",
      imageAlt: "Solar panels in an open field",
    },
  },
  {
    id: "china-scholarships",
    format: "news",
    category: "geopolitics",
    region: "china",
    publishedAt: at("10-06 14:00"),
    readingMinutes: 3,
    bn: { title: "চীনা বিশ্ববিদ্যালয়ে বাংলাদেশি শিক্ষার্থীদের বৃত্তি বাড়ছে" },
    en: {
      title:
        "More scholarships for Bangladeshi students at Chinese universities",
    },
  },
  {
    id: "kunming-trade-fair",
    format: "news",
    category: "economy",
    region: "china",
    publishedAt: at("10-05 16:00"),
    readingMinutes: 3,
    bn: { title: "চীনের এক আঞ্চলিক বাণিজ্য মেলায় বাংলাদেশি প্যাভিলিয়ন" },
    en: { title: "A Bangladeshi pavilion at a regional trade fair in China" },
  },
  {
    id: "india-land-port-clearance",
    format: "news",
    category: "geopolitics",
    region: "india",
    publishedAt: at("10-07 04:30"),
    readingMinutes: 4,
    image: "classic",
    bn: {
      title: "স্থলবন্দরে পণ্য খালাসের সময় কমাতে যৌথ ডিজিটাল ব্যবস্থা",
      imageAlt: "স্থলবন্দরে সারি বেঁধে দাঁড়ানো ট্রাক",
    },
    en: {
      title: "Joint digital system to cut clearance times at land ports",
      imageAlt: "Trucks queued at a land port",
    },
  },
  {
    id: "india-border-markets",
    format: "news",
    category: "economy",
    region: "india",
    publishedAt: at("10-06 10:30"),
    readingMinutes: 3,
    bn: { title: "সীমান্ত হাটের সংখ্যা বাড়ানোর প্রস্তাব" },
    en: { title: "Proposal to open more border markets" },
  },
  {
    id: "myanmar-river-trade",
    format: "news",
    category: "economy",
    region: "myanmar",
    publishedAt: at("10-06 19:00"),
    readingMinutes: 4,
    bn: { title: "মিয়ানমার সীমান্তে নৌপথে বাণিজ্য আবার শুরুর উদ্যোগ" },
    en: { title: "Move to restart river trade on the Myanmar border" },
  },
  {
    id: "myanmar-refugee-research",
    format: "analysis",
    category: "security",
    region: "myanmar",
    publishedAt: at("10-05 12:00"),
    readingMinutes: 7,
    bn: { title: "আঞ্চলিক শরণার্থী পরিস্থিতি নিয়ে নতুন গবেষণা প্রতিবেদন" },
    en: { title: "New research report on the regional refugee situation" },
  },
  {
    id: "gulf-skilled-workers",
    format: "news",
    category: "economy",
    region: "middle-east",
    publishedAt: at("10-06 17:00"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title: "উপসাগরীয় দেশে দক্ষ কর্মী পাঠাতে নতুন প্রশিক্ষণকেন্দ্র",
      imageAlt: "প্রশিক্ষণকেন্দ্রে যন্ত্র নিয়ে কাজ শিখছেন কয়েকজন",
    },
    en: {
      title: "New training centres to send skilled workers to the Gulf",
      imageAlt: "Trainees learning to use machines at a training centre",
    },
  },
  {
    id: "middle-east-energy-prices",
    format: "news",
    category: "economy",
    region: "middle-east",
    publishedAt: at("10-05 20:00"),
    readingMinutes: 3,
    bn: { title: "মধ্যপ্রাচ্যে জ্বালানির দামে ওঠানামা, সতর্ক আমদানিকারকেরা" },
    en: {
      title:
        "Energy prices swing in the Middle East, and importers grow cautious",
    },
  },
  {
    id: "southeast-asia-trade-talks",
    format: "news",
    category: "economy",
    region: "southeast-asia",
    publishedAt: at("10-06 09:00"),
    readingMinutes: 4,
    image: "classic",
    bn: {
      title:
        "দক্ষিণ-পূর্ব এশিয়ার অংশীদারদের সঙ্গে মুক্ত বাণিজ্য আলোচনার প্রথম দফা",
      imageAlt: "বৈঠকের টেবিলে রাখা নথি ও নামফলক",
    },
    en: {
      title: "First round of free-trade talks with Southeast Asian partners",
      imageAlt: "Papers and name cards on a meeting table",
    },
  },
  {
    id: "thailand-tourism-circuit",
    format: "news",
    category: "economy",
    region: "southeast-asia",
    publishedAt: at("10-05 11:00"),
    readingMinutes: 3,
    bn: { title: "থাইল্যান্ড হয়ে পর্যটন সার্কিট চালুর পরিকল্পনা" },
    en: { title: "Plan for a tourism circuit through Thailand" },
  },
  {
    id: "europe-labour-law",
    format: "news",
    category: "economy",
    region: "europe",
    publishedAt: at("10-06 08:00"),
    readingMinutes: 5,
    image: "photo",
    bn: {
      title: "ইউরোপের বাজারে শুল্কমুক্ত সুবিধা ধরে রাখতে শ্রম আইনে সংশোধন",
      imageAlt: "কারখানার বাইরে কাজ শেষে বের হওয়া শ্রমিকেরা",
    },
    en: {
      title:
        "Labour law changes aim to keep duty-free access to European markets",
      imageAlt: "Workers leaving a factory after a shift",
    },
  },
  {
    id: "germany-nurses-pilot",
    format: "news",
    category: "economy",
    region: "europe",
    publishedAt: at("10-05 15:00"),
    readingMinutes: 3,
    bn: { title: "জার্মানিতে নার্স পাঠানোর পাইলট কর্মসূচি" },
    en: { title: "Pilot programme to send nurses to Germany" },
  },
];
