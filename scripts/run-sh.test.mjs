import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { test } from 'node:test';

const run = (args) => spawnSync('bash', ['run.sh', ...args], { encoding: 'utf8', timeout: 20000 });
const SERVICES = ['dev identity provider', 'API', 'worker', 'newsroom', 'public web'];

test('run.sh is executable and has valid bash syntax', () => {
  accessSync('run.sh', constants.X_OK);
  const r = spawnSync('bash', ['-n', 'run.sh'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});

test('help explains the commands and the order', () => {
  const r = run(['--help']);
  assert.equal(r.status, 0);
  for (const word of ['start', 'stop', 'status', 'logs', '--no-web', '--detach', 'identity provider -> API -> worker -> newsroom -> web']) {
    assert.ok(r.stdout.includes(word), `help should mention ${word}`);
  }
});

test('an unknown command fails with a clear message and starts nothing', () => {
  const r = run(['launch']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /unknown command: launch/);
});

test('an unknown option to start fails before anything is started', () => {
  const r = run(['start', '--nope']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /unknown option: --nope/);
});

test('status lists all five services', () => {
  const r = run(['status']);
  assert.equal(r.status, 0);
  for (const name of SERVICES) assert.ok(r.stdout.includes(name), `status should list ${name}`);
});

test('logs refuses a service name it does not know', () => {
  const r = run(['logs', 'nothing']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /unknown service: nothing/);
});
