import { Inject, Injectable } from '@nestjs/common';
import { capabilitySchema, type Capability, type Principal } from '@fact-lens/contracts';
import type { JWTPayload } from 'jose';
import { TOKEN_VERIFIER, type TokenVerifier } from './token-verifier';

export const CAPABILITY_STORE = Symbol('CAPABILITY_STORE');
export const AUTH_OPTIONS = Symbol('AUTH_OPTIONS');

export interface CapabilityStore {
  /** Capabilities granted by the given role keys. Unknown roles grant nothing. */
  capabilitiesFor(roles: string[]): Promise<Capability[]>;
}

export interface AuthOptions {
  rolesClaim: string;
  requireMfa: boolean;
}

const MFA_METHODS = new Set(['mfa', 'otp', 'hwk']);

export function readClaim(payload: JWTPayload, path: string): unknown {
  return path.split('.').reduce<unknown>((value, part) => {
    return value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined;
  }, payload);
}

export function rolesFromClaim(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[\s,]+/) : [];
  return [...new Set(raw.filter((r): r is string => typeof r === 'string' && r.length > 0))];
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(TOKEN_VERIFIER) private readonly verifier: TokenVerifier | null,
    @Inject(CAPABILITY_STORE) private readonly store: CapabilityStore,
    @Inject(AUTH_OPTIONS) private readonly options: AuthOptions,
  ) {}

  get requireMfa() {
    return this.options.requireMfa;
  }

  /** Returns the principal for a bearer token, or null when it cannot be trusted. */
  async authenticate(token: string): Promise<Principal | null> {
    if (!this.verifier) return null;
    let payload: JWTPayload;
    try {
      payload = await this.verifier.verify(token);
    } catch {
      return null;
    }
    const subject = payload.sub;
    if (!subject) return null;

    const roles = rolesFromClaim(readClaim(payload, this.options.rolesClaim));
    const granted = await this.store.capabilitiesFor(roles);
    const capabilities = granted.filter((c) => capabilitySchema.safeParse(c).success);
    const amr = Array.isArray(payload.amr) ? payload.amr : [];
    const mfa = amr.some((m) => typeof m === 'string' && MFA_METHODS.has(m));
    return { subject, roles, capabilities: [...new Set(capabilities)], mfa };
  }
}
