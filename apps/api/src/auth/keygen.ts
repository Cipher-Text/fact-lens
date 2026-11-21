import { generateAuthSettings } from './auth-keys';

/**
 * Prints the two settings sign-in inside the backend needs (ADR-046, step A6). Copy them into the root .env, then set
 * AUTH_ISSUER and NEWSROOM_BASE_URL. Run it once per environment: a new key signs out everyone signed in with the old one.
 */
const settings = generateAuthSettings();
console.log('# Paste into the root .env (keep these secret, never commit them):');
for (const [name, value] of Object.entries(settings)) console.log(`${name}=${value}`);
