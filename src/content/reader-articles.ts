// Full article text for the wild card reader page (page/article-parallel).
// The entry adds a body, key points and an optional context to a story in
// stories.ts, so the homepage lead story opens a real article. This run builds
// one article page; more entries here would add more pages.
// Fictional but realistic: no real people and no real events.

import type { imageFiles } from "./stories";

/** A placeholder image file from stories.ts (16:9, 3:2 or 4:3). */
export type ImageFile = keyof typeof imageFiles;

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; id: string; text: string }
  | { type: "figure"; image: ImageFile; caption: string; credit: string }
  | { type: "list"; items: string[] };

/** The optional news context: short one-liners in one column. Only `why` is required. */
export interface ArticleContext {
  teaser: string;
  why: string;
  background?: string;
  timeline?: { date: string; text: string }[];
}

export interface ArticleText {
  /** Replaces the story summary, or gives one when the story has none. */
  summary?: string;
  dateline?: string;
  caption: string;
  credit: string;
  keyPoints?: string[];
  body: Block[];
  context?: ArticleContext;
  tags: string[];
  updates?: { at: string; text: string }[];
  authorRole: string;
  authorBio: string;
}

export interface ArticleDef {
  id: string; // a story id in stories.ts
  author:
    "farhana-kabir" | "tanvir-ahmed" | "rashed-hossain" | "mehnaz-chowdhury";
  updatedAt?: string;
  bn: ArticleText;
  en: ArticleText;
}

/** Time in Dhaka: at("10-07 08:30") is 7 October 2026, 08:30 +06:00. */
function at(monthDayTime: string): string {
  const [monthDay, time] = monthDayTime.split(" ");
  return `2026-${monthDay}T${time}:00+06:00`;
}

export const articleDefs: ArticleDef[] = [
  {
    id: "river-data-framework",
    author: "rashed-hossain",
    updatedAt: at("10-07 13:40"),
    en: {
      dateline: "Dhaka",
      caption:
        "Readings from gauge stations upstream would reach forecasters in all four countries within hours.",
      credit: "Photo: Fact Lens",
      keyPoints: [
        "Flow and rainfall data would be shared every six hours in the flood season, and once a day in the dry months.",
        "More than 120 gauge stations on the main rivers and their tributaries would feed one shared platform.",
        "Each cabinet must approve the draft; a test link could start early next year.",
      ],
      body: [
        {
          type: "p",
          text: "Officials from four countries that share the region's largest rivers have agreed a draft framework to exchange river flow and rainfall data every six hours, with the aim of having the system running before the next monsoon.",
        },
        {
          type: "p",
          text: "The draft was settled on Tuesday evening after two days of technical talks in Dhaka, attended by delegates from the water ministries and weather services of all four countries. Each government's cabinet must still approve the text before it can be signed.",
        },
        {
          type: "p",
          text: "Under the plan, gauge stations on the main rivers and their larger tributaries would send readings to a shared data platform. Forecasters in each country could then see water rising upstream hours, and sometimes days, earlier than they can today.",
        },
        { type: "h2", id: "what-it-covers", text: "What the framework covers" },
        {
          type: "p",
          text: "The draft lists three kinds of data: water levels at gauge stations, the volume of water flowing past them, and rainfall in the upper catchment areas. From June to October, readings would be shared every six hours. In the dry months, the interval would be once a day.",
        },
        {
          type: "p",
          text: "Officials stressed that the framework deals only with information. It does not touch how water is shared between the countries, which remains the most sensitive question in the region, and the text says so in its first article.",
        },
        { type: "h2", id: "why-six-hours", text: "Why six hours matters" },
        {
          type: "p",
          text: "For families along the rivers, the gap between a daily reading and one every six hours can decide whether there is time to move cattle, harvest a field early or reach a shelter. In the hill-fed rivers of the north-east, water can rise within a single night.",
        },
        {
          type: "p",
          text: "Hydrologists at the talks described the six-hour interval as a compromise. Some delegations had asked for hourly data in the peak weeks of the monsoon, but not every station upstream can yet send its readings automatically.",
        },
        {
          type: "figure",
          image: "photo",
          caption:
            "Automatic gauge stations send water levels over the mobile network; older stations are still read by hand twice a day.",
          credit: "Photo: Fact Lens",
        },
        {
          type: "p",
          text: "The platform would also keep a shared archive. Engineers say that a common record of past floods, in one format, would help each country plan embankments and drainage with the same numbers in front of them.",
        },
        { type: "h2", id: "what-next", text: "What happens next" },
        {
          type: "p",
          text: "The draft now goes to the four cabinets. If they approve it in the coming weeks, technical teams plan to test the data link with a first group of stations early next year, and to connect the full network by May.",
        },
        {
          type: "list",
          items: [
            "Cabinet approval in each of the four countries",
            "A test link with a first group of stations, early next year",
            "The full network connected before the monsoon, by May",
          ],
        },
        {
          type: "p",
          text: "A joint technical committee would review the system after its first flood season and could shorten the interval wherever the stations allow.",
        },
      ],
      context: {
        teaser: "New to this story? The background in brief.",
        why: "Most of Bangladesh's river water comes from upstream, so earlier data means earlier flood warnings.",
        background:
          "The four countries share some data today, but late, in different formats and often once a day.",
        timeline: [
          {
            date: "2019",
            text: "A shared flood-data platform is first proposed.",
          },
          { date: "Oct 2026", text: "Draft framework agreed in Dhaka." },
          { date: "May 2027", text: "Target to connect the full network." },
        ],
      },
      tags: ["Rivers", "Monsoon", "Flood forecasting", "Regional cooperation"],
      updates: [
        {
          at: at("10-07 13:40"),
          text: "Added the dry-season data interval and the plan for a shared archive.",
        },
      ],
      authorRole: "Environment correspondent",
      authorBio:
        "Rashed Hossain reports on rivers, climate and disaster planning from Dhaka.",
    },
    bn: {
      dateline: "ঢাকা",
      caption:
        "উজানের পানি পরিমাপ কেন্দ্রের তথ্য কয়েক ঘণ্টার মধ্যেই চার দেশের পূর্বাভাসকর্মীদের কাছে পৌঁছাবে।",
      credit: "ছবি: ফ্যাক্ট লেন্স",
      keyPoints: [
        "বন্যার মৌসুমে প্রতি ছয় ঘণ্টায় এবং শুষ্ক মৌসুমে দিনে একবার পানিপ্রবাহ ও বৃষ্টিপাতের তথ্য ভাগ করা হবে।",
        "প্রধান নদী ও উপনদীর ১২০টির বেশি পরিমাপ কেন্দ্র একটি অভিন্ন প্ল্যাটফর্মে তথ্য পাঠাবে।",
        "প্রতিটি দেশের মন্ত্রিসভার অনুমোদন লাগবে; আগামী বছরের শুরুতে পরীক্ষামূলক সংযোগ চালু হতে পারে।",
      ],
      body: [
        {
          type: "p",
          text: "অঞ্চলের বড় নদীগুলো যে চার দেশের ভেতর দিয়ে বয়ে গেছে, তাদের কর্মকর্তারা প্রতি ছয় ঘণ্টায় পানিপ্রবাহ ও বৃষ্টিপাতের তথ্য বিনিময়ের একটি খসড়া কাঠামোতে একমত হয়েছেন। লক্ষ্য, আগামী বর্ষার আগেই ব্যবস্থাটি চালু করা।",
        },
        {
          type: "p",
          text: "ঢাকায় দুই দিনের কারিগরি বৈঠক শেষে মঙ্গলবার সন্ধ্যায় খসড়াটি চূড়ান্ত হয়। চার দেশের পানিসম্পদ মন্ত্রণালয় ও আবহাওয়া দপ্তরের প্রতিনিধিরা এতে অংশ নেন। সই হওয়ার আগে প্রতিটি দেশের মন্ত্রিসভাকে খসড়াটি অনুমোদন করতে হবে।",
        },
        {
          type: "p",
          text: "পরিকল্পনা অনুযায়ী, প্রধান নদী ও বড় উপনদীগুলোর পানি পরিমাপ কেন্দ্র একটি অভিন্ন তথ্য প্ল্যাটফর্মে নিয়মিত তথ্য পাঠাবে। এতে প্রতিটি দেশের পূর্বাভাসকর্মীরা উজানে পানি বাড়ার খবর এখনকার চেয়ে কয়েক ঘণ্টা, কখনো কয়েক দিন আগেই পাবেন।",
        },
        { type: "h2", id: "what-it-covers", text: "কাঠামোতে কী আছে" },
        {
          type: "p",
          text: "খসড়ায় তিন ধরনের তথ্যের কথা বলা হয়েছে: পরিমাপ কেন্দ্রে পানির উচ্চতা, সেখান দিয়ে বয়ে যাওয়া পানির পরিমাণ এবং উজানের অববাহিকায় বৃষ্টিপাত। জুন থেকে অক্টোবর পর্যন্ত প্রতি ছয় ঘণ্টায় তথ্য ভাগ করা হবে। শুষ্ক মৌসুমে দিনে একবার।",
        },
        {
          type: "p",
          text: "কর্মকর্তারা জোর দিয়ে বলেছেন, এই কাঠামো কেবল তথ্য নিয়ে। দেশগুলোর মধ্যে পানি বণ্টনের প্রশ্ন, যা অঞ্চলের সবচেয়ে স্পর্শকাতর বিষয়, এতে নেই। খসড়ার প্রথম অনুচ্ছেদেই তা স্পষ্ট করে লেখা আছে।",
        },
        { type: "h2", id: "why-six-hours", text: "ছয় ঘণ্টা কেন গুরুত্বপূর্ণ" },
        {
          type: "p",
          text: "নদীতীরের পরিবারগুলোর জন্য দিনে একবারের তথ্য আর ছয় ঘণ্টা পরপর তথ্যের পার্থক্যই ঠিক করে দিতে পারে, গবাদিপশু সরানো, আগেভাগে ফসল কাটা বা আশ্রয়কেন্দ্রে পৌঁছানোর সময় মিলবে কি না। উত্তর-পূর্বের পাহাড়ি নদীতে এক রাতেই পানি বেড়ে যেতে পারে।",
        },
        {
          type: "p",
          text: "বৈঠকে অংশ নেওয়া পানিবিজ্ঞানীরা ছয় ঘণ্টার বিরতিকে একটি আপস হিসেবে দেখছেন। বর্ষার সবচেয়ে ঝুঁকির সপ্তাহগুলোতে কয়েকটি প্রতিনিধিদল ঘণ্টায় ঘণ্টায় তথ্য চেয়েছিল, কিন্তু উজানের সব কেন্দ্র এখনো স্বয়ংক্রিয়ভাবে তথ্য পাঠাতে পারে না।",
        },
        {
          type: "figure",
          image: "photo",
          caption:
            "স্বয়ংক্রিয় কেন্দ্রগুলো মোবাইল নেটওয়ার্কে পানির উচ্চতা পাঠায়; পুরোনো কেন্দ্রগুলোতে এখনো দিনে দুবার হাতে মাপা হয়।",
          credit: "ছবি: ফ্যাক্ট লেন্স",
        },
        {
          type: "p",
          text: "প্ল্যাটফর্মে একটি অভিন্ন সংরক্ষণাগারও থাকবে। প্রকৌশলীরা বলছেন, অতীতের বন্যার একই ধাঁচের একটি রেকর্ড থাকলে প্রতিটি দেশ একই সংখ্যা সামনে রেখে বাঁধ ও নিষ্কাশনের পরিকল্পনা করতে পারবে।",
        },
        { type: "h2", id: "what-next", text: "এরপর কী" },
        {
          type: "p",
          text: "খসড়াটি এখন চার দেশের মন্ত্রিসভায় যাবে। আগামী কয়েক সপ্তাহের মধ্যে অনুমোদন মিললে কারিগরি দলগুলো আগামী বছরের শুরুতে প্রথম কয়েকটি কেন্দ্র নিয়ে পরীক্ষামূলক সংযোগ চালাবে এবং মের মধ্যে পুরো নেটওয়ার্ক যুক্ত করবে।",
        },
        {
          type: "list",
          items: [
            "চার দেশের মন্ত্রিসভার অনুমোদন",
            "আগামী বছরের শুরুতে প্রথম কয়েকটি কেন্দ্র নিয়ে পরীক্ষামূলক সংযোগ",
            "বর্ষার আগে, মের মধ্যে, পুরো নেটওয়ার্ক যুক্ত করা",
          ],
        },
        {
          type: "p",
          text: "প্রথম বন্যা মৌসুম শেষে একটি যৌথ কারিগরি কমিটি ব্যবস্থাটি পর্যালোচনা করবে এবং যেসব কেন্দ্রে সম্ভব, সেখানে বিরতি আরও কমাতে পারবে।",
        },
      ],
      context: {
        teaser: "খবরটি নতুন লাগছে? সংক্ষেপে প্রেক্ষাপট।",
        why: "বাংলাদেশের নদীর বেশির ভাগ পানি আসে উজান থেকে, তাই আগের তথ্য মানে আগাম বন্যা সতর্কতা।",
        background:
          "চার দেশ এখনো কিছু তথ্য বিনিময় করে, তবে দেরিতে, ভিন্ন ধাঁচে এবং প্রায়ই দিনে একবার।",
        timeline: [
          {
            date: "২০১৯",
            text: "অভিন্ন বন্যা-তথ্য প্ল্যাটফর্মের প্রথম প্রস্তাব।",
          },
          { date: "অক্টোবর ২০২৬", text: "ঢাকায় খসড়া কাঠামোতে সম্মতি।" },
          { date: "মে ২০২৭", text: "পুরো নেটওয়ার্ক যুক্ত করার লক্ষ্য।" },
        ],
      },
      tags: ["নদী", "বর্ষা", "বন্যার পূর্বাভাস", "আঞ্চলিক সহযোগিতা"],
      updates: [
        {
          at: at("10-07 13:40"),
          text: "শুষ্ক মৌসুমের তথ্য বিরতি ও অভিন্ন সংরক্ষণাগারের পরিকল্পনা যোগ করা হয়েছে।",
        },
      ],
      authorRole: "পরিবেশ বিষয়ক প্রতিবেদক",
      authorBio:
        "রাশেদ হোসেন ঢাকা থেকে নদী, জলবায়ু ও দুর্যোগ প্রস্তুতি নিয়ে লেখেন।",
    },
  },
];

/** Other stories for the Read next row. Only the article above has full text. */
export const readNextIds: string[] = [
  "deep-sea-port-trial-ship",
  "small-state-balancing",
  "opinion-connectivity-not-port",
];
