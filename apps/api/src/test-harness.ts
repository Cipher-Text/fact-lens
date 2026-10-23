import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from './app';
import { AiController } from './ai/ai.controller';
import { PollsController, PublicPollsController } from './polls/polls.controller';
import { POLL_OPTIONS, PollsService, type PollOptions } from './polls/polls.service';
import { InboxController } from './inbox/inbox.controller';
import { InboxService } from './inbox/inbox.service';
import { GEMINI_OPTIONS, GeminiService, type GeminiOptions } from './ai/gemini.service';
import { AuditService } from './audit/audit.service';
import { AuthGuard } from './auth/auth.guard';
import { AUTH_OPTIONS, AuthService, CAPABILITY_STORE } from './auth/auth.service';
import { AuthorizationService } from './auth/authorization.service';
import { PgCapabilityStore } from './auth/pg-capability-store';
import { createTokenVerifier, TOKEN_VERIFIER } from './auth/token-verifier';
import { PG_POOL } from './db/pool';
import { createTestDatabase } from './db/test-db';
import { seedReferenceData } from './seed/seed';
import { MediaController } from './media/media.controller';
import { MEDIA_OPTIONS, MediaService } from './media/media.service';
import { MemoryStorage, OBJECT_STORAGE, type ObjectStorage } from './media/storage';
import { ReferenceController } from './reference/reference.controller';
import { INTERNAL_TOKEN, InternalController } from './internal/internal.controller';
import { AssignmentsService } from './news/assignments.service';
import { CollabController } from './news/collab.controller';
import { CommentsService } from './news/comments.service';
import { PublicNewsController } from './news/public.controller';
import { SourcesService } from './news/sources.service';
import { NewsController } from './news/news.controller';
import { NewsService } from './news/news.service';
import { LocalesController } from './config/locales.controller';
import { PublicTaxonomyController } from './taxonomy/public-taxonomy.controller';
import { TaxonomyController } from './taxonomy/taxonomy.controller';
import { TaxonomyService } from './taxonomy/taxonomy.service';

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

/** Pass `storage` to run the app on another store; the default is an in-memory one that tests can inspect. */
export async function startTestApp<S extends ObjectStorage = MemoryStorage>(
  adminUrl: string, opts: { internalToken?: string | null; maxUploadBytes?: number; storage?: S; gemini?: GeminiOptions; polls?: PollOptions; trustProxy?: boolean } = {},
) {
  const storage = (opts.storage ?? new MemoryStorage()) as S;
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
    controllers: [PollsController, PublicPollsController, InboxController, AiController, NewsController, PublicNewsController, CollabController, InternalController, ReferenceController, MediaController, TaxonomyController, PublicTaxonomyController, LocalesController],
    providers: [
      { provide: INTERNAL_TOKEN, useValue: opts.internalToken === undefined ? TEST_INTERNAL_TOKEN : opts.internalToken },
      { provide: GEMINI_OPTIONS, useValue: opts.gemini ?? { apiKey: null, model: 'test-model' } }, GeminiService,
      { provide: PG_POOL, useValue: db.pool }, AuditService, AuthService, AuthorizationService,
      NewsService, TaxonomyService, CommentsService, AssignmentsService, SourcesService, InboxService, PollsService, MediaService,
      { provide: POLL_OPTIONS, useValue: opts.polls ?? { secret: 'test-poll-secret-0123456789abcdef0123456789', perIpPerDay: 3 } },
      { provide: OBJECT_STORAGE, useValue: storage },
      { provide: MEDIA_OPTIONS, useValue: { maxBytes: opts.maxUploadBytes ?? 10 * 1024 * 1024 } },
      { provide: TOKEN_VERIFIER, useValue: verifier },
      { provide: CAPABILITY_STORE, useValue: new PgCapabilityStore(db.pool) },
      { provide: AUTH_OPTIONS, useValue: { rolesClaim: 'roles', requireMfa: true } },
      { provide: APP_GUARD, useClass: AuthGuard },
    ],
  })
  class TestAppModule {}

  const app: NestFastifyApplication = await createApp(TestAppModule, 'silent', opts.trustProxy ?? false);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const call = async ({ method, url, body, roles = ['admin'], sub = 'user-1', mfa = true }: CallOptions) => {
    const res = await app.inject({
      method, url, payload: body as object | undefined, headers: { authorization: `Bearer ${await sign(roles, sub, mfa)}` },
    });
    return { status: res.statusCode, body: (res.body ? res.json() : null) as any, headers: res.headers };
  };
  /** Posts the image itself as the body, as the newsroom does. */
  const upload = async (
    body: Buffer, { contentType = 'image/jpeg', filename, roles = ['reporter'], sub = 'user-1', mfa = true }: { contentType?: string; filename?: string; roles?: string[]; sub?: string; mfa?: boolean } = {},
  ) => {
    const res = await app.inject({
      method: 'POST', url: `/media${filename ? `?filename=${encodeURIComponent(filename)}` : ''}`, payload: body,
      headers: { authorization: `Bearer ${await sign(roles, sub, mfa)}`, 'content-type': contentType },
    });
    return { status: res.statusCode, body: (res.body ? res.json() : null) as any, headers: res.headers };
  };
  /** Raw bytes of a newsroom GET (an image), not JSON. */
  const fetchFile = async (url: string, roles = ['reporter']) => {
    const res = await app.inject({ method: 'GET', url, headers: { authorization: `Bearer ${await sign(roles, 'user-1', true)}` } });
    return { status: res.statusCode, bytes: res.rawPayload, headers: res.headers };
  };
  const anonymous = (method: 'GET' | 'POST', url: string, body?: unknown) =>
    app.inject({ method, url, payload: body as object | undefined });

  return {
    db, app, call, anonymous, upload, fetchFile, storage,
    token: (roles: string[], sub = 'user-1', mfa = true) => sign(roles, sub, mfa),
    async close() {
      await app.close();
      await db.drop();
    },
  };
}
