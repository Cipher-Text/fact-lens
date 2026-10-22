import {
  Body, CanActivate, Controller, ExecutionContext, HttpCode, Inject, Injectable, Param, ParseUUIDPipe, Post, Req,
  ServiceUnavailableException, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { feedIngestSchema, INTERNAL_TOKEN_HEADER, type FeedIngestResult, type ScheduledPublishResult } from '@fact-lens/contracts';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { Public } from '../auth/decorators';
import { parse } from '../common/http';
import { InboxService } from '../inbox/inbox.service';
import { NewsService } from '../news/news.service';

export const INTERNAL_TOKEN = Symbol('INTERNAL_TOKEN');

const digest = (s: string) => createHash('sha256').update(s).digest();

/**
 * Service-to-service check for the worker. The shared secret travels in its own header, never
 * the user `Authorization` header, and is compared in constant time. With no secret configured
 * the whole internal surface is off. These routes must also stay off the public network.
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  constructor(@Inject(INTERNAL_TOKEN) private readonly token: string | null) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.token) throw new ServiceUnavailableException('Internal API is not enabled');
    const given = context.switchToHttp().getRequest<FastifyRequest>().headers[INTERNAL_TOKEN_HEADER];
    if (typeof given !== 'string' || !timingSafeEqual(digest(given), digest(this.token))) {
      throw new UnauthorizedException('Invalid internal credentials');
    }
    return true;
  }
}

@Public()
@UseGuards(InternalTokenGuard)
@Controller('internal')
export class InternalController {
  constructor(
    @Inject(NewsService) private readonly news: NewsService,
    @Inject(InboxService) private readonly inbox: InboxService,
  ) {}

  /** Publishes a due schedule. Safe to call again: the outcome of the first call is returned. */
  @Post('schedules/:id/publish')
  @HttpCode(200)
  publishScheduled(@Param('id', ParseUUIDPipe) id: string, @Req() req: FastifyRequest): Promise<ScheduledPublishResult> {
    return this.news.publishScheduled(id, String(req.id));
  }

  /** What the worker found when it fetched one feed. Safe to call again: items are stored once per feed. */
  @Post('feeds/:id/ingest')
  @HttpCode(200)
  ingestFeed(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @Req() req: FastifyRequest): Promise<FeedIngestResult> {
    return this.inbox.ingest(id, parse(feedIngestSchema, body), String(req.id));
  }
}
