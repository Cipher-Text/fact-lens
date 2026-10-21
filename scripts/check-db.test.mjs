import assert from 'node:assert/strict';
import { test } from 'node:test';
import { check, explain } from './check-db.mjs';

const url = 'postgres://factlens:s3cret@localhost:5432/factlens';

test('a missing login names the user and gives the command that creates it', () => {
  const m = explain({ code: '28000' }, url);
  assert.match(m, /no login named "factlens"/);
  assert.match(m, /CREATE ROLE factlens LOGIN PASSWORD 's3cret' CREATEDB/);
  assert.match(m, /CREATE DATABASE factlens OWNER factlens/);
  assert.match(m, /or set DATABASE_URL in \.env/);
});

test('the default postgres database is never offered for creation', () => {
  const m = explain({ code: '28000' }, 'postgres://u:p@h:5432/postgres');
  assert.match(m, /CREATE ROLE u LOGIN/);
  assert.doesNotMatch(m, /CREATE DATABASE/);
});

test('a wrong password and a missing database each get their own advice', () => {
  assert.match(explain({ code: '28P01' }, url), /rejected the password for "factlens"/);
  assert.match(explain({ code: '3D000' }, url), /no database named "factlens"[\s\S]*CREATE DATABASE factlens/);
});

test('a refused connection says nothing is listening', () => {
  assert.match(explain({ code: 'ECONNREFUSED' }, url), /Nothing answered at localhost:5432/);
});

test('a quote in the password cannot break out of the suggested command', () => {
  const m = explain({ code: '28000' }, "postgres://u:it's@h:5432/d");
  assert.match(m, /PASSWORD 'it''s'/);
});

test('an invalid address and an unknown error are reported plainly', () => {
  assert.match(explain({ code: '28000' }, 'not a url'), /not a valid address/);
  assert.match(explain({ message: 'boom' }, url), /Could not connect to localhost:5432 as "factlens": boom/);
});

test('check() reports a refused connection as not usable, without throwing', async () => {
  const r = await check('postgres://x:y@127.0.0.1:1/z');
  assert.equal(r.ok, false);
  assert.match(r.message, /Nothing answered at 127\.0\.0\.1:1/);
});
