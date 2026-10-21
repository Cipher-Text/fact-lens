import 'server-only';
import * as client from 'openid-client';
import type { NewsroomEnv } from '@fact-lens/config';
import type { LoginFlow, Session } from './session';

const loopback = (url: string) => ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname);

let cache: { key: string; at: number; config: client.Configuration } | undefined;

/** Discovery is cached for ten minutes. Plain HTTP is accepted only for a loopback issuer (development). */
export async function getConfig(env: NewsroomEnv): Promise<client.Configuration> {
  const key = `${env.OIDC_ISSUER}|${env.OIDC_CLIENT_ID}`;
  if (cache && cache.key === key && Date.now() - cache.at < 10 * 60_000) return cache.config;
  const insecureOk = new URL(env.OIDC_ISSUER).protocol === 'http:' && loopback(env.OIDC_ISSUER);
  if (new URL(env.OIDC_ISSUER).protocol === 'http:' && !insecureOk) throw new Error('OIDC_ISSUER must use https');
  const config = await client.discovery(
    new URL(env.OIDC_ISSUER), env.OIDC_CLIENT_ID, env.OIDC_CLIENT_SECRET, env.OIDC_CLIENT_SECRET ? undefined : client.None(),
    insecureOk ? { execute: [client.allowInsecureRequests] } : undefined,
  );
  cache = { key, at: Date.now(), config };
  return config;
}

export const redirectUri = (env: NewsroomEnv) => new URL('/auth/callback', env.NEWSROOM_BASE_URL).toString();

/** Authorization code flow with PKCE, a random state and a nonce. */
export async function startLogin(env: NewsroomEnv, returnTo: string): Promise<{ url: URL; flow: LoginFlow }> {
  const config = await getConfig(env);
  const codeVerifier = client.randomPKCECodeVerifier();
  const flow: LoginFlow = { state: client.randomState(), nonce: client.randomNonce(), codeVerifier, returnTo };
  const url = client.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri(env),
    scope: env.OIDC_SCOPE,
    code_challenge: await client.calculatePKCECodeChallenge(codeVerifier),
    code_challenge_method: 'S256',
    state: flow.state,
    nonce: flow.nonce,
  });
  return { url, flow };
}

/** Exchanges the callback for tokens, checking state, nonce, PKCE, issuer, audience and signature. */
export async function finishLogin(env: NewsroomEnv, flow: LoginFlow, search: string, now = Date.now()): Promise<Session> {
  const config = await getConfig(env);
  const callback = new URL(`${redirectUri(env)}${search}`);
  const tokens = await client.authorizationCodeGrant(config, callback, {
    pkceCodeVerifier: flow.codeVerifier, expectedState: flow.state, expectedNonce: flow.nonce, idTokenExpected: true,
  });
  const claims = tokens.claims();
  if (!claims?.sub) throw new Error('The identity provider sent no subject');
  return {
    sub: claims.sub,
    name: typeof claims.name === 'string' ? claims.name : null,
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    expiresAt: Math.floor(now / 1000) + (tokens.expires_in ?? 900),
  };
}

export async function endSessionUrl(env: NewsroomEnv, session: Session | null): Promise<URL | null> {
  const config = await getConfig(env);
  if (!config.serverMetadata().end_session_endpoint) return null;
  return client.buildEndSessionUrl(config, {
    post_logout_redirect_uri: new URL('/signed-out', env.NEWSROOM_BASE_URL).toString(),
    ...(session?.idToken ? { id_token_hint: session.idToken } : {}),
  });
}
