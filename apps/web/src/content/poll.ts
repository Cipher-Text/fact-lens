// Daily poll for the P-3 rail. Mock data with mock starting counts.
export const dailyPoll = {
  id: "bay-cooperation-priority",
  bn: {
    question:
      "বঙ্গোপসাগরে আঞ্চলিক সহযোগিতায় সবচেয়ে বড় অগ্রাধিকার কী হওয়া উচিত?",
    options: {
      trade: "বাণিজ্য ও বন্দর",
      climate: "জলবায়ু ও দুর্যোগ",
      maritime: "সমুদ্র নিরাপত্তা",
      fisheries: "মৎস্যসম্পদ",
    },
  },
  en: {
    question:
      "What should be the top priority for regional cooperation in the Bay of Bengal?",
    options: {
      trade: "Trade and ports",
      climate: "Climate and disasters",
      maritime: "Maritime security",
      fisheries: "Fisheries",
    },
  },
  votes: { trade: 412, climate: 538, maritime: 267, fisheries: 183 },
} as const;
