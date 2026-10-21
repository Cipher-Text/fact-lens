import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fillSecrets, GENERATED, initEnv } from './init-env.mjs';

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

test('creates .env once, private to the owner, and never overwrites it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fl-env-'));
  writeFileSync(join(dir, '.env.example'), example);
  const first = initEnv(dir, fake);
  assert.equal(first.created, true);
  const text = readFileSync(first.path, 'utf8');
  assert.doesNotMatch(text, /^SESSION_SECRET=$/m);
  assert.equal(statSync(first.path).mode & 0o777, 0o600);
  writeFileSync(first.path, 'SESSION_SECRET=edited\n');
  assert.equal(initEnv(dir, fake).created, false);
  assert.equal(readFileSync(first.path, 'utf8'), 'SESSION_SECRET=edited\n');
});
