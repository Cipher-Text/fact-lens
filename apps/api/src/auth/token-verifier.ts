import { jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';

export const TOKEN_VERIFIER = Symbol('TOKEN_VERIFIER');

export interface TokenVerifier {
  verify(token: string): Promise<JWTPayload>;
}

// Asymmetric algorithms only: never `none`, never a shared-secret HS* algorithm.
const ALGORITHMS = ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'EdDSA'];

export function createTokenVerifier(opts: { issuer: string; audience: string; keys: JWTVerifyGetKey }): TokenVerifier {
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
