import { createDevIdp } from './index';

const port = Number(process.env.DEV_IDP_PORT ?? 4300);
const redirectUris = (process.env.DEV_IDP_REDIRECT_URIS ?? 'http://localhost:3100/auth/callback,http://127.0.0.1:3100/auth/callback').split(',');

createDevIdp({
  port, redirectUris,
  clientId: process.env.DEV_IDP_CLIENT_ID ?? 'newsroom',
  apiAudience: process.env.OIDC_AUDIENCE ?? 'fact-lens-api',
})
  .then(({ issuer }) => console.log(`Dev identity provider at ${issuer} (sign-in is not real: development only)`))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
