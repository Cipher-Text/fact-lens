import { Global, Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { loadApiEnv } from '@fact-lens/config';
import { createRemoteJWKSet } from 'jose';
import type { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
import { PG_POOL } from '../db/pool';
import { AUTH_OPTIONS, AuthService, CAPABILITY_STORE } from './auth.service';
import { AuthGuard } from './auth.guard';
import { PgCapabilityStore } from './pg-capability-store';
import { createTokenVerifier, TOKEN_VERIFIER } from './token-verifier';

@Global()
@Module({
  providers: [
    AuditService,
    AuthService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: CAPABILITY_STORE, inject: [PG_POOL], useFactory: (pool: Pool) => new PgCapabilityStore(pool) },
    {
      provide: AUTH_OPTIONS,
      useFactory: () => {
        const env = loadApiEnv();
        return { rolesClaim: env.OIDC_ROLES_CLAIM, requireMfa: env.OIDC_REQUIRE_MFA };
      },
    },
    {
      provide: TOKEN_VERIFIER,
      useFactory: () => {
        const env = loadApiEnv();
        if (!env.OIDC_ISSUER || !env.OIDC_AUDIENCE) {
          new Logger('Auth').warn('OIDC_ISSUER/OIDC_AUDIENCE not set: every protected route returns 401');
          return null;
        }
        const jwks = env.OIDC_JWKS_URI ?? `${env.OIDC_ISSUER.replace(/\/$/, '')}/.well-known/jwks.json`;
        return createTokenVerifier({
          issuer: env.OIDC_ISSUER,
          audience: env.OIDC_AUDIENCE,
          keys: createRemoteJWKSet(new URL(jwks)),
        });
      },
    },
  ],
  exports: [AuthService, AuditService],
})
export class AuthModule {}
