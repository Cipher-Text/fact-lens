// Checks that DATABASE_URL really works (the port answering is not enough) and, when it does not,
// says what is wrong and the commands that fix it. It never changes the database.
//   DATABASE_URL=postgres://... node scripts/check-db.mjs      exit 0: usable, 1: not usable
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

function parts(url) {
  try {
    const u = new URL(url);
    return {
      user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), host: u.hostname || 'localhost',
      port: u.port || '5432', database: decodeURIComponent(u.pathname.slice(1)),
    };
  } catch {
    return null;
  }
}

const quote = (s) => `'${String(s).replaceAll("'", "''")}'`;

/** A message for a failed connection. Pure, so it can be tested without a server. */
export function explain(error, url) {
  const p = parts(url);
  if (!p) return 'DATABASE_URL is not a valid address. It should look like postgres://user:password@host:5432/database.';
  const where = `${p.host}:${p.port}`;
  const createDb = p.database && p.database !== 'postgres' ? ` -c "CREATE DATABASE ${p.database} OWNER ${p.user}"` : '';
  const fix = `psql -h ${p.host} -p ${p.port} -d postgres -c "CREATE ROLE ${p.user} LOGIN PASSWORD ${quote(p.password)} CREATEDB"${createDb}`;
  switch (error?.code) {
    case '28000':
      return `PostgreSQL at ${where} has no login named "${p.user}".\n` +
        `  Either create it (run this as a PostgreSQL superuser; on Homebrew that is your own account):\n    ${fix}\n` +
        `  or set DATABASE_URL in .env to a login you already have.`;
    case '28P01':
      return `PostgreSQL at ${where} rejected the password for "${p.user}".\n` +
        `  Set the right password in DATABASE_URL in .env, or change it in PostgreSQL:\n    psql -h ${p.host} -p ${p.port} -d postgres -c "ALTER ROLE ${p.user} PASSWORD ${quote(p.password)}"`;
    case '3D000':
      return `PostgreSQL at ${where} has no database named "${p.database}".\n  Create it:\n    psql -h ${p.host} -p ${p.port} -d postgres -c "CREATE DATABASE ${p.database} OWNER ${p.user}"`;
    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
      return `Nothing answered at ${where}. Start PostgreSQL, or fix the host and port in DATABASE_URL.`;
    default:
      return `Could not connect to ${where} as "${p.user}": ${error?.message ?? error}`;
  }
}

export async function check(url) {
  const { Client } = createRequire(new URL('../apps/api/package.json', import.meta.url))('pg');
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 4000 });
  client.on('error', () => {});
  try {
    await client.connect();
    const { rows } = await client.query('SELECT current_user AS name, (SELECT rolcreatedb FROM pg_roles WHERE rolname = current_user) AS createdb');
    return { ok: true, user: rows[0].name, createdb: rows[0].createdb };
  } catch (error) {
    return { ok: false, message: explain(error, url) };
  } finally {
    await client.end().catch(() => {});
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = process.env.DATABASE_URL ?? '';
  const result = await check(url);
  if (!result.ok) {
    console.error(result.message);
    process.exit(1);
  }
  console.log(`signed in as "${result.user}"${result.createdb ? '' : ' (this login cannot create databases, so the test suites that make temporary databases will fail)'}`);
}
