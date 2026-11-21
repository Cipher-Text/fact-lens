import { Global, Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { loadApiEnv } from '@fact-lens/config';
import { createRemoteJWKSet } from 'jose';
import type { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
import { PG_POOL } from '../db/pool';
import { AUTH_OPTIONS, AuthService, CAPABILITY_STORE } from './auth.service';
import { AuthGuard } from './auth.guard';
import { AuthorizationService } from './authorization.service';
import { PgCapabilityStore } from './pg-capability-store';
import { combineVerifiers, createTokenVerifier, TOKEN_VERIFIER, type TokenVerifier } from './token-verifier';
import { signInOptionsFromEnv } from './auth-keys';

@Global()
@Module({
  providers: [
    AuditService,
    AuthService,
    AuthorizationService,
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
        const verifiers: TokenVerifier[] = [];
        // The backend's own tokens (ADR-046), checked with its public key.
        const own = signInOptionsFromEnv(env);
        if (own) verifiers.push(createTokenVerifier({ issuer: own.issuer, audience: own.audience, keys: own.publicKey }));
        // An external provider, while one is still configured.
        if (env.OIDC_ISSUER && env.OIDC_AUDIENCE) {
          const jwks = env.OIDC_JWKS_URI ?? `${env.OIDC_ISSUER.replace(/\/$/, '')}/.well-known/jwks.json`;
          verifiers.push(createTokenVerifier({ issuer: env.OIDC_ISSUER, audience: env.OIDC_AUDIENCE, keys: createRemoteJWKSet(new URL(jwks)) }));
        }
        if (verifiers.length === 0) {
          new Logger('Auth').warn('No sign-in configured (AUTH_* or OIDC_*): every protected route returns 401');
          return null;
        }
        return combineVerifiers(verifiers);
      },
    },
  ],
  exports: [AuthService, AuthorizationService, AuditService],
})
export class AuthModule {}
