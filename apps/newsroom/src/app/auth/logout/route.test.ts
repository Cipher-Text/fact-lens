import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { endSignIn } = vi.hoisted(() => ({ endSignIn: vi.fn(async () => undefined) }));

vi.mock('@/lib/env', () => ({
  getEnv: () => ({ NEWSROOM_BASE_URL: 'https://newsroom.test', NEWSROOM_TRUST_PROXY: false, SESSION_SECRET: 'x'.repeat(32) }),
  isSecure: () => false,
}));
vi.mock('@/lib/backend', () => ({ endSignIn }));

import { POST } from './route';

const signOut = (origin: string | null) =>
  new NextRequest('https://newsroom.test/auth/logout', {
    method: 'POST',
    headers: origin === null ? {} : { origin },
  });

describe('sign-out', () => {
  beforeEach(() => endSignIn.mockClear());

  it('refuses a sign-out posted from another site, and leaves the sign-in alone', async () => {
    const res = await POST(signOut('https://evil.example'));
    expect(res.status).toBe(403);
    expect(endSignIn).not.toHaveBeenCalled();
  });

  it('refuses a sign-out that carries no origin', async () => {
    const res = await POST(signOut(null));
    expect(res.status).toBe(403);
    expect(endSignIn).not.toHaveBeenCalled();
  });

  it('ends the sign-in from this site and sends the browser to the signed-out page', async () => {
    const res = await POST(signOut('https://newsroom.test'));
    expect(endSignIn).toHaveBeenCalledTimes(1);
    expect(res.headers.get('location')).toBe('https://newsroom.test/signed-out');
  });
});
