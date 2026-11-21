import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Password hashing (ADR-046, docs/plans/auth-in-app.md, step A3). Argon2id from Node's own crypto module, with the
 * OWASP parameters: 19 MiB of memory, two passes, one lane. The stored form records its own parameters, so they can be
 * raised later without breaking existing passwords: `argon2id$v=19$m=<KiB>,t=<passes>,p=<lanes>$<salt>$<hash>`.
 */

const PARAMS = { memory: 19456, passes: 2, parallelism: 1 } as const;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

function derive(password: string, salt: Buffer, params: { memory: number; passes: number; parallelism: number }, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    argon2('argon2id', {
      message: Buffer.from(password, 'utf8'),
      nonce: salt,
      parallelism: params.parallelism,
      passes: params.passes,
      memory: params.memory,
      tagLength: length,
    }, (error, hash) => (error ? reject(error) : resolve(hash)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await derive(password, salt, PARAMS, HASH_BYTES);
  return `argon2id$v=19$m=${PARAMS.memory},t=${PARAMS.passes},p=${PARAMS.parallelism}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

/** Checks a password against a stored hash in constant time. A malformed stored value is a failed check, never an error. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 5 || parts[0] !== 'argon2id' || parts[1] !== 'v=19') return false;
  const params = /^m=(\d+),t=(\d+),p=(\d+)$/.exec(parts[2] ?? '');
  if (!params) return false;
  const memory = Number(params[1]);
  const passes = Number(params[2]);
  const parallelism = Number(params[3]);
  const salt = Buffer.from(parts[3] ?? '', 'base64');
  const expected = Buffer.from(parts[4] ?? '', 'base64');
  if (expected.length === 0 || salt.length === 0) return false;
  const actual = await derive(password, salt, { memory, passes, parallelism }, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * A hash checked when no account matches the address, so a failed sign-in takes as long whether or not the account
 * exists. The password it stands for is random and never used.
 */
let dummy: Promise<string> | null = null;
export function verifyAgainstDummy(password: string): Promise<boolean> {
  dummy ??= hashPassword(randomBytes(24).toString('base64'));
  return dummy.then((stored) => verifyPassword(password, stored)).then(() => false);
}

/**
 * Passwords so common that a stolen list would open them first. A starting list; the full check is widened later
 * (docs/plans/auth-in-app.md, password rules). Compared without regard to case.
 */
const COMMON = new Set([
  'password', 'password1', 'password123', 'passw0rd', 'qwerty', 'qwerty123', 'letmein', 'welcome', 'welcome1', 'admin',
  'admin123', 'iloveyou', '123456', '12345678', '123456789', '1234567890', 'abc123', 'monkey', 'dragon', 'football',
  'baseball', 'changeme', 'secret', 'trustno1', 'sunshine', 'master', 'login', 'princess', 'starwars', 'whatever',
  'freedom', 'hello123', 'bangladesh', 'factlens', 'newsroom', 'editor123', 'password12', 'qwertyuiop', 'zaq12wsx',
]);

export function isCommonPassword(password: string): boolean {
  return COMMON.has(password.toLowerCase());
}
