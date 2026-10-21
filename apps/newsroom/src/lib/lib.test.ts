import { describe, expect, it } from 'vitest';
import { principalSchema } from '@fact-lens/contracts';
import { isTrustedRequest } from './csrf';
import { formatDateTime, pickTitle, relativeTime, statusTone } from './format';
import { visibleNav } from './nav';
import { apiUrl, isAllowedApiRequest } from './proxy-allow';
import { cookieNames, MAX_COOKIE_VALUE, openFlow, openSession, safeReturnTo, sealFlow, sealSession, type Session } from './session';

const secret = 'a'.repeat(32);
const session: Session = { sub: 'u1', name: 'Una', accessToken: 'tok', expiresAt: Math.floor(Date.now() / 1000) + 600 };

describe('session cookies', () => {
  it('round-trips and rejects tampering, the wrong secret, and expiry', async () => {
    const sealed = await sealSession(session, secret);
    expect(await openSession(sealed, secret)).toEqual(session);
    expect(await openSession(sealed.slice(0, -2) + 'xx', secret)).toBeNull();
    expect(await openSession(sealed, 'b'.repeat(32))).toBeNull();
    expect(await openSession(undefined, secret)).toBeNull();
    expect(await openSession('garbage', secret)).toBeNull();
    const old = await sealSession({ ...session, expiresAt: Math.floor(Date.now() / 1000) + 30 }, secret);
    expect(await openSession(old, secret, Date.now() + 60_000)).toBeNull();
  });

  it('does not let a login-flow cookie pass as a session, or the reverse', async () => {
    const flow = await sealFlow({ state: 's', nonce: 'n', codeVerifier: 'v', returnTo: '/' }, secret);
    expect(await openSession(flow, secret)).toBeNull();
    expect(await openFlow(await sealSession(session, secret), secret)).toBeNull();
    expect(await openFlow(flow, secret)).toMatchObject({ state: 's', returnTo: '/' });
  });

  it('encrypts: the token is not readable in the cookie', async () => {
    const sealed = await sealSession({ ...session, accessToken: 'super-secret-access-token' }, secret);
    expect(sealed).not.toContain('super-secret');
    expect(Buffer.from(sealed.split('.')[3] ?? '', 'base64url').toString()).not.toContain('super-secret');
    expect(sealed.length).toBeLessThan(MAX_COOKIE_VALUE);
  });

  it('uses host-locked cookie names only over https', () => {
    expect(cookieNames(true).session.startsWith('__Host-')).toBe(true);
    expect(cookieNames(false).session).toBe('nr_session');
  });
});

describe('safeReturnTo', () => {
  it('keeps in-app paths and drops everything else', () => {
    expect(safeReturnTo('/stories/abc?x=1')).toBe('/stories/abc?x=1');
    for (const bad of ['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', '', null, undefined, '/auth/login', '/api/me', '/a\nb']) {
      expect(safeReturnTo(bad)).toBe('/');
    }
  });
});

describe('origin check', () => {
  const base = 'https://news.example.com';
  it('lets reads through and requires a matching Origin for writes', () => {
    expect(isTrustedRequest('GET', null, base)).toBe(true);
    expect(isTrustedRequest('POST', 'https://news.example.com', base)).toBe(true);
    expect(isTrustedRequest('POST', null, base)).toBe(false);
    expect(isTrustedRequest('PUT', 'https://evil.example.com', base)).toBe(false);
    expect(isTrustedRequest('DELETE', 'http://news.example.com', base)).toBe(false);
    expect(isTrustedRequest('POST', 'null', base)).toBe(false);
  });
});

describe('API proxy allowlist', () => {
  it('allows the newsroom surface and nothing else', () => {
    expect(isAllowedApiRequest('GET', ['stories'])).toBe(true);
    expect(isAllowedApiRequest('POST', ['stories', 'abc', 'transitions'])).toBe(true);
    expect(isAllowedApiRequest('DELETE', ['stories', 'a', 'sources', 'b'])).toBe(true);
    expect(isAllowedApiRequest('GET', ['config', 'flags'])).toBe(true);
    expect(isAllowedApiRequest('PUT', ['config', 'flags', 'ads.serving'])).toBe(true);
  });
  it('keeps internal, public, health and unknown paths out, and rejects traversal', () => {
    for (const path of [['internal', 'schedules', 'x', 'publish'], ['public', 'stories'], ['health', 'ready'], ['config'], ['config', 'secrets'], [], ['stories', '..', 'internal'], ['stories', '.%2e'], ['stories', 'a/b'], ['stories', 'a b'], ['x', 'y']]) {
      expect(isAllowedApiRequest('GET', path), JSON.stringify(path)).toBe(false);
    }
    expect(isAllowedApiRequest('PATCH', ['stories'])).toBe(false);
    expect(isAllowedApiRequest('GET', ['stories', 'a', 'b', 'c', 'd', 'e', 'f'])).toBe(false);
  });
  it('builds the upstream URL from encoded segments', () => {
    expect(apiUrl('http://api:4000/', ['stories', 'a'], '?status=DRAFT')).toBe('http://api:4000/stories/a?status=DRAFT');
  });
});

describe('capability-aware navigation', () => {
  const principal = (capabilities: string[]) => principalSchema.parse({ subject: 'u', roles: [], capabilities, mfa: true });
  const labels = (caps: string[]) => visibleNav(principal(caps)).map((n) => n.label);
  it('shows only what the person can use', () => {
    expect(labels(['story.edit', 'story.submit'])).toEqual(['Desk queue', 'New story', 'Source inbox']);
    expect(labels(['config.manage'])).toEqual(['Configuration']);
    expect(labels([])).toEqual([]);
    expect(labels(['story.publish'])).toEqual(['Desk queue', 'Publishing calendar']);
  });
});

describe('formatting', () => {
  it('formats times in Dhaka and relative times', () => {
    expect(formatDateTime('2026-10-21T10:00:00Z')).toContain('16:00');
    expect(formatDateTime(null)).toBe('—');
    const now = Date.parse('2026-10-21T12:00:00Z');
    expect(relativeTime('2026-10-21T11:59:50Z', now)).toBe('just now');
    expect(relativeTime('2026-10-21T11:30:00Z', now)).toBe('30 minutes ago');
    expect(relativeTime('2026-10-21T10:00:00Z', now)).toBe('2 hours ago');
    expect(relativeTime('2026-10-19T12:00:00Z', now)).toBe('2 days ago');
  });
  it('picks an English title first, then any locale', () => {
    expect(pickTitle({ 'bn-BD': 'ক', en: 'A' })).toEqual({ text: 'A', locale: 'en' });
    expect(pickTitle({ 'bn-BD': 'ক' })).toEqual({ text: 'ক', locale: 'bn-BD' });
    expect(pickTitle({})).toBeNull();
    expect(statusTone('PUBLISHED')).toBe('good');
  });
});
