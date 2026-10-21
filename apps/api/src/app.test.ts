import { Controller, Get, Module } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { errorEnvelopeSchema } from '@fact-lens/contracts';
import { createApp } from './app';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Controller('boom')
class BoomController {
  @Get()
  boom() {
    throw new Error('secret internal detail');
  }
}

function build(probes: Record<string, () => Promise<void>>) {
  @Module({
    controllers: [HealthController, BoomController],
    providers: [{ provide: HealthService, useValue: new HealthService(probes) }],
  })
  class TestModule {}
  return createApp(TestModule, 'silent');
}

describe('api', () => {
  let up: NestFastifyApplication;
  let down: NestFastifyApplication;

  beforeAll(async () => {
    up = await build({ database: async () => {}, redis: async () => {} });
    down = await build({ database: async () => {}, redis: async () => { throw new Error('x'); } });
    await Promise.all([up.init(), down.init()]);
    await Promise.all([up.getHttpAdapter().getInstance().ready(), down.getHttpAdapter().getInstance().ready()]);
  });
  afterAll(async () => {
    await Promise.all([up.close(), down.close()]);
  });

  it('reports liveness', async () => {
    const res = await up.inject({ method: 'GET', url: '/health/live' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('reports readiness when dependencies are up', async () => {
    const res = await up.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json().checks).toEqual({ database: 'up', redis: 'up' });
  });

  it('returns 503 with failing checks when a dependency is down', async () => {
    const res = await down.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.details.checks.redis).toBe('down');
  });

  it('reports a hung dependency as down instead of hanging', async () => {
    const hung = await build({ database: async () => {}, redis: () => new Promise<void>(() => {}) });
    await hung.init();
    await hung.getHttpAdapter().getInstance().ready();
    const res = await hung.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.details.checks.redis).toBe('down');
    await hung.close();
  }, 10000);

  it('generates a request id and echoes a valid incoming one', async () => {
    const a = await up.inject({ method: 'GET', url: '/health/live' });
    expect(a.headers['x-request-id']).toBeTruthy();
    const b = await up.inject({ method: 'GET', url: '/health/live', headers: { 'x-request-id': 'req-12345678' } });
    expect(b.headers['x-request-id']).toBe('req-12345678');
    const c = await up.inject({ method: 'GET', url: '/health/live', headers: { 'x-request-id': 'bad id!' } });
    expect(c.headers['x-request-id']).not.toBe('bad id!');
  });

  it('wraps unknown routes in the error envelope', async () => {
    const res = await up.inject({ method: 'GET', url: '/nope' });
    expect(res.statusCode).toBe(404);
    expect(errorEnvelopeSchema.safeParse(res.json()).success).toBe(true);
  });

  it('hides internal error details', async () => {
    const res = await up.inject({ method: 'GET', url: '/boom' });
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.json())).not.toContain('secret internal detail');
    expect(res.json().error.code).toBe('internal_error');
  });
});
