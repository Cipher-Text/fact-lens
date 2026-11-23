import { capabilitySchema, type Capability, type Principal } from '@fact-lens/contracts';
import type { Pool } from 'pg';
import type { CapabilityStore } from './auth.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The capabilities the given roles grant, with anything the contract does not know dropped. */
export async function grantedCapabilities(store: CapabilityStore, roles: string[]): Promise<Capability[]> {
  const granted = await store.capabilitiesFor(roles);
  return [...new Set(granted.filter((c) => capabilitySchema.safeParse(c).success))];
}

/**
 * The principal as the database holds it now. A role removed after sign-in loses its power at once, not when the
 * token runs out, and an account that has been turned off gets null. A subject that is not an account of this backend
 * (an external identity) keeps what its token says: this backend has no record to check it against.
 */
export async function currentPrincipal(pool: Pool, store: CapabilityStore, principal: Principal): Promise<Principal | null> {
  if (!UUID.test(principal.subject)) return principal;
  const { rows } = await pool.query<{ status: string; roles: string[] }>(
    `SELECT u.status, COALESCE(array_agg(ur.role_key ORDER BY ur.role_key) FILTER (WHERE ur.role_key IS NOT NULL), '{}') AS roles
       FROM app_user u
       LEFT JOIN user_role ur ON ur.user_id = u.id
      WHERE u.id = $1::uuid
      GROUP BY u.id, u.status`,
    [principal.subject],
  );
  if (!rows[0]) return principal;
  if (rows[0].status !== 'active') return null;
  const roles = rows[0].roles;
  return { ...principal, roles, capabilities: await grantedCapabilities(store, roles) };
}
