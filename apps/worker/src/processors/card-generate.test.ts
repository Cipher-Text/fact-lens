import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CardRenderInputs } from '@fact-lens/contracts';
import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '../api-client';
import type { Logger } from '../log';
import type { Enqueue } from '../queues';
import { handlers } from './index';

const id = '0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11';
const inputs: CardRenderInputs = {
  template: {
    aspectRatio: 'square', width: 240, height: 240, status: 'active',
    spec: {
      gradient: { from: '#000000', to: '#000000' },
      frame: { color: '#ffffff', width: 4 },
      headlineRegion: { x: 20, y: 150, width: 200, height: 60 },
      bylineRegion: { x: 20, y: 215, width: 200, height: 20 },
    },
  },
  source: { contentType: 'image/webp', base64: '' },
  crop: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
  locale: 'en', headline: 'Fixture headline', byline: 'FactLens',
};

const services = (api: ApiClient) => ({
  api, pool: {} as Pool, log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger,
  enqueue: vi.fn() as unknown as Enqueue, cache: { invalidate: vi.fn() }, feeds: vi.fn(),
});

describe('media.card_generate', () => {
  it('composes the fixture and renders it through the API; a repeated run succeeds', async () => {
    const photo = await readFile(join(__dirname, '../cards/fixtures/photo.jpg'));
    const ready = { ...inputs, source: { ...inputs.source, base64: photo.toString('base64') } };
    const cardInputs = vi.fn().mockResolvedValueOnce(ready).mockResolvedValueOnce(null);
    const renderCard = vi.fn().mockResolvedValue(true);
    const api = { cardInputs, renderCard } as unknown as ApiClient;
    const handler = handlers['media.card_generate'];

    await handler.run({ generatedCardId: id }, services(api));
    await handler.run({ generatedCardId: id }, services(api));

    expect(cardInputs).toHaveBeenCalledTimes(2);
    expect(cardInputs).toHaveBeenNthCalledWith(1, id);
    expect(renderCard).toHaveBeenCalledTimes(1);
    expect(renderCard).toHaveBeenCalledWith(id, expect.any(Buffer));
  });

  it('throws on a render failure so the job runtime can retry', async () => {
    const photo = await readFile(join(__dirname, '../cards/fixtures/photo.jpg'));
    const ready = { ...inputs, source: { ...inputs.source, base64: photo.toString('base64') } };
    const failure = new Error('render unavailable');
    const api = {
      cardInputs: vi.fn().mockResolvedValue(ready),
      renderCard: vi.fn().mockRejectedValue(failure),
    } as unknown as ApiClient;

    await expect(handlers['media.card_generate'].run({ generatedCardId: id }, services(api))).rejects.toBe(failure);
  });

  it('treats a render conflict as an already completed card', async () => {
    const photo = await readFile(join(__dirname, '../cards/fixtures/photo.jpg'));
    const ready = { ...inputs, source: { ...inputs.source, base64: photo.toString('base64') } };
    const api = { cardInputs: vi.fn().mockResolvedValue(ready), renderCard: vi.fn().mockResolvedValue(false) } as unknown as ApiClient;
    await expect(handlers['media.card_generate'].run({ generatedCardId: id }, services(api))).resolves.toBeUndefined();
  });
});
