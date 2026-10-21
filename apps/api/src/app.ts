import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import type { Type } from '@nestjs/common';
import { ErrorEnvelopeFilter } from './error-envelope.filter';

const REQUEST_ID_HEADER = 'x-request-id';

export async function createApp(module: Type<unknown>, logLevel = 'info'): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter({
    logger: { level: logLevel },
    genReqId: (req: IncomingMessage) => {
      const incoming = req.headers[REQUEST_ID_HEADER];
      return typeof incoming === 'string' && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID();
    },
    requestIdHeader: false,
  });
  const app = await NestFactory.create<NestFastifyApplication>(module, adapter, { bufferLogs: true });
  app.useGlobalFilters(new ErrorEnvelopeFilter());
  app.getHttpAdapter().getInstance().addHook('onSend', async (req, reply) => {
    void reply.header(REQUEST_ID_HEADER, req.id);
  });
  return app;
}
