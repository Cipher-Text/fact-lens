import { loadApiEnv } from '@fact-lens/config';
import type { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
import { createPool } from '../db/pool';
import { parse } from '../common/http';
import { invitationCreateSchema } from '@fact-lens/contracts';
import { AccountsService } from './accounts.service';
import { signInOptionsFromEnv } from './auth-keys';
import type { SignInOptions } from './sign-in.options';

/**
 * Creates the first administrator from the command line (ADR-046, step A6). Refuses when an administrator already
 * exists: after that, administrators invite people from the newsroom. The result is a one-time link for the new
 * administrator to set a password and an authenticator app; no password is ever printed.
 */
export async function bootstrapAdmin(pool: Pool, options: SignInOptions, email: string, displayName: string): Promise<{ link: string; expiresAt: string }> {
  const input = parse(invitationCreateSchema, { email, displayName, roleKeys: ['admin'] });
  const existing = await pool.query(`SELECT 1 FROM user_role WHERE role_key = 'admin' LIMIT 1`);
  if (existing.rows[0]) throw new Error('An administrator already exists. Ask them to invite you from the newsroom.');
  const accounts = new AccountsService(pool, new AuditService(pool), options);
  const invitation = await accounts.invite(input, {
    principal: { subject: 'bootstrap', roles: [], capabilities: [], mfa: true },
    requestId: 'bootstrap',
  });
  return { link: invitation.link, expiresAt: invitation.expiresAt };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const value = (name: string) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const email = value('--email');
  const name = value('--name');
  if (!email || !name) {
    console.error('Usage: pnpm --filter @fact-lens/api auth:bootstrap -- --email <address> --name "<display name>"');
    process.exit(2);
  }
  const env = loadApiEnv();
  const options = signInOptionsFromEnv(env);
  if (!options) {
    console.error('Sign-in is not configured: set AUTH_SIGNING_KEY, AUTH_ENCRYPTION_KEY, AUTH_ISSUER and NEWSROOM_BASE_URL.');
    process.exit(1);
  }
  const pool = createPool(env.DATABASE_URL);
  try {
    const result = await bootstrapAdmin(pool, options, email, name);
    console.log('Administrator created. Open this link once, within 72 hours, to set a password and an authenticator app:');
    console.log(result.link);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

// Runs as a command (ts-node/tsx in development, dist/auth/bootstrap.js in the image), not when a test imports it.
if (/bootstrap\.(ts|js)$/.test(process.argv[1] ?? '')) void main();
