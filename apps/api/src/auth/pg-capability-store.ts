import type { Capability } from '@fact-lens/contracts';
import type { Pool } from 'pg';
import type { CapabilityStore } from './auth.service';

export class PgCapabilityStore implements CapabilityStore {
  constructor(private readonly pool: Pool) {}

  async capabilitiesFor(roles: string[]): Promise<Capability[]> {
    if (roles.length === 0) return [];
    const { rows } = await this.pool.query<{ capability: Capability }>(
      'SELECT DISTINCT capability FROM app_role_capability WHERE role_key = ANY($1::text[])',
      [roles],
    );
    return rows.map((r) => r.capability);
  }
}
