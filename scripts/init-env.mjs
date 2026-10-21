// Creates the root .env from .env.example and fills in the secrets that must be random.
// If .env already exists it only fills secrets that are still blank: no other line is touched and
// no value that someone set is replaced. Safe to run any number of times.
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

const blankLine = (name) => new RegExp(`^${name}=[ \\t]*$`, 'm');
const hasLine = (name) => new RegExp(`^${name}=`, 'm');

/** Generated variables that are blank or missing in `text`. */
export function blankSecrets(text) {
  return GENERATED.filter((name) => blankLine(name).test(text) || !hasLine(name).test(text));
}

export function initEnv(root, random = randomSecret) {
  const target = resolve(root, '.env');
  if (existsSync(target)) {
    const text = readFileSync(target, 'utf8');
    const needed = blankSecrets(text);
    if (needed.length === 0) return { created: false, filled: [], path: target };
    // Blank lines are filled in place; a variable that is missing altogether is added at the end.
    let next = fillSecrets(text.replace(/^([A-Z][A-Z0-9_]*)=[ \t]+$/gm, '$1='), random);
    for (const name of needed.filter((n) => !hasLine(n).test(text))) {
      next = `${next.replace(/\n*$/, '\n')}${name}=${random()}\n`;
    }
    writeFileSync(target, next);
    return { created: false, filled: needed, path: target };
  }
  writeFileSync(target, fillSecrets(readFileSync(resolve(root, '.env.example'), 'utf8'), random), { mode: 0o600 });
  chmodSync(target, 0o600); // the file holds secrets
  return { created: true, filled: [...GENERATED], path: target };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const { created, filled, path } = initEnv(root);
  if (created) console.log(`Created ${path} with new secrets.`);
  else if (filled.length > 0) console.log(`Filled the blank ${filled.join(' and ')} in ${path}. Nothing else was changed.`);
  else console.log(`${path} already exists and has its secrets; left as it is.`);
}
