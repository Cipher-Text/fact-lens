import { describe, expect, it } from 'vitest';
import { readCapped } from './read-capped';

const text = (value: string) => new Request('http://newsroom.test/api/x', { method: 'POST', body: value });

describe('readCapped', () => {
  it('returns the whole body when it is within the limit', async () => {
    expect(new TextDecoder().decode((await readCapped(text('hello'), 10))!)).toBe('hello');
  });

  it('returns null when the body is larger than the limit', async () => {
    expect(await readCapped(text('hello world'), 5)).toBeNull();
  });

  it('stops a streamed body that has no length once it passes the limit', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('abc'));
        controller.enqueue(encoder.encode('defgh'));
        controller.close();
      },
    });
    const request = new Request('http://newsroom.test/api/x', { method: 'POST', body: stream, duplex: 'half' } as RequestInit);
    expect(await readCapped(request, 5)).toBeNull();
  });

  it('gives an empty result for a request with no body', async () => {
    expect((await readCapped(new Request('http://newsroom.test/api/x', { method: 'DELETE' }), 5))!.length).toBe(0);
  });
});
