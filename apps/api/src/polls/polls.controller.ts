import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Post, Put, Query, Req, Res } from '@nestjs/common';
import {
  localeCodeSchema, pollFeatureSchema, pollInputSchema, pollListQuerySchema, pollVoteSchema, type Poll, type PollVoteResult, type Principal, type PublicPoll,
} from '@fact-lens/contracts';
import { NotFoundException } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { CurrentPrincipal, Public, RequireAnyCapability, RequireCapability } from '../auth/decorators';
import { actorOf as actor, parse } from '../common/http';
import { newVoterToken, PollsService, voterCookie, voterTokenFrom } from './polls.service';

/** The newsroom side: editors write polls, managing editors open, close and feature them. */
@Controller('polls')
export class PollsController {
  constructor(@Inject(PollsService) private readonly polls: PollsService) {}

  @Get()
  @RequireAnyCapability('news.edit', 'news.publish')
  list(@Query() query: unknown): Promise<Poll[]> {
    return this.polls.list(parse(pollListQuerySchema, query).status);
  }

  @Get(':id')
  @RequireAnyCapability('news.edit', 'news.publish')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Poll> {
    return this.polls.get(id);
  }

  @Post()
  @RequireCapability('news.edit')
  create(@Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Poll> {
    return this.polls.create(parse(pollInputSchema, body), actor(p, req));
  }

  @Put(':id')
  @RequireCapability('news.edit')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Poll> {
    return this.polls.update(id, parse(pollInputSchema, body), actor(p, req));
  }

  @Delete(':id')
  @HttpCode(204)
  @RequireCapability('news.edit')
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<void> {
    await this.polls.remove(id, actor(p, req));
  }

  @Post(':id/open')
  @HttpCode(200)
  @RequireCapability('news.publish')
  open(@Param('id', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Poll> {
    return this.polls.open(id, actor(p, req));
  }

  @Post(':id/close')
  @HttpCode(200)
  @RequireCapability('news.publish')
  close(@Param('id', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Poll> {
    return this.polls.close(id, actor(p, req));
  }

  @Post(':id/archive')
  @HttpCode(200)
  @RequireCapability('news.publish')
  archive(@Param('id', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Poll> {
    return this.polls.archive(id, actor(p, req));
  }

  @Put(':id/feature')
  @RequireCapability('news.publish')
  feature(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Poll> {
    return this.polls.feature(id, parse(pollFeatureSchema, body).featured, actor(p, req));
  }
}

/** What readers get: a poll, and a vote. Never cached, because it carries the browser's own vote. */
@Public()
@Controller('public/polls')
export class PublicPollsController {
  constructor(@Inject(PollsService) private readonly polls: PollsService) {}

  private locale(value: string): string {
    const parsed = localeCodeSchema.safeParse(value);
    if (!parsed.success) throw new NotFoundException('Not found');
    return parsed.data;
  }

  // Declared before `:id/:locale` so "featured" is never read as an id.
  @Get('featured/:locale')
  async featured(@Param('locale') locale: string, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<PublicPoll> {
    void reply.header('cache-control', 'no-store');
    return this.polls.featured(this.locale(locale), voterTokenFrom(req.headers.cookie));
  }

  @Get(':id/:locale')
  async get(@Param('id', ParseUUIDPipe) id: string, @Param('locale') locale: string, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<PublicPoll> {
    void reply.header('cache-control', 'no-store');
    return this.polls.publicPoll(id, this.locale(locale), voterTokenFrom(req.headers.cookie));
  }

  @Post(':id/vote')
  @HttpCode(200)
  async vote(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<PollVoteResult> {
    const input = parse(pollVoteSchema, body);
    const existing = voterTokenFrom(req.headers.cookie);
    const token = existing ?? newVoterToken();
    const result = await this.polls.vote(id, input.optionId, input.locale, token, req.ip);
    // The browser keeps its token so a second vote from it is recognised; set it only when it was new.
    if (!existing) void reply.header('set-cookie', voterCookie(token, process.env.NODE_ENV === 'production'));
    void reply.header('cache-control', 'no-store');
    return result;
  }
}
