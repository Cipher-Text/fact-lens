import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import type { Type } from '@nestjs/common';
import { MAX_MEDIA_BYTES, mediaUploadTypes } from '@fact-lens/contracts';
import { ErrorEnvelopeFilter } from './error-envelope.filter';

const REQUEST_ID_HEADER = 'x-request-id';

/** `trustProxy` makes `request.ip` the client address from X-Forwarded-For. Turn it on only behind a proxy you control. */
export async function createApp(module: Type<unknown>, logLevel = 'info', trustProxy = false): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter({
    logger: { level: logLevel },
    trustProxy,
    genReqId: (req: IncomingMessage) => {
      const incoming = req.headers[REQUEST_ID_HEADER];
      return typeof incoming === 'string' && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID();
    },
    requestIdHeader: false,
  });
  const app = await NestFactory.create<NestFastifyApplication>(module, adapter, { bufferLogs: true });
  // An upload is the image itself as the body. The hard cap is the ceiling; the service applies the configured limit.
  app.getHttpAdapter().getInstance().addContentTypeParser([...mediaUploadTypes], { parseAs: 'buffer', bodyLimit: MAX_MEDIA_BYTES }, (_req, body, done) => done(null, body));
  app.useGlobalFilters(new ErrorEnvelopeFilter());
  app.getHttpAdapter().getInstance().addHook('onSend', async (req, reply) => {
    void reply.header(REQUEST_ID_HEADER, req.id);
  });
  return app;
}
