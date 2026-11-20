import { Body, Controller, Get, Inject, NotFoundException, Param, Put, Req, Res } from '@nestjs/common';
import { localeCodeSchema, trendingTermsSchema, type PublicTrending, type Principal, type TrendingTerms } from '@fact-lens/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Public, CurrentPrincipal, RequireCapability } from '../auth/decorators';
import { actorOf, parse } from '../common/http';
import { TrendingService } from './trending.service';

/** Editors keep the trending terms per language (config.manage, as the other settings). */
@Controller('trending-searches')
@RequireCapability('config.manage')
export class TrendingController {
  constructor(@Inject(TrendingService) private readonly trending: TrendingService) {}

  @Get(':locale')
  get(@Param('locale') locale: string): Promise<TrendingTerms> {
    return this.trending.list(this.locale(locale));
  }

  @Put(':locale')
  put(
    @Param('locale') locale: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest,
  ): Promise<TrendingTerms> {
    return this.trending.replace(this.locale(locale), parse(trendingTermsSchema, body), actorOf(p, req));
  }

  private locale(value: string): string {
    const parsed = localeCodeSchema.safeParse(value);
    if (!parsed.success) throw new NotFoundException('Not found');
    return parsed.data;
  }
}

/** What readers get: up to six terms, in order. Empty when the editors have none. */
@Public()
@Controller('public/trending-searches')
export class PublicTrendingController {
  constructor(@Inject(TrendingService) private readonly trending: TrendingService) {}

  @Get(':locale')
  async get(@Param('locale') locale: string, @Res({ passthrough: true }) reply: FastifyReply): Promise<PublicTrending> {
    const parsed = localeCodeSchema.safeParse(locale);
    if (!parsed.success) throw new NotFoundException('Not found');
    const result = await this.trending.publicList(parsed.data);
    void reply.header('cache-control', 'public, max-age=60, stale-while-revalidate=300');
    return result;
  }
}
