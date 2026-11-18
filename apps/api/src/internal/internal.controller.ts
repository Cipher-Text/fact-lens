import {
  BadRequestException, Body, CanActivate, Controller, ExecutionContext, Get, HttpCode, Inject, Injectable, Param, ParseUUIDPipe, Post, Req,
  ServiceUnavailableException, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { feedIngestSchema, INTERNAL_TOKEN_HEADER, searchIndexRequestSchema, type AnalyticsRollupResult, type FeedIngestResult, type ScheduledPublishResult, type SearchIndexResult } from '@fact-lens/contracts';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { Public } from '../auth/decorators';
import { parse } from '../common/http';
import { ViewsService } from '../analytics/views.service';
import { InboxService } from '../inbox/inbox.service';
import { NewsService } from '../news/news.service';
import { CardsService } from '../cards/cards.service';
import { SearchService } from '../search/search.service';

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
    @Inject(ViewsService) private readonly views: ViewsService,
    @Inject(CardsService) private readonly cards: CardsService,
    @Inject(SearchService) private readonly search: SearchService,
  ) {}

  /** Makes the public search document of one news item match its published version, or removes it. Safe to call again. */
  @Post('search/:id')
  @HttpCode(200)
  indexSearch(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown): Promise<SearchIndexResult> {
    return this.search.project(id, parse(searchIndexRequestSchema, body).operation);
  }

  /** Adds the finished hours of the view counters to the durable table. Safe to call again: an hour is added once. */
  @Post('analytics/rollup')
  @HttpCode(200)
  rollupViews(): Promise<AnalyticsRollupResult> {
    return this.views.rollup();
  }

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

  /** Everything the worker needs to composite one card. Refuses, and marks the card failed, when its source cannot be used. */
  @Get('cards/:id/inputs')
  cardInputs(@Param('id', ParseUUIDPipe) id: string, @Req() req: FastifyRequest) {
    return this.cards.inputsFor(id, String(req.id));
  }

  /** Stores a rendered card (WebP). Safe to call again: a ready card is left as it is. */
  @Post('cards/:id/render')
  @HttpCode(200)
  storeCardRender(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @Req() req: FastifyRequest) {
    if (!Buffer.isBuffer(body)) throw new BadRequestException('Send the rendered card as the request body');
    return this.cards.storeRender(id, body, String(req.id));
  }
}
