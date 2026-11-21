import { jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';

export const TOKEN_VERIFIER = Symbol('TOKEN_VERIFIER');

export interface TokenVerifier {
  verify(token: string): Promise<JWTPayload>;
}

// Asymmetric algorithms only: never `none`, never a shared-secret HS* algorithm.
const ALGORITHMS = ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'EdDSA'];

/** Accepts a key set (a remote JWKS) or one key (the backend's own public key). */
export type VerificationKeys = JWTVerifyGetKey | Parameters<typeof jwtVerify>[1];

export function createTokenVerifier(opts: { issuer: string; audience: string; keys: VerificationKeys }): TokenVerifier {
  return {
    async verify(token) {
      const { payload } = await jwtVerify(token, opts.keys, {
        issuer: opts.issuer,
        audience: opts.audience,
        algorithms: ALGORITHMS,
        requiredClaims: ['exp', 'sub'],
        clockTolerance: 5,
      });
      return payload;
    },
  };
}

/**
 * Tries each verifier in turn: a token is accepted if any of them accepts it. Used while the backend's own tokens and an
 * external provider are both trusted. Returns null when there is nothing to trust, so every protected route answers 401.
 */
export function combineVerifiers(verifiers: TokenVerifier[]): TokenVerifier | null {
  if (verifiers.length === 0) return null;
  return {
    async verify(token) {
      let last: unknown = new Error('no verifier accepted the token');
      for (const verifier of verifiers) {
        try {
          return await verifier.verify(token);
        } catch (error) {
          last = error;
        }
      }
      throw last;
    },
  };
}
