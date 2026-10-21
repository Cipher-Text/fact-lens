export type PollResult = { id: string; votes: number; percent: number };

/**
 * Vote counts with whole percents that add up to 100 (largest remainder), so the
 * result bars and the numbers agree. `votedId` adds the reader's own vote.
 */
export function pollResults(
  options: readonly { id: string; votes: number }[],
  votedId?: string | null,
): { results: PollResult[]; total: number } {
  const counts = options.map((option) => ({
    id: option.id,
    votes: option.votes + (option.id === votedId ? 1 : 0),
  }));
  const total = counts.reduce((sum, option) => sum + option.votes, 0);
  if (total === 0) {
    return { results: counts.map((c) => ({ ...c, percent: 0 })), total };
  }
  const exact = counts.map((c) => (c.votes / total) * 100);
  const percents = exact.map(Math.floor);
  let left = 100 - percents.reduce((sum, p) => sum + p, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest);
  for (const { index } of byRemainder) {
    if (left <= 0) break;
    percents[index] += 1;
    left -= 1;
  }
  return {
    results: counts.map((c, index) => ({ ...c, percent: percents[index] })),
    total,
  };
}
