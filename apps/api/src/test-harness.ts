import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from './app';
import { AuditService } from './audit/audit.service';
import { AuthGuard } from './auth/auth.guard';
import { AUTH_OPTIONS, AuthService, CAPABILITY_STORE } from './auth/auth.service';
import { AuthorizationService } from './auth/authorization.service';
import { PgCapabilityStore } from './auth/pg-capability-store';
import { createTokenVerifier, TOKEN_VERIFIER } from './auth/token-verifier';
import { PG_POOL } from './db/pool';
import { createTestDatabase } from './db/test-db';
import { seedReferenceData } from './seed/seed';
import { INTERNAL_TOKEN, InternalController } from './internal/internal.controller';
import { AssignmentsService } from './stories/assignments.service';
import { CollabController } from './stories/collab.controller';
import { CommentsService } from './stories/comments.service';
import { PublicStoriesController } from './stories/public.controller';
import { SourcesService } from './stories/sources.service';
import { StoriesController } from './stories/stories.controller';
import { StoriesService } from './stories/stories.service';

const ISSUER = 'https://idp.test/';
const AUDIENCE = 'fact-lens-api';

export interface CallOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  body?: unknown;
  /** Role keys in the token. Defaults to admin. */
  roles?: string[];
  /** Token subject. Defaults to `user-1`. */
  sub?: string;
  mfa?: boolean;
}

/** A real Nest app on a migrated, seeded throwaway database, signing its own test tokens. */
export const TEST_INTERNAL_TOKEN = 'test-internal-token-0123456789abcdef';

export async function startTestApp(adminUrl: string, opts: { internalToken?: string | null } = {}) {
  const db = await createTestDatabase(adminUrl);
  await seedReferenceData(db.pool);

  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const verifier = createTokenVerifier({
    issuer: ISSUER, audience: AUDIENCE, keys: createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), alg: 'ES256' }] }),
  });
  const sign = (roles: string[], sub: string, mfa: boolean) =>
    new SignJWT({ roles, ...(mfa ? { amr: ['pwd', 'mfa'] } : {}) }).setProtectedHeader({ alg: 'ES256' }).setSubject(sub)
      .setIssuer(ISSUER).setAudience(AUDIENCE).setExpirationTime('5m').sign(privateKey);

  @Module({
    controllers: [StoriesController, PublicStoriesController, CollabController, InternalController],
    providers: [
      { provide: INTERNAL_TOKEN, useValue: opts.internalToken === undefined ? TEST_INTERNAL_TOKEN : opts.internalToken },
      { provide: PG_POOL, useValue: db.pool }, AuditService, AuthService, AuthorizationService,
      StoriesService, CommentsService, AssignmentsService, SourcesService,
      { provide: TOKEN_VERIFIER, useValue: verifier },
      { provide: CAPABILITY_STORE, useValue: new PgCapabilityStore(db.pool) },
      { provide: AUTH_OPTIONS, useValue: { rolesClaim: 'roles', requireMfa: true } },
      { provide: APP_GUARD, useClass: AuthGuard },
    ],
  })
  class TestAppModule {}

  const app: NestFastifyApplication = await createApp(TestAppModule, 'silent');
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const call = async ({ method, url, body, roles = ['admin'], sub = 'user-1', mfa = true }: CallOptions) => {
    const res = await app.inject({
      method, url, payload: body as object | undefined, headers: { authorization: `Bearer ${await sign(roles, sub, mfa)}` },
    });
    return { status: res.statusCode, body: (res.body ? res.json() : null) as any, headers: res.headers };
  };
  const anonymous = (method: 'GET' | 'POST', url: string, body?: unknown) =>
    app.inject({ method, url, payload: body as object | undefined });

  return {
    db, app, call, anonymous,
    async close() {
      await app.close();
      await db.drop();
    },
  };
}
