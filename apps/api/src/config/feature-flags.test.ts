import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../app';
import { AuditService } from '../audit/audit.service';
import { AuthGuard } from '../auth/auth.guard';
import { AUTH_OPTIONS, AuthService, CAPABILITY_STORE } from '../auth/auth.service';
import { PgCapabilityStore } from '../auth/pg-capability-store';
import { createTokenVerifier, TOKEN_VERIFIER } from '../auth/token-verifier';
import { PG_POOL } from '../db/pool';
import { createTestDatabase } from '../db/test-db';
import { seedReferenceData } from '../seed/seed';
import { FeatureFlagsController } from './feature-flags.controller';

const adminUrl = process.env.TEST_DATABASE_URL;
const ISSUER = 'https://idp.test/';
const AUDIENCE = 'fact-lens-api';

describe.skipIf(!adminUrl)('feature flag endpoint (database)', () => {
  let db: Awaited<ReturnType<typeof createTestDatabase>>;
  let app: NestFastifyApplication;
  let token: (roles: string[], sub?: string) => Promise<string>;

  beforeAll(async () => {
    db = await createTestDatabase(adminUrl!);
    await seedReferenceData(db.pool);

    const { publicKey, privateKey } = await generateKeyPair('ES256');
    const verifier = createTokenVerifier({
      issuer: ISSUER, audience: AUDIENCE, keys: createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), alg: 'ES256' }] }),
    });
    token = (roles, sub = 'admin-1') =>
      new SignJWT({ roles, amr: ['pwd', 'mfa'] }).setProtectedHeader({ alg: 'ES256' }).setSubject(sub)
        .setIssuer(ISSUER).setAudience(AUDIENCE).setExpirationTime('5m').sign(privateKey);

    @Module({
      controllers: [FeatureFlagsController],
      providers: [
        { provide: PG_POOL, useValue: db.pool },
        AuditService,
        AuthService,
        { provide: TOKEN_VERIFIER, useValue: verifier },
        { provide: CAPABILITY_STORE, useValue: new PgCapabilityStore(db.pool) },
        { provide: AUTH_OPTIONS, useValue: { rolesClaim: 'roles', requireMfa: true } },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    })
    class M {}
    app = await createApp(M, 'silent');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app?.close();
    await db?.drop();
  });

  const put = async (key: string, body: unknown, roles = ['admin']) =>
    app.inject({
      method: 'PUT', url: `/config/flags/${key}`, payload: body as object,
      headers: { authorization: `Bearer ${await token(roles)}` },
    });

  it('lists flags for config.manage and rejects other roles and anonymous callers', async () => {
    const ok = await app.inject({ method: 'GET', url: '/config/flags', headers: { authorization: `Bearer ${await token(['admin'])}` } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toHaveLength(11);
    const editor = await app.inject({ method: 'GET', url: '/config/flags', headers: { authorization: `Bearer ${await token(['managing_editor'])}` } });
    expect(editor.statusCode).toBe(403);
    expect((await app.inject({ method: 'GET', url: '/config/flags' })).statusCode).toBe(401);
  });

  it('changes a flag and writes the audit and outbox rows together', async () => {
    const res = await put('ads.serving', { enabled: true, reason: 'launch review passed' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ key: 'ads.serving', enabled: true });

    const audit = await db.pool.query(`SELECT * FROM audit_event WHERE action = 'feature_flag.update' AND object_id = 'ads.serving'`);
    expect(audit.rows).toHaveLength(1);
    expect(audit.rows[0]).toMatchObject({
      actor_type: 'human', actor_id: 'admin-1', previous_state: 'false', new_state: 'true', reason: 'launch review passed',
    });
    expect(audit.rows[0].request_id).toBeTruthy();
    const outbox = await db.pool.query(`SELECT payload FROM outbox_event WHERE aggregate_id = 'ads.serving'`);
    expect(outbox.rows).toEqual([{ payload: { key: 'ads.serving', enabled: true } }]);
  });

  it('does not audit a change that changes nothing', async () => {
    await put('analytics.ga4', { enabled: false, reason: 'no change expected' });
    const n = await db.pool.query(`SELECT count(*)::int AS n FROM audit_event WHERE object_id = 'analytics.ga4'`);
    expect(n.rows[0].n).toBe(0);
  });

  it('requires a reason, a boolean and a known flag', async () => {
    expect((await put('ads.serving', { enabled: true })).statusCode).toBe(400);
    expect((await put('ads.serving', { enabled: 'yes', reason: 'because' })).statusCode).toBe(400);
    expect((await put('not.a.flag', { enabled: true, reason: 'because' })).statusCode).toBe(404);
  });

  it('records a denied attempt by an authenticated non-admin', async () => {
    await put('ads.redirect', { enabled: true, reason: 'sneaky' }, ['reporter']);
    const rows = await db.pool.query(`SELECT actor_id, reason FROM audit_event WHERE action = 'authz.denied'`);
    expect(rows.rows.length).toBeGreaterThan(0);
    const flag = await db.pool.query(`SELECT enabled FROM feature_flag WHERE key = 'ads.redirect'`);
    expect(flag.rows[0].enabled).toBe(false);
  });
});
