import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import type { Type } from '@nestjs/common';
import { MAX_MEDIA_BYTES, mediaUploadTypes } from '@fact-lens/contracts';
import { ErrorEnvelopeFilter } from './error-envelope.filter';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * With TRUST_PROXY on, the client address is the entry that the one proxy in front appended to X-Forwarded-For: the last
 * entry, which a client cannot write. The first entry is whatever the client sent, so it is never used. One hop only:
 * a deployment with two proxies in front needs a different setting.
 */
export function trustProxySetting(trustProxy: boolean): ((address: string, hop: number) => boolean) | false {
  // Hop 0 is the socket address, the one proxy. Hop 1 and on are the entries the client may have written.
  return trustProxy ? (_address, hop) => hop === 0 : false;
}

export async function createApp(module: Type<unknown>, logLevel = 'info', trustProxy = false): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter({
    logger: { level: logLevel },
    trustProxy: trustProxySetting(trustProxy),
    genReqId: (req: { headers: Record<string, string | string[] | undefined> }) => {
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
