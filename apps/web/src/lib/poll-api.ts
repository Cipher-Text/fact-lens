import type { Lang, Poll } from "@/content";

/** The API's language codes for the site's two languages. */
export const apiLocale: Record<Lang, string> = { bn: "bn-BD", en: "en" };

/** The cookie the API gives a browser that voted. It is the API's, relayed on this site's own domain. */
export const VOTER_COOKIE = "fl_voter";
const VOTER_TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** The API address, or null when the site runs on mock data (the default, DR-01). */
export function apiBase(): string | null {
  const base = process.env.FACTLENS_API_URL?.trim().replace(/\/+$/, "");
  return base || null;
}

/** A voter token that looks like ours; anything else is dropped before it is forwarded. */
export const cleanVoterToken = (value: string | undefined | null) =>
  value && VOTER_TOKEN.test(value) ? value : null;

type ApiPoll = {
  id: string;
  question: string;
  open: boolean;
  myVote: string | null;
  options: { id: string; label: string; votes: number }[];
};

/** Reads an API poll (never trusts the network): returns null for anything that is not a usable poll. */
export function toPoll(data: unknown, lang: Lang): Poll | null {
  const p = data as Partial<ApiPoll> | null;
  if (
    !p ||
    typeof p.id !== "string" ||
    typeof p.question !== "string" ||
    typeof p.open !== "boolean" ||
    !Array.isArray(p.options) ||
    p.options.length < 2 ||
    p.options.length > 4
  ) {
    return null;
  }
  const options = p.options.flatMap((o) =>
    o &&
    typeof o.id === "string" &&
    typeof o.label === "string" &&
    Number.isInteger(o.votes) &&
    o.votes >= 0
      ? [{ id: o.id, label: o.label, votes: o.votes }]
      : [],
  );
  if (options.length !== p.options.length) return null;
  const myVote =
    typeof p.myVote === "string" && options.some((o) => o.id === p.myVote)
      ? p.myVote
      : null;
  return { id: p.id, lang, question: p.question, options, live: { open: p.open, myVote } };
}

/**
 * The poll the newsroom put on the homepage, in the page language, with this browser's own vote.
 * Null when the API is not set up, has no featured poll, or cannot be reached: the page then
 * keeps its mock poll. Never throws.
 */
export async function fetchFeaturedPoll(
  lang: Lang,
  voterToken?: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<Poll | null> {
  const base = apiBase();
  if (!base) return null;
  const token = cleanVoterToken(voterToken);
  try {
    const res = await fetchImpl(`${base}/public/polls/featured/${encodeURIComponent(apiLocale[lang])}`, {
      cache: "no-store",
      headers: token ? { cookie: `${VOTER_COOKIE}=${token}` } : undefined,
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    return toPoll(await res.json(), lang);
  } catch {
    return null;
  }
}
