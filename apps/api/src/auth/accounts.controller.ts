import { Body, Controller, Get, HttpCode, Inject, Param, ParseUUIDPipe, Post, Put, Req, Res } from '@nestjs/common';
import {
  accountRolesSchema, accountStatusChangeSchema, enrolmentConfirmSchema, invitationAcceptSchema, invitationCreateSchema,
  type Account, type Invitation, type InvitationAccepted, type Principal, type RecoveryCodes,
} from '@fact-lens/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { parse } from '../common/http';
import { actorOf } from '../common/http';
import { CurrentPrincipal, Public, RequireCapability } from './decorators';
import { AccountsService } from './accounts.service';
import { SignInService } from './sign-in.service';

/** Account administration for the people who run the newsroom. Needs user.manage, which is privileged (MFA required). */
@Controller('accounts')
@RequireCapability('user.manage')
export class AccountsController {
  constructor(@Inject(AccountsService) private readonly accounts: AccountsService) {}

  @Get()
  list(): Promise<Account[]> {
    return this.accounts.list();
  }

  /** Invites a new person. The one-time link is returned here, once, for the administrator to pass on. */
  @Post('invitations')
  invite(@Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Invitation> {
    return this.accounts.invite(parse(invitationCreateSchema, body), actorOf(p, req));
  }

  /** A new link for an account that forgot its password or lost its authenticator app. */
  @Post(':id/invitation')
  reissue(@Param('id', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Invitation> {
    return this.accounts.reissue(id, actorOf(p, req));
  }

  @Put(':id/roles')
  roles(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Account> {
    return this.accounts.setRoles(id, parse(accountRolesSchema, body), actorOf(p, req));
  }

  @Put(':id/status')
  status(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Account> {
    return this.accounts.setStatus(id, parse(accountStatusChangeSchema, body), actorOf(p, req));
  }
}

/**
 * The public steps of an invitation: accepting it (a password, then the authenticator setup) and confirming the setup.
 * Both are rate limited per address, because the confirmation step takes a six-digit code.
 */
@Public()
@Controller('auth/invitations')
export class InvitationsController {
  constructor(
    @Inject(AccountsService) private readonly accounts: AccountsService,
    @Inject(SignInService) private readonly signIn: SignInService,
  ) {}

  @Post('accept')
  @HttpCode(200)
  async accept(@Body() body: unknown, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<InvitationAccepted> {
    await this.signIn.throttle(req.ip || null);
    const input = parse(invitationAcceptSchema, body);
    void reply.header('cache-control', 'no-store');
    return this.accounts.accept(input.token, input.password);
  }

  @Post('confirm')
  @HttpCode(200)
  async confirm(@Body() body: unknown, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<RecoveryCodes> {
    await this.signIn.throttle(req.ip || null);
    const input = parse(enrolmentConfirmSchema, body);
    void reply.header('cache-control', 'no-store');
    return this.accounts.confirmEnrolment(input.enrolmentToken, input.code);
  }
}
