import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { blankSecrets, fillSecrets, GENERATED, initEnv } from './init-env.mjs';

const example = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
let n = 0;
const fake = () => `generated-secret-${++n}-aaaaaaaaaaaaaaaaaaaaaaaa`;

test('fills the blank secrets and nothing else', () => {
  const out = fillSecrets('A=1\nSESSION_SECRET=\nINTERNAL_API_TOKEN=\n# SESSION_SECRET=\nOTHER_BLANK=\n', fake);
  assert.match(out, /^SESSION_SECRET=generated-secret-\d+-/m);
  assert.match(out, /^INTERNAL_API_TOKEN=generated-secret-\d+-/m);
  assert.match(out, /^# SESSION_SECRET=$/m);
  assert.match(out, /^OTHER_BLANK=$/m);
  assert.match(out, /^A=1$/m);
});

test('keeps a secret that someone already typed', () => {
  assert.equal(fillSecrets('SESSION_SECRET=mine\n', fake), 'SESSION_SECRET=mine\n');
});

test('makes different secrets and long enough ones', () => {
  const out = fillSecrets('SESSION_SECRET=\nINTERNAL_API_TOKEN=\n');
  const [a, b] = out.trim().split('\n').map((l) => l.split('=')[1]);
  assert.notEqual(a, b);
  assert.ok(a.length >= 32 && b.length >= 32, 'secrets must be at least 32 characters');
  assert.match(a, /^[A-Za-z0-9_-]+$/);
});

test('the example leaves every generated variable blank, so init fills it', () => {
  for (const name of GENERATED) assert.match(example, new RegExp(`^${name}=$`, 'm'), name);
});

test('creates .env once, private to the owner', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fl-env-'));
  writeFileSync(join(dir, '.env.example'), example);
  const first = initEnv(dir, fake);
  assert.equal(first.created, true);
  const text = readFileSync(first.path, 'utf8');
  assert.doesNotMatch(text, /^SESSION_SECRET=$/m);
  assert.deepEqual(blankSecrets(text), []);
  assert.equal(statSync(first.path).mode & 0o777, 0o600);
});

test('in an existing .env it fills only the blank secrets and changes nothing else', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fl-env-'));
  writeFileSync(join(dir, '.env.example'), example);
  const mine = 'DATABASE_URL=postgres://me@db.internal/mine\n# a comment of mine\nSESSION_SECRET=\nINTERNAL_API_TOKEN=keep-this-one-it-was-typed-by-hand-xxxxxxxx\nEXTRA=1\n';
  writeFileSync(join(dir, '.env'), mine);
  const result = initEnv(dir, fake);
  assert.equal(result.created, false);
  assert.deepEqual(result.filled, ['SESSION_SECRET']);
  const after = readFileSync(result.path, 'utf8').split('\n');
  assert.match(after[2], /^SESSION_SECRET=generated-secret-\d+-/);
  assert.deepEqual([after[0], after[1], after[3], after[4]], mine.split('\n').filter((_, i) => [0, 1, 3, 4].includes(i)));
});

test('adds a secret that is missing altogether, keeping the rest', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fl-env-'));
  writeFileSync(join(dir, '.env.example'), example);
  writeFileSync(join(dir, '.env'), 'A=1\nSESSION_SECRET=typed-by-hand-and-long-enough-xxxxxxxxxxxx');
  const result = initEnv(dir, fake);
  assert.deepEqual(result.filled, ['INTERNAL_API_TOKEN']);
  const lines = readFileSync(result.path, 'utf8').trim().split('\n');
  assert.deepEqual(lines.slice(0, 2), ['A=1', 'SESSION_SECRET=typed-by-hand-and-long-enough-xxxxxxxxxxxx']);
  assert.match(lines[2], /^INTERNAL_API_TOKEN=generated-secret-\d+-/);
  assert.equal(lines.length, 3);
});

test('running it again changes nothing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fl-env-'));
  writeFileSync(join(dir, '.env.example'), example);
  initEnv(dir, fake);
  const before = readFileSync(join(dir, '.env'), 'utf8');
  const again = initEnv(dir, fake);
  assert.deepEqual([again.created, again.filled], [false, []]);
  assert.equal(readFileSync(join(dir, '.env'), 'utf8'), before);
});

test('treats a missing line as blank so a stale file is not left without a secret', () => {
  assert.deepEqual(blankSecrets('A=1\nSESSION_SECRET=x\n'), ['INTERNAL_API_TOKEN']);
  assert.deepEqual(blankSecrets('SESSION_SECRET=  \nINTERNAL_API_TOKEN=y\n'), ['SESSION_SECRET']);
});
