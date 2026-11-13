import { describe, expect, it } from 'vitest';
import { cardRequestSchema, cardRenderInputsSchema, cropSchema } from './cards';
import { outboxEventSchemas } from './jobs';

const id = '11111111-1111-4111-8111-111111111111';
const valid = {
  templateId: id,
  sourceMediaAssetId: id,
  locale: 'en',
  crop: { x: 0, y: 0, width: 1, height: 1 },
  headline: 'Headline',
};

describe('card request', () => {
  it('accepts a valid request', () => {
    expect(cardRequestSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a crop that goes outside the photo', () => {
    expect(cropSchema.safeParse({ x: 0.6, y: 0, width: 0.5, height: 1 }).success).toBe(false);
    expect(cropSchema.safeParse({ x: -0.1, y: 0, width: 0.5, height: 1 }).success).toBe(false);
  });

  it('rejects an empty headline and unknown keys', () => {
    expect(cardRequestSchema.safeParse({ ...valid, headline: '   ' }).success).toBe(false);
    expect(cardRequestSchema.safeParse({ ...valid, extra: true }).success).toBe(false);
  });
});

describe('card render inputs', () => {
  it('accepts a WebP source and rejects other types', () => {
    const inputs = {
      template: { aspectRatio: 'square', width: 1080, height: 1080, status: 'active', spec: {} },
      source: { contentType: 'image/webp', base64: 'AAAA' },
      crop: valid.crop,
      locale: 'en',
      headline: 'Headline',
      byline: null,
    };
    expect(cardRenderInputsSchema.safeParse(inputs).success).toBe(true);
    expect(cardRenderInputsSchema.safeParse({ ...inputs, source: { contentType: 'image/png', base64: 'AAAA' } }).success).toBe(false);
  });
});

describe('outbox event', () => {
  it('registers card.requested with a generated card id', () => {
    expect(outboxEventSchemas['card.requested'].safeParse({ generatedCardId: id }).success).toBe(true);
    expect(outboxEventSchemas['card.requested'].safeParse({ generatedCardId: 'nope' }).success).toBe(false);
  });
});
