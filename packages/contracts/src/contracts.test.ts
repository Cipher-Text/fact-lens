import { describe, expect, it } from 'vitest';
import {
  adCampaignSchema, adEventInputSchema, adSchema, advertiserSchema, configValueSchema, contributorSchema,
  correctionSchema, parseConfigValue, newsSchema, newsStatuses,
} from './index';

const id = '0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11';
const now = '2026-10-21T10:00:00Z';

describe('contracts', () => {
  it('accepts a news item and rejects an unknown status', () => {
    const news = { id, canonicalKey: 'k', status: 'DRAFT', categoryId: null, categoryIds: [], deskId: null, publishedRevisionId: null, publishedAt: null, createdAt: now, updatedAt: now };
    expect(newsSchema.safeParse(news).success).toBe(true);
    expect(newsSchema.safeParse({ ...news, status: 'NOPE' }).success).toBe(false);
    expect(newsStatuses).toContain('FACT_CHECK');
  });

  it('keeps private contact data out of public schemas', () => {
    const parsed = contributorSchema.parse({ id, kind: 'person', displayName: 'A', bio: null, contactEmail: 'a@b.c' });
    expect(parsed).not.toHaveProperty('contactEmail');
    const adv = advertiserSchema.parse({ id, name: 'A', website: null, status: 'active', billingInfo: 'secret' });
    expect(adv).not.toHaveProperty('billingInfo');
  });

  it('rejects non-http URLs for ads and advertisers', () => {
    const ad = { id, campaignId: id, placementId: id, title: 't', format: 'html', mediaAssetId: null, html: '<b>x</b>', targetUrl: 'https://example.com', openInNewTab: true, priority: 0, weight: 1, deviceTarget: 'all', locale: null, categoryIds: [], active: true };
    expect(adSchema.safeParse(ad).success).toBe(true);
    expect(adSchema.safeParse({ ...ad, targetUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(adSchema.safeParse({ ...ad, format: 'image' }).success).toBe(false);
    expect(adSchema.safeParse({ ...ad, html: '  ' }).success).toBe(false);
    expect(advertiserSchema.safeParse({ id, name: 'A', website: 'ftp://x', status: 'active' }).success).toBe(false);
  });

  it('checks campaign dates and caps beacon input lengths', () => {
    const c = { id, advertiserId: id, name: 'c', status: 'draft', startAt: '2026-02-01T00:00:00Z', endAt: '2026-01-01T00:00:00Z', budget: 1 };
    expect(adCampaignSchema.safeParse(c).success).toBe(false);
    expect(adEventInputSchema.safeParse({ eventType: 'click', adId: id, path: 'a'.repeat(3000) }).success).toBe(false);
    expect(adEventInputSchema.safeParse({ eventType: 'view', adId: id }).success).toBe(false);
  });

  it('requires a notice for every correction locale', () => {
    const base = { id, newsId: id, revisionId: id, reason: 'typo', approvedBy: 'u', approvedAt: now };
    expect(correctionSchema.safeParse({ ...base, notices: { en: 'Fixed' } }).success).toBe(true);
    expect(correctionSchema.safeParse({ ...base, notices: { en: '' } }).success).toBe(false);
  });

  it('picks a value schema by configuration key', () => {
    expect(configValueSchema('rate_limit.search')).toBeDefined();
    expect(configValueSchema('nope')).toBeUndefined();
    expect(() => parseConfigValue('rate_limit.search', { limit: 0, windowSeconds: 60 })).toThrow();
    expect(() => parseConfigValue('unknown.key', {})).toThrow(/Unknown configuration key/);
  });
});
