import { Body, Controller, Get, HttpCode, Inject, NotFoundException, Param, ParseUUIDPipe, Post, Query, Req, Res } from '@nestjs/common';
import {
  localeCodeSchema, mostReadQuerySchema, performanceQuerySchema, performanceSummaryQuerySchema, viewBeaconSchema,
  type MostRead, type NewsPerformanceDetail, type NewsPerformanceList, type PerformanceSummary,
} from '@fact-lens/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { Public, RequireCapability } from '../auth/decorators';
import { parse } from '../common/http';
import { AnalyticsService } from './analytics.service';
import { ViewsService } from './views.service';

const dayParam = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();

/** What the public site sends and reads: the view beacon and the most read list. Read only for readers. */
@Public()
@Controller('public')
export class PublicAnalyticsController {
  constructor(@Inject(ViewsService) private readonly views: ViewsService) {}

  /**
   * One view of a news item, sent by the site after the page was shown. The answer is the same whether the view
   * was counted or not (204), so it tells a script nothing about the checks. A malformed body is a 400.
   */
  @Post('views')
  @HttpCode(204)
  async view(@Body() body: unknown, @Req() req: FastifyRequest): Promise<void> {
    const beacon = parse(viewBeaconSchema, body);
    const purpose = `${req.headers['sec-purpose'] ?? ''} ${req.headers.purpose ?? ''} ${req.headers['x-purpose'] ?? ''}`;
    await this.views.record(beacon, {
      ip: req.ip || null,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
      prefetch: /prefetch|prerender/i.test(purpose),
    });
  }

  @Get('most-read/:locale')
  async mostRead(@Param('locale') locale: string, @Query() query: unknown, @Res({ passthrough: true }) reply: FastifyReply): Promise<MostRead> {
    const l = localeCodeSchema.safeParse(locale);
    if (!l.success) throw new NotFoundException('Not found');
    const result = await this.views.mostRead(l.data, parse(mostReadQuerySchema, query));
    void reply.header('cache-control', 'public, max-age=60, stale-while-revalidate=300');
    return result;
  }
}

/** The newsroom's performance reports. They need the `analytics.read` capability. */
@Controller('analytics')
export class AnalyticsController {
  constructor(@Inject(AnalyticsService) private readonly analytics: AnalyticsService) {}

  /** Live news with their views in a period: `order=desc` most read, `order=asc` least read (with `minAgeDays`). */
  @Get('news')
  @RequireCapability('analytics.read')
  list(@Query() query: unknown): Promise<NewsPerformanceList> {
    return this.analytics.list(parse(performanceQuerySchema, query));
  }

  /** Views and live news per section, region, format, author or language. */
  @Get('summary')
  @RequireCapability('analytics.read')
  summary(@Query() query: unknown): Promise<PerformanceSummary> {
    return this.analytics.summary(parse(performanceSummaryQuerySchema, query));
  }

  @Get('news/:id')
  @RequireCapability('analytics.read')
  detail(@Param('id', ParseUUIDPipe) id: string, @Query('from') from: unknown, @Query('to') to: unknown): Promise<NewsPerformanceDetail> {
    return this.analytics.detail(id, parse(dayParam, from), parse(dayParam, to));
  }
}
