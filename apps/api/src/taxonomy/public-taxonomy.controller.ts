import { Controller, Get, Inject, NotFoundException, Param, Query, Res } from '@nestjs/common';
import { localeCodeSchema, publicNewsListQuerySchema, type PublicNewsList, type PublicNavItem, type PublicRegion, type PublicTaxonomyRef } from '@fact-lens/contracts';
import type { FastifyReply } from 'fastify';
import { Public } from '../auth/decorators';
import { parse } from '../common/http';
import { TaxonomyService } from './taxonomy.service';

/** What readers get: the menu and the lists, per language, from published news only. */
@Public()
@Controller('public')
export class PublicTaxonomyController {
  constructor(@Inject(TaxonomyService) private readonly taxonomy: TaxonomyService) {}

  private locale(value: string): string {
    const parsed = localeCodeSchema.safeParse(value);
    if (!parsed.success) throw new NotFoundException('Not found');
    return parsed.data;
  }

  @Get('navigation/:locale')
  async navigation(@Param('locale') locale: string, @Res({ passthrough: true }) reply: FastifyReply): Promise<PublicNavItem[]> {
    const items = await this.taxonomy.navigation(this.locale(locale));
    void reply.header('cache-control', 'public, max-age=60, stale-while-revalidate=300');
    return items;
  }

  /** The regions in the page's language, in order. */
  @Get('regions/:locale')
  async regions(@Param('locale') locale: string, @Res({ passthrough: true }) reply: FastifyReply): Promise<PublicRegion[]> {
    const items = await this.taxonomy.publicRegions(this.locale(locale));
    void reply.header('cache-control', 'public, max-age=60, stale-while-revalidate=300');
    return items;
  }

  @Get('news/:locale')
  async news(@Param('locale') locale: string, @Query() query: unknown, @Res({ passthrough: true }) reply: FastifyReply): Promise<PublicNewsList> {
    const l = this.locale(locale);
    const q = parse(publicNewsListQuerySchema, query);
    let list: PublicNewsList;
    try {
      list = await this.taxonomy.publicNews(l, q);
    } catch (err) {
      if (!(err instanceof NotFoundException)) throw err;
      // A renamed section, region or tag: the old address redirects to the current one.
      const moved = await this.taxonomy.movedList(l, q);
      if (!moved) throw err;
      const next = new URLSearchParams(Object.entries(query as Record<string, string>).filter(([k]) => k !== moved.param));
      next.set(moved.param, moved.slug);
      void reply.header('location', `/public/news/${encodeURIComponent(l)}?${next}`).status(301);
      return { filter: null, items: [], nextCursor: null };
    }
    void reply.header('cache-control', 'public, max-age=30, stale-while-revalidate=120');
    return list;
  }
}
