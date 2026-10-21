import {
  CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, Logger, UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { privilegedCapabilities, type Capability } from '@fact-lens/contracts';
import { AuditService } from '../audit/audit.service';
import { AuthService } from './auth.service';
import { IS_PUBLIC, REQUIRED_CAPABILITIES, type AuthedRequest } from './decorators';

const privileged = new Set<string>(privilegedCapabilities);

/**
 * Default deny: a route is open only when marked @Public(). Otherwise it needs a valid
 * bearer token, and every capability named by @RequireCapability().
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(AuditService) private readonly audit: AuditService,
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

    const required = this.reflector.getAllAndOverride<Capability[]>(REQUIRED_CAPABILITIES, targets) ?? [];
    const missing = required.filter((c) => !principal.capabilities.includes(c));
    if (missing.length > 0) {
      await this.recordDenied(request, principal.subject, `missing ${missing.join(', ')}`);
      throw new ForbiddenException('Not allowed');
    }
    if (this.auth.requireMfa && !principal.mfa && required.some((c) => privileged.has(c))) {
      await this.recordDenied(request, principal.subject, 'mfa required');
      throw new ForbiddenException({ message: 'Multi-factor sign-in required', reason: 'mfa_required' });
    }
    return true;
  }

  /** Only authenticated callers are audited, so anonymous traffic cannot flood the log. */
  private async recordDenied(request: AuthedRequest, subject: string, why: string) {
    try {
      await this.audit.record({
        actorType: 'human', actorId: subject, action: 'authz.denied', objectType: 'route',
        objectId: `${request.method} ${request.routeOptions?.url ?? request.url.split('?')[0]}`,
        reason: why, requestId: String(request.id),
      });
    } catch (err) {
      this.logger.error(`audit write failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
