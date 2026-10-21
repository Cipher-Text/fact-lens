import { Pool } from 'pg';

export const PG_POOL = Symbol('PG_POOL');

export function createPool(connectionString: string): Pool {
  const pool = new Pool({ connectionString, max: 10, connectionTimeoutMillis: 2000 });
  // An idle client error is unhandled otherwise and can crash the process.
  // Query failures still surface to callers; readiness reports the database as down.
  pool.on('error', () => {});
  return pool;
}
