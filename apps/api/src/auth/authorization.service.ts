import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { privilegedCapabilities, type Capability, type Principal } from '@fact-lens/contracts';
import { AuditService } from '../audit/audit.service';
import { AuthService } from './auth.service';

const privileged = new Set<string>(privilegedCapabilities);

export interface AuthzContext {
  requestId: string;
  /** What the caller tried to reach, for the audit trail (a route or a news item id). */
  objectType: string;
  objectId: string;
}

/**
 * The one place that decides whether a principal may do something. Used by the route guard
 * and by services that pick the needed capability at run time (workflow transitions).
 * A denial for a signed-in caller is audited; failures of the check itself never leak detail.
 */
@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** The caller needs every capability in the list. */
  async requireAll(principal: Principal, needed: readonly Capability[], ctx: AuthzContext): Promise<void> {
    const missing = needed.filter((c) => !principal.capabilities.includes(c));
    if (missing.length > 0) return this.deny(principal, `missing ${missing.join(', ')}`, ctx);
    if (needed.some((c) => privileged.has(c))) await this.checkMfa(principal, ctx);
  }

  /** The caller needs at least one capability in the list. */
  async requireAny(principal: Principal, needed: readonly Capability[], ctx: AuthzContext): Promise<void> {
    const held = needed.filter((c) => principal.capabilities.includes(c));
    if (held.length === 0) return this.deny(principal, `missing one of ${needed.join(', ')}`, ctx);
    if (held.every((c) => privileged.has(c))) await this.checkMfa(principal, ctx);
  }

  private async checkMfa(principal: Principal, ctx: AuthzContext): Promise<void> {
    if (this.auth.requireMfa && !principal.mfa) {
      await this.record(principal, 'mfa required', ctx);
      throw new ForbiddenException({ message: 'Multi-factor sign-in required', reason: 'mfa_required' });
    }
  }

  private async deny(principal: Principal, why: string, ctx: AuthzContext): Promise<never> {
    await this.record(principal, why, ctx);
    throw new ForbiddenException('Not allowed');
  }

  private async record(principal: Principal, why: string, ctx: AuthzContext) {
    try {
      await this.audit.record({
        actorType: 'human', actorId: principal.subject, action: 'authz.denied',
        objectType: ctx.objectType, objectId: ctx.objectId, reason: why, requestId: ctx.requestId,
      });
    } catch (err) {
      this.logger.error(`audit write failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
