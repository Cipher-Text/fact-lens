import { Module } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadApiEnv } from '@fact-lens/config';
import { createApp } from '../app';
import { SITE_INFO, siteFromEnv, type SiteInfo } from './site';
import { PublicSiteController } from './site.controller';

const base = { DATABASE_URL: 'postgres://u:p@localhost:5432/db', REDIS_URL: 'redis://localhost:6379' };

describe('the site social links and contact details from the settings', () => {
  it('has no links and no contact details when nothing is set', () => {
    expect(siteFromEnv(loadApiEnv(base))).toEqual({ social: { links: [] }, contact: { email: null, phone: null, address: null } });
  });

  it('serves the networks that are set, in the site order, and the contact details', () => {
    const site = siteFromEnv(loadApiEnv({
      ...base, SITE_SOCIAL_LINKEDIN_URL: 'https://www.linkedin.com/company/factlens', SITE_SOCIAL_FACEBOOK_URL: 'https://www.facebook.com/factlens',
      SITE_CONTACT_EMAIL: 'desk@factlens.example', SITE_CONTACT_PHONE: '+880 2 5555 0100', SITE_CONTACT_ADDRESS: '12 Press Road, Dhaka',
    }));
    expect(site.social.links).toEqual([
      { network: 'facebook', url: 'https://www.facebook.com/factlens' }, { network: 'linkedin', url: 'https://www.linkedin.com/company/factlens' },
    ]);
    expect(site.contact).toEqual({ email: 'desk@factlens.example', phone: '+880 2 5555 0100', address: '12 Press Road, Dhaka' });
  });

  it('stops the start, naming the setting, when an address is not on its own network', () => {
    const env = (extra: Record<string, string>) => loadApiEnv({ ...base, ...extra });
    expect(() => siteFromEnv(env({ SITE_SOCIAL_X_URL: 'https://example.com/factlens' }))).toThrow(/SITE_SOCIAL_X_URL.*x domain/);
    expect(() => siteFromEnv(env({ SITE_SOCIAL_FACEBOOK_URL: 'https://facebook.com.evil.test/a' }))).toThrow(/SITE_SOCIAL_FACEBOOK_URL/);
    expect(() => siteFromEnv(env({ SITE_SOCIAL_YOUTUBE_URL: 'https://user:pw@www.youtube.com/@a' }))).toThrow(/SITE_SOCIAL_YOUTUBE_URL/);
  });

  describe('over HTTP', () => {
    const site: SiteInfo = {
      social: { links: [{ network: 'x', url: 'https://x.com/factlens' }] },
      contact: { email: 'desk@factlens.example', phone: null, address: null },
    };
    it('is public, read only, and cached', async () => {
      @Module({ controllers: [PublicSiteController], providers: [{ provide: SITE_INFO, useValue: site }] })
      class M {}
      const app: NestFastifyApplication = await createApp(M, 'silent');
      await app.init();
      await app.getHttpAdapter().getInstance().ready();
      try {
        const links = await app.inject({ method: 'GET', url: '/public/site/social-links' });
        expect(links.statusCode).toBe(200);
        expect(links.json()).toEqual(site.social);
        expect(links.headers['cache-control']).toMatch(/max-age=60/);
        const contact = await app.inject({ method: 'GET', url: '/public/site/contact' });
        expect(contact.json()).toEqual(site.contact);
        // Nothing to change from the outside.
        expect((await app.inject({ method: 'PUT', url: '/public/site/social-links', payload: { x: 'https://x.com/other' } })).statusCode).toBe(404);
        expect((await app.inject({ method: 'PUT', url: '/config/social-links', payload: {} })).statusCode).toBe(404);
      } finally {
        await app.close();
      }
    });
  });
});
