export const MAX_RELATED = 3;

export type RelatedPick = { newsId: string; position: number; title: string | null };

export function orderPicks(picks: RelatedPick[]): RelatedPick[] {
  return [...picks].sort((a, b) => a.position - b.position).map((pick, index) => ({ ...pick, position: index + 1 }));
}

export function addPick(picks: RelatedPick[], newsId: string, title: string): RelatedPick[] {
  if (picks.length >= MAX_RELATED || picks.some((pick) => pick.newsId === newsId)) return picks;
  return [...picks, { newsId, title, position: picks.length + 1 }];
}

export function removePick(picks: RelatedPick[], newsId: string): RelatedPick[] {
  return orderPicks(picks.filter((pick) => pick.newsId !== newsId));
}

export function movePick(picks: RelatedPick[], newsId: string, direction: 'up' | 'down'): RelatedPick[] {
  const ordered = orderPicks(picks);
  const index = ordered.findIndex((pick) => pick.newsId === newsId);
  const neighbour = index + (direction === 'up' ? -1 : 1);
  if (index < 0 || neighbour < 0 || neighbour >= ordered.length) return picks;
  [ordered[index], ordered[neighbour]] = [ordered[neighbour]!, ordered[index]!];
  return ordered.map((pick, position) => ({ ...pick, position: position + 1 }));
}

export function toPayload(picks: RelatedPick[]): { related: Array<{ newsId: string; position: number }> } {
  return { related: orderPicks(picks).map(({ newsId, position }) => ({ newsId, position })) };
}

export function filterCandidates(items: Array<{ id: string; title: string }>, query: string, excludeIds: string[]): Array<{ id: string; title: string }> {
  const excluded = new Set(excludeIds);
  const needle = query.trim().toLocaleLowerCase();
  return items.filter((item) => !excluded.has(item.id) && item.title.toLocaleLowerCase().includes(needle)).slice(0, 20);
}
