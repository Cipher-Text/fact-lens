import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Capability } from '@fact-lens/contracts';
import { AuthorizationService } from './authorization.service';
import { AuthService } from './auth.service';
import { IS_PUBLIC, REQUIRED_ANY_CAPABILITIES, REQUIRED_CAPABILITIES, type AuthedRequest } from './decorators';

/**
 * Default deny: a route is open only when marked @Public(). Otherwise it needs a valid
 * bearer token, and the capabilities named by @RequireCapability() / @RequireAnyCapability().
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(AuthorizationService) private readonly authz: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const header = request.headers.authorization;
    const match = typeof header === 'string' ? /^Bearer ([\w\-.~+/]+=*)$/i.exec(header) : null;
    if (!match) throw new UnauthorizedException('Authentication required');

    const principal = await this.auth.authenticate(match[1]!);
    if (!principal) throw new UnauthorizedException('Authentication required');
    request.principal = principal;

    const ctx = {
      requestId: String(request.id),
      objectType: 'route',
      objectId: `${request.method} ${request.routeOptions?.url ?? request.url.split('?')[0]}`,
    };
    const all = this.reflector.getAllAndOverride<Capability[]>(REQUIRED_CAPABILITIES, targets) ?? [];
    const any = this.reflector.getAllAndOverride<Capability[]>(REQUIRED_ANY_CAPABILITIES, targets) ?? [];
    if (all.length > 0) await this.authz.requireAll(principal, all, ctx);
    if (any.length > 0) await this.authz.requireAny(principal, any, ctx);
    return true;
  }
}
