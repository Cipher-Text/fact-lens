import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import {
  feedCreateSchema, feedUpdateSchema, inboxQuerySchema, inboxTriageSchema, inboxUseSchema, type Feed, type InboxItem, type InboxList, type Principal,
} from '@fact-lens/contracts';
import type { FastifyRequest } from 'fastify';
import { CurrentPrincipal, RequireAnyCapability, RequireCapability } from '../auth/decorators';
import { actorOf as actor, parse } from '../common/http';
import { InboxService } from './inbox.service';

@Controller()
export class InboxController {
  constructor(@Inject(InboxService) private readonly inbox: InboxService) {}

  // ---- feeds: readers of the inbox see them; only administrators change them

  @Get('feeds')
  @RequireAnyCapability('news.edit', 'news.review', 'config.manage')
  feeds(): Promise<Feed[]> {
    return this.inbox.listFeeds();
  }

  @Post('feeds')
  @RequireCapability('config.manage')
  createFeed(@Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Feed> {
    return this.inbox.createFeed(parse(feedCreateSchema, body), actor(p, req));
  }

  @Put('feeds/:id')
  @RequireCapability('config.manage')
  updateFeed(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Feed> {
    return this.inbox.updateFeed(id, parse(feedUpdateSchema, body), actor(p, req));
  }

  @Delete('feeds/:id')
  @HttpCode(204)
  @RequireCapability('config.manage')
  async deleteFeed(@Param('id', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<void> {
    await this.inbox.deleteFeed(id, actor(p, req));
  }

  // ---- the inbox

  @Get('inbox')
  @RequireAnyCapability('news.edit', 'news.review')
  list(@Query() query: unknown): Promise<InboxList> {
    return this.inbox.list(parse(inboxQuerySchema, query));
  }

  @Get('inbox/:id')
  @RequireAnyCapability('news.edit', 'news.review')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<InboxItem> {
    return this.inbox.get(id);
  }

  @Put('inbox/:id')
  @RequireCapability('news.edit')
  triage(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<InboxItem> {
    return this.inbox.triage(id, parse(inboxTriageSchema, body).status, actor(p, req));
  }

  @Post('inbox/:id/use')
  @HttpCode(200)
  @RequireCapability('news.edit')
  use(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<InboxItem> {
    return this.inbox.use(id, parse(inboxUseSchema, body).newsId, actor(p, req));
  }
}
