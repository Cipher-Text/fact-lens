import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Capability, Principal } from '@fact-lens/contracts';
import type { FastifyRequest } from 'fastify';

export const IS_PUBLIC = 'auth:public';
export const REQUIRED_CAPABILITIES = 'auth:capabilities';

/** Opts a route out of authentication. Every other route requires a valid bearer token. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** The caller needs every listed capability. */
export const RequireCapability = (...capabilities: Capability[]) => SetMetadata(REQUIRED_CAPABILITIES, capabilities);

export type AuthedRequest = FastifyRequest & { principal?: Principal };

export const CurrentPrincipal = createParamDecorator((_: unknown, ctx: ExecutionContext): Principal => {
  const principal = ctx.switchToHttp().getRequest<AuthedRequest>().principal;
  if (!principal) throw new Error('CurrentPrincipal used on a route without authentication');
  return principal;
});
