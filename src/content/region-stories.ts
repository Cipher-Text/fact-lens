// Mock stories for the region hub (`/regions`, page/regions brief): every region except
// Oceania gets 4 or more stories, so its CategoryBlock has a feature story and a list.
// Oceania stays empty on purpose: a region with no stories is not shown (layout 7.3,
// mock-content skill). Fictional but realistic: no real people, no quotes, no real events.
import type { StoryDef } from "./stories";

/** Time in Dhaka: at("10-06 08:30") is 6 October 2026, 08:30 +06:00. */
function at(monthDayTime: string): string {
  const [monthDay, time] = monthDayTime.split(" ");
  return `2026-${monthDay}T${time}:00+06:00`;
}

export const regionStories: StoryDef[] = [
  // Russia: 2 news with an image, 1 analysis, 1 news without an image.
  {
    id: "r8wq2kd",
    slug: "russia-wheat-shipping-schedule",
    format: "news",
    category: "economy",
    regions: ["russia"],
    publishedAt: at("10-06 18:20"),
    readingMinutes: 4,
    image: "photo",
    bn: {
      title:
        "রাশিয়া থেকে গম আমদানিতে নতুন জাহাজসূচি, বন্দরে খালাসের সময় কমার আশা",
      summary:
        "আমদানিকারকেরা জানান, মাসে দুটি নির্ধারিত চালান এলে গুদাম ও পরিবহনের পরিকল্পনা আগেভাগে করা যাবে।",
      imageAlt: "বন্দরের জেটিতে বাঁধা একটি মালবাহী জাহাজ",
    },
    en: {
      title:
        "New shipping schedule for wheat imports from Russia aims to cut port clearance time",
      summary:
        "Importers say two scheduled shipments a month would let them plan storage and transport ahead.",
      imageAlt: "A cargo ship moored at a port jetty",
    },
  },
  {
    id: "r3pv7nx",
    slug: "russia-arctic-route-analysis",
    format: "analysis",
    category: "geopolitics",
    regions: ["russia", "asia"],
    publishedAt: at("10-06 11:10"),
    readingMinutes: 8,
    image: "wide",
    author: "rashed-hossain",
    bn: {
      title:
        "উত্তরের সমুদ্রপথ কি এশিয়ার বাণিজ্যের হিসাব বদলাবে? খরচ, ঝুঁকি ও সময়ের তুলনা",
      summary:
        "বরফ গলার মৌসুমে পথটি ছোট হলেও বিমা, বন্দর সুবিধা ও নিরাপত্তার খরচ এখনো বড় বাধা।",
      imageAlt: "বরফে ঢাকা সমুদ্রে চলমান একটি জাহাজ",
    },
    en: {
      title:
        "Will the northern sea route change the sums of Asian trade? Cost, risk and time compared",
      summary:
        "The route is shorter in the thaw season, but insurance, port services and security costs remain large hurdles.",
      imageAlt: "A ship moving through an icy sea",
    },
  },
  {
    id: "r6bt4hm",
    slug: "russia-student-visa-desk",
    format: "news",
    category: "geopolitics",
    regions: ["russia"],
    publishedAt: at("10-05 13:40"),
    readingMinutes: 3,
    image: "classic",
    bn: {
      title: "রুশ বিশ্ববিদ্যালয়ে ভর্তির আবেদনে ঢাকায় আলাদা ভিসা ডেস্ক",
      imageAlt: "ভিসা অফিসের সামনে অপেক্ষারত শিক্ষার্থীরা",
    },
    en: {
      title: "Separate visa desk in Dhaka for Russian university applicants",
      imageAlt: "Students waiting outside a visa office",
    },
  },
  {
    id: "r9kc1zs",
    slug: "russia-fertiliser-payment-talks",
    format: "news",
    category: "economy",
    regions: ["russia"],
    publishedAt: at("10-04 16:00"),
    readingMinutes: 3,
    bn: { title: "সার আমদানির মূল্য পরিশোধে বিকল্প পদ্ধতি নিয়ে আলোচনা" },
    en: { title: "Talks on another way to pay for fertiliser imports" },
  },
  // Americas: the fourth story, an analysis with an image.
  {
    id: "a2mf8qw",
    slug: "americas-nearshoring-analysis",
    format: "analysis",
    category: "economy",
    regions: ["americas"],
    publishedAt: at("10-06 20:15"),
    readingMinutes: 7,
    image: "photo",
    author: "mehnaz-chowdhury",
    bn: {
      title:
        "কাছের দেশে উৎপাদন সরানোর ঢেউ: আমেরিকার ক্রেতাদের নতুন হিসাবে বাংলাদেশের জায়গা কোথায়",
      summary:
        "দাম আর সময়ের প্রতিযোগিতায় টিকতে হলে কাঁচামাল আমদানি থেকে জাহাজীকরণ পর্যন্ত দিন কমাতে হবে।",
      imageAlt: "কনটেইনার ইয়ার্ডে সারি করে রাখা কনটেইনার",
    },
    en: {
      title:
        "The nearshoring wave: where Bangladesh fits in the new sums of buyers in the Americas",
      summary:
        "To compete on price and time, the days from raw material import to shipment must come down.",
      imageAlt: "Containers stacked in rows at a container yard",
    },
  },
  // Middle East: the fourth story, news with an image.
  {
    id: "m5hx3ty",
    slug: "gulf-hospital-staff-training",
    format: "news",
    category: "economy",
    regions: ["middle-east"],
    publishedAt: at("10-06 15:30"),
    readingMinutes: 4,
    image: "classic",
    bn: {
      title:
        "উপসাগরীয় দেশের হাসপাতালে কাজের জন্য সেবাকর্মীদের ছয় মাসের প্রশিক্ষণ",
      summary:
        "প্রশিক্ষণ শেষে ভাষা ও দক্ষতার সনদ পেলে নিয়োগের প্রক্রিয়া দ্রুত হবে বলে জানিয়েছে প্রশিক্ষণ কেন্দ্র।",
      imageAlt: "প্রশিক্ষণ কক্ষে সেবাকর্মীদের একটি দল",
    },
    en: {
      title: "Six-month training for care workers bound for Gulf hospitals",
      summary:
        "The training centre says a language and skills certificate at the end will speed up hiring.",
      imageAlt: "A group of care workers in a training room",
    },
  },
];
