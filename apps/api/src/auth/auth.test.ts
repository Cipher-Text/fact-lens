import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { exportJWK, generateKeyPair, SignJWT, createLocalJWKSet, type JWTPayload } from 'jose';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { Capability } from '@fact-lens/contracts';
import { createApp } from '../app';
import { AuditService } from '../audit/audit.service';
import { AuthGuard } from './auth.guard';
import { AUTH_OPTIONS, AuthService, CAPABILITY_STORE, readClaim, rolesFromClaim } from './auth.service';
import { CurrentPrincipal, Public, RequireCapability } from './decorators';
import { createTokenVerifier, TOKEN_VERIFIER } from './token-verifier';
import { MeController } from './me.controller';

const ISSUER = 'https://idp.test/';
const AUDIENCE = 'fact-lens-api';

@Controller('t')
class TestController {
  @Public() @Get('open') open() { return { ok: true }; }
  @Get('authed') authed() { return { ok: true }; }
  @RequireCapability('story.edit') @Get('edit') edit() { return { ok: true }; }
  @RequireCapability('config.manage') @Get('config') config() { return { ok: true }; }
  @Get('who') who(@CurrentPrincipal() p: { subject: string }) { return { sub: p.subject }; }
}

const roleCapabilities: Record<string, Capability[]> = {
  reporter: ['story.edit'],
  admin: ['story.edit', 'config.manage'],
};

describe('auth', () => {
  let app: NestFastifyApplication;
  let noAuthApp: NestFastifyApplication;
  let sign: (claims?: JWTPayload, opts?: { issuer?: string; audience?: string; expires?: string; key?: CryptoKey; alg?: string }) => Promise<string>;
  let denials: Array<{ action: string; actorId?: string | null; reason?: string | null }>;

  beforeAll(async () => {
    const { publicKey, privateKey } = await generateKeyPair('ES256');
    const other = await generateKeyPair('ES256');
    const jwk = { ...(await exportJWK(publicKey)), alg: 'ES256', use: 'sig' };
    const verifier = createTokenVerifier({ issuer: ISSUER, audience: AUDIENCE, keys: createLocalJWKSet({ keys: [jwk] }) });

    sign = (claims = {}, opts = {}) =>
      new SignJWT({ roles: ['reporter'], ...claims })
        .setProtectedHeader({ alg: opts.alg ?? 'ES256' })
        .setSubject('user-1')
        .setIssuer(opts.issuer ?? ISSUER)
        .setAudience(opts.audience ?? AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(opts.expires ?? '5m')
        .sign(opts.key ?? privateKey);
    (sign as unknown as { otherKey: CryptoKey }).otherKey = other.privateKey;

    denials = [];
    const store = { capabilitiesFor: async (roles: string[]) => roles.flatMap((r) => roleCapabilities[r] ?? []) };
    const audit = { record: async (e: { action: string; actorId?: string | null; reason?: string | null }) => void denials.push(e) };
    const build = (requireMfa: boolean, verifierImpl: unknown) => {
      @Module({
        controllers: [TestController, MeController],
        providers: [
          AuthService,
          { provide: AuditService, useValue: audit },
          { provide: TOKEN_VERIFIER, useValue: verifierImpl },
          { provide: CAPABILITY_STORE, useValue: store },
          { provide: AUTH_OPTIONS, useValue: { rolesClaim: 'roles', requireMfa } },
          { provide: APP_GUARD, useClass: AuthGuard },
        ],
      })
      class M {}
      return createApp(M, 'silent');
    };
    app = await build(false, verifier);
    noAuthApp = await build(false, null);
    await Promise.all([app.init(), noAuthApp.init()]);
    await Promise.all([app.getHttpAdapter().getInstance().ready(), noAuthApp.getHttpAdapter().getInstance().ready()]);
  });
  afterAll(async () => {
    await Promise.all([app.close(), noAuthApp.close()]);
  });

  const get = (a: NestFastifyApplication, url: string, token?: string, header?: string) =>
    a.inject({ method: 'GET', url, headers: token || header ? { authorization: header ?? `Bearer ${token}` } : {} });

  it('lets public routes through and rejects missing credentials by default', async () => {
    expect((await get(app, '/t/open')).statusCode).toBe(200);
    const res = await get(app, '/t/authed');
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('unauthorized');
  });

  it('accepts a valid token and exposes the principal', async () => {
    const res = await get(app, '/me', await sign({ amr: ['pwd', 'otp'] }));
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ subject: 'user-1', roles: ['reporter'], capabilities: ['story.edit'], mfa: true });
  });

  it('rejects wrong issuer, wrong audience, expired, bad signature and non-bearer headers', async () => {
    expect((await get(app, '/t/authed', await sign({}, { issuer: 'https://evil/' }))).statusCode).toBe(401);
    expect((await get(app, '/t/authed', await sign({}, { audience: 'other' }))).statusCode).toBe(401);
    expect((await get(app, '/t/authed', await sign({}, { expires: '-1m' }))).statusCode).toBe(401);
    const otherKey = (sign as unknown as { otherKey: CryptoKey }).otherKey;
    expect((await get(app, '/t/authed', await sign({}, { key: otherKey }))).statusCode).toBe(401);
    expect((await get(app, '/t/authed', undefined, 'Basic abc')).statusCode).toBe(401);
    expect((await get(app, '/t/authed', 'not.a.jwt')).statusCode).toBe(401);
  });

  it('rejects an unsigned token', async () => {
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const token = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 'x', iss: ISSUER, aud: AUDIENCE, exp: 9999999999 })}.`;
    expect((await get(app, '/t/authed', token)).statusCode).toBe(401);
  });

  it('fails closed when OIDC is not configured', async () => {
    expect((await get(noAuthApp, '/t/authed', await sign())).statusCode).toBe(401);
    expect((await get(noAuthApp, '/t/open')).statusCode).toBe(200);
  });

  it('enforces capabilities and audits denials for authenticated callers only', async () => {
    const token = await sign();
    expect((await get(app, '/t/edit', token)).statusCode).toBe(200);
    denials.length = 0;
    const denied = await get(app, '/t/config', token);
    expect(denied.statusCode).toBe(403);
    expect(denied.json().error.code).toBe('forbidden');
    expect(denials).toEqual([expect.objectContaining({ action: 'authz.denied', actorId: 'user-1', reason: 'missing config.manage' })]);

    denials.length = 0;
    await get(app, '/t/config');
    expect(denials).toEqual([]);
  });

  it('ignores unknown roles', async () => {
    const res = await get(app, '/t/edit', await sign({ roles: ['made-up'] }));
    expect(res.statusCode).toBe(403);
  });

  it('requires MFA for privileged capabilities when the deployment demands it', async () => {
    const { publicKey, privateKey } = await generateKeyPair('ES256');
    const jwk = { ...(await exportJWK(publicKey)), alg: 'ES256' };
    const verifier = createTokenVerifier({ issuer: ISSUER, audience: AUDIENCE, keys: createLocalJWKSet({ keys: [jwk] }) });
    @Module({
      controllers: [TestController],
      providers: [
        AuthService,
        { provide: AuditService, useValue: { record: async () => {} } },
        { provide: TOKEN_VERIFIER, useValue: verifier },
        { provide: CAPABILITY_STORE, useValue: { capabilitiesFor: async () => ['config.manage', 'story.edit'] } },
        { provide: AUTH_OPTIONS, useValue: { rolesClaim: 'roles', requireMfa: true } },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    })
    class M {}
    const strict = await createApp(M, 'silent');
    await strict.init();
    await strict.getHttpAdapter().getInstance().ready();
    const mint = (claims: JWTPayload) =>
      new SignJWT(claims).setProtectedHeader({ alg: 'ES256' }).setSubject('u').setIssuer(ISSUER).setAudience(AUDIENCE).setExpirationTime('5m').sign(privateKey);

    const noMfa = await get(strict, '/t/config', await mint({ roles: ['admin'], amr: ['pwd'] }));
    expect(noMfa.statusCode).toBe(403);
    expect(noMfa.json().error.details.reason).toBe('mfa_required');
    expect((await get(strict, '/t/config', await mint({ roles: ['admin'], amr: ['pwd', 'mfa'] }))).statusCode).toBe(200);
    expect((await get(strict, '/t/edit', await mint({ roles: ['admin'], amr: ['pwd'] }))).statusCode).toBe(200);
    await strict.close();
  });

  it('reads role claims from nested paths and space-separated strings', () => {
    expect(readClaim({ realm_access: { roles: ['a', 'b'] } } as JWTPayload, 'realm_access.roles')).toEqual(['a', 'b']);
    expect(rolesFromClaim('a b,c')).toEqual(['a', 'b', 'c']);
    expect(rolesFromClaim(['a', 'a', 5, ''])).toEqual(['a']);
    expect(rolesFromClaim(undefined)).toEqual([]);
  });
});
