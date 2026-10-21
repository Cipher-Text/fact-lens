// Creates the root .env from .env.example and fills in the secrets that must be random.
// Safe to run twice: it never overwrites an existing .env.
import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Variables that are blank in the example and must not stay blank. */
export const GENERATED = ['SESSION_SECRET', 'INTERNAL_API_TOKEN'];

const randomSecret = () => randomBytes(36).toString('base64url'); // 48 characters

/** Fills a generated variable only when its line is empty, so a value someone typed is kept. */
export function fillSecrets(text, random = randomSecret) {
  return text
    .split('\n')
    .map((line) => {
      const match = /^([A-Z][A-Z0-9_]*)=$/.exec(line);
      return match && GENERATED.includes(match[1]) ? `${match[1]}=${random()}` : line;
    })
    .join('\n');
}

export function initEnv(root, random) {
  const target = resolve(root, '.env');
  if (existsSync(target)) return { created: false, path: target };
  writeFileSync(target, fillSecrets(readFileSync(resolve(root, '.env.example'), 'utf8'), random), { mode: 0o600 });
  chmodSync(target, 0o600); // the file holds secrets
  return { created: true, path: target };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const { created, path } = initEnv(root);
  console.log(created ? `Created ${path} with new secrets.` : `${path} already exists; left as it is.`);
}
