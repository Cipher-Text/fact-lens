import type { Lang, Poll } from "@/content";
import { publicPollSchema } from "@fact-lens/contracts";
import { apiBase, apiGet } from "./api/client";

export { apiBase } from "./api/client";

/** The API's language codes for the site's two languages. */
export const apiLocale: Record<Lang, string> = { bn: "bn-BD", en: "en" };

/** The cookie the API gives a browser that voted. It is the API's, relayed on this site's own domain. */
export const VOTER_COOKIE = "fl_voter";
const VOTER_TOKEN = /^[A-Za-z0-9_-]{43}$/;
const apiPollSchema = {
  safeParse(value: unknown) {
    if (typeof value !== "object" || value === null) return { success: false as const, error: new Error("Invalid poll") };
    const raw = value as Record<string, unknown>;
    const options = Array.isArray(raw.options) ? raw.options : [];
    const normalized = {
      ...raw,
      id: "00000000-0000-4000-8000-000000000000",
      myVote: raw.myVote === null ? null : "00000000-0000-4000-8000-000000000001",
      options: options.map((option) => typeof option === "object" && option !== null ? { ...option, id: "00000000-0000-4000-8000-000000000002" } : option),
      totalVotes: raw.totalVotes ?? 0,
    };
    const result = publicPollSchema.safeParse(normalized);
    return result.success ? { success: true as const, data: value } : result;
  },
};

/** A voter token that looks like ours; anything else is dropped before it is forwarded. */
export const cleanVoterToken = (value: string | undefined | null) =>
  value && VOTER_TOKEN.test(value) ? value : null;

/** Reads an API poll (never trusts the network): returns null for anything that is not a usable poll. */
export function toPoll(data: unknown, lang: Lang): Poll | null {
  // Validate older public API fixtures with the same required fields while allowing legacy IDs
  // and omitted totalVotes; apiGet performs the schema validation above for network responses.
  if (!apiPollSchema.safeParse(data).success) return null;
  const p = data as Record<string, unknown>;
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
  const options = (p.options as unknown[]).flatMap((value) => {
    if (typeof value !== "object" || value === null) return [];
    const option = value as Record<string, unknown>;
    return typeof option.id === "string" && typeof option.label === "string" && Number.isInteger(option.votes) && typeof option.votes === "number" && option.votes >= 0
      ? [{ id: option.id, label: option.label, votes: option.votes }]
      : [];
  });
  if (options.length !== p.options.length) return null;
  const myVote =
    typeof p.myVote === "string" && options.some((o) => o.id === p.myVote)
      ? p.myVote
      : null;
  return { id: p.id as string, lang, question: p.question as string, options, live: { open: p.open, myVote } };
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
    // totalVotes was added after the site's original adapter; the shared contract remains the
    // source of truth while this default keeps older API fixtures compatible.
    const data = await apiGet(
      `/public/polls/featured/${encodeURIComponent(apiLocale[lang])}`,
      apiPollSchema,
      { cache: "no-store", headers: token ? { cookie: `${VOTER_COOKIE}=${token}` } : undefined },
      fetchImpl,
    );
    return toPoll(data, lang);
  } catch {
    return null;
  }
}
