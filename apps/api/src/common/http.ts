import { BadRequestException } from '@nestjs/common';
import type { Principal } from '@fact-lens/contracts';
import type { FastifyRequest } from 'fastify';
import type { ZodType } from 'zod';

/** Validates untrusted input against a contract schema; a failure is a 400 with the issues. */
export function parse<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new BadRequestException({ message: 'Invalid request', issues: result.error.issues });
  return result.data;
}

export interface Actor {
  principal: Principal;
  requestId: string;
}

export const actorOf = (principal: Principal, req: FastifyRequest): Actor => ({ principal, requestId: String(req.id) });

export const isPgError = (e: unknown): e is { code: string; constraint?: string } =>
  typeof e === 'object' && e !== null && 'code' in e;
