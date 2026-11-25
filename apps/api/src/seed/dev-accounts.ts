import { randomBytes } from 'node:crypto';
import type { Pool } from 'pg';
import { hashPassword } from '../auth/credentials';
import { DEV_ACCOUNT_DOMAIN } from '../auth/sign-in.options';
import { roles } from './data';

/** The address of the dev account for a role: `reporter` is reporter@dev.factlens.test, `desk_editor` is desk-editor@dev.factlens.test. */
export const devEmailFor = (roleKey: string): string => `${roleKey.replace(/_/g, '-')}@${DEV_ACCOUNT_DOMAIN}`;

/**
 * Development only (ADR-064): one active account for every role, on the reserved dev address, so the newsroom's quick
 * sign-in can enter as any of them. Safe to run again: an account that exists is kept. Each gets a random password that
 * nobody knows, so an account can be entered only through the quick sign-in, and none has an authenticator app.
 * Run this only when DEV_QUICK_LOGIN is on; the environment check refuses that setting in production.
 */
export async function seedDevAccounts(pool: Pool): Promise<{ created: number; existing: number }> {
  let created = 0;
  let existing = 0;
  for (const role of roles) {
    const email = devEmailFor(role.key);
    const found = await pool.query<{ id: string }>('SELECT id FROM app_user WHERE lower(email) = $1', [email]);
    let id = found.rows[0]?.id;
    if (id) {
      existing++;
    } else {
      const hash = await hashPassword(randomBytes(32).toString('hex'));
      const inserted = await pool.query<{ id: string }>(
        `INSERT INTO app_user (email, display_name, password_hash, status) VALUES ($1, $2, $3, 'active') RETURNING id`,
        [email, `Dev ${role.name}`, hash],
      );
      id = inserted.rows[0]!.id;
      created++;
    }
    await pool.query('INSERT INTO user_role (user_id, role_key) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, role.key]);
  }
  return { created, existing };
}
