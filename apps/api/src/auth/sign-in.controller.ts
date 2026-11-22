import { Body, Controller, HttpCode, Inject, Optional, Post, Req, Res } from '@nestjs/common';
import { mfaVerifySchema, recoverySignInSchema, signInSchema, type SignInResult, type SignedIn } from '@fact-lens/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Public } from './decorators';
import { parse } from '../common/http';
import { limiterAddress, TRUST_PROXY } from '../common/reader-address';
import { SignInService, type Issued } from './sign-in.service';
import { REFRESH_COOKIE, SESSION_SECONDS, type SignInOptions, SIGNIN_OPTIONS } from './sign-in.options';

/** The refresh cookie: HTTP-only, same-site, and only on the auth paths. Secure when the site runs over HTTPS. */
function setRefreshCookie(reply: FastifyReply, token: string, sessionEndsAt: number | undefined, secure: boolean): void {
  const maxAge = sessionEndsAt ? Math.max(0, Math.floor((sessionEndsAt - Date.now()) / 1000)) : SESSION_SECONDS;
  const parts = [`${REFRESH_COOKIE}=${token}`, 'Path=/auth', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAge}`];
  if (secure) parts.push('Secure');
  void reply.header('set-cookie', parts.join('; '));
}

function clearRefreshCookie(reply: FastifyReply, secure: boolean): void {
  const parts = [`${REFRESH_COOKIE}=`, 'Path=/auth', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  void reply.header('set-cookie', parts.join('; '));
}

/** The value of one cookie from a Cookie header, or null. */
export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name && value.length > 0) return value.join('=');
  }
  return null;
}

/**
 * Sign-in endpoints (ADR-046, step A4). Each one is public: it is how a person becomes signed in. Responses are never
 * cached, and the refresh token only ever travels in its HTTP-only cookie, never in a body.
 */
@Public()
@Controller('auth')
export class SignInController {
  constructor(
    @Inject(SignInService) private readonly signIn: SignInService,
    @Inject(SIGNIN_OPTIONS) private readonly options: SignInOptions | null,
    @Optional() @Inject(TRUST_PROXY) private readonly trustProxy: boolean = false,
  ) {}

  /** The password step. */
  @Post('sign-in')
  @HttpCode(200)
  async password(@Body() body: unknown, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<SignInResult> {
    const input = parse(signInSchema, body);
    return this.finish(await this.signIn.signIn(input.email, input.password, limiterAddress(req, this.trustProxy)), reply);
  }

  /** The code step: an authenticator-app code. */
  @Post('mfa')
  @HttpCode(200)
  async code(@Body() body: unknown, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<SignedIn> {
    const input = parse(mfaVerifySchema, body);
    return this.finish(await this.signIn.verifyAuthenticatorCode(input.challengeToken, input.code, limiterAddress(req, this.trustProxy)), reply);
  }

  /** The code step with a recovery code, which works once. */
  @Post('mfa/recovery')
  @HttpCode(200)
  async recovery(@Body() body: unknown, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<SignedIn> {
    const input = parse(recoverySignInSchema, body);
    return this.finish(await this.signIn.verifyRecoveryCode(input.challengeToken, input.recoveryCode, limiterAddress(req, this.trustProxy)), reply);
  }

  /** A new access token and a new refresh token, from the refresh cookie. */
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<SignedIn> {
    const token = readCookie(req.headers.cookie, REFRESH_COOKIE);
    return this.finish(await this.signIn.refresh(token, limiterAddress(req, this.trustProxy)), reply);
  }

  /** Ends the sign-in. Always clears the cookie, so the browser forgets it even if the sign-in was already over. */
  @Post('sign-out')
  @HttpCode(204)
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<void> {
    await this.signIn.signOut(readCookie(req.headers.cookie, REFRESH_COOKIE));
    clearRefreshCookie(reply, this.options?.secureCookies ?? false);
  }

  private finish<T extends SignInResult | SignedIn>(issued: Issued<T>, reply: FastifyReply): T {
    void reply.header('cache-control', 'no-store');
    if (issued.refreshToken) setRefreshCookie(reply, issued.refreshToken, issued.sessionEndsAt, this.options?.secureCookies ?? false);
    return issued.body;
  }
}
