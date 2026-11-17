import { describe, expect, it } from 'vitest';
import { addPick, filterCandidates, MAX_RELATED, movePick, orderPicks, removePick, toPayload, type RelatedPick } from './related';

const picks: RelatedPick[] = [
  { newsId: 'a', title: 'A', position: 2 },
  { newsId: 'b', title: 'B', position: 1 },
];

describe('related picks', () => {
  it('orders and renumbers picks', () => expect(orderPicks(picks).map((pick) => [pick.newsId, pick.position])).toEqual([['b', 1], ['a', 2]]));
  it('appends once and enforces the three item limit', () => {
    const three = [...picks, { newsId: 'c', title: 'C', position: 3 }];
    expect(addPick(picks, 'c', 'C')).toHaveLength(MAX_RELATED);
    expect(addPick(three, 'd', 'D')).toBe(three);
    expect(addPick(picks, 'a', 'A')).toBe(picks);
  });
  it('removes and renumbers', () => expect(removePick(picks, 'b')).toEqual([{ newsId: 'a', title: 'A', position: 1 }]));
  it('moves in either direction and is a no-op at either end', () => {
    expect(movePick(picks, 'b', 'up')).toBe(picks);
    expect(movePick(picks, 'a', 'down')).toBe(picks);
    expect(movePick(picks, 'a', 'up').map((pick) => pick.newsId)).toEqual(['a', 'b']);
  });
  it('creates the API payload', () => expect(toPayload(picks)).toEqual({ related: [{ newsId: 'b', position: 1 }, { newsId: 'a', position: 2 }] }));
  it('filters self and picks, matches without case, and caps results', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: String(i), title: `News ${i}` }));
    expect(filterCandidates(items, 'nEwS', ['0', '1'])).toHaveLength(20);
    expect(filterCandidates(items, 'news', ['0', '1']).some((item) => item.id === '0')).toBe(false);
  });
});
