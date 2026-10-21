import { Controller, Get, Inject, NotFoundException, Param, Query, Res } from '@nestjs/common';
import { localeCodeSchema, publicStoryListQuerySchema, type PublicStoryList, type PublicTaxonomyRef } from '@fact-lens/contracts';
import type { FastifyReply } from 'fastify';
import { Public } from '../auth/decorators';
import { parse } from '../common/http';
import { TaxonomyService } from './taxonomy.service';

/** What readers get: the menu and the lists, per language, from published stories only. */
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
  async navigation(@Param('locale') locale: string, @Res({ passthrough: true }) reply: FastifyReply): Promise<PublicTaxonomyRef[]> {
    const items = await this.taxonomy.navigation(this.locale(locale));
    void reply.header('cache-control', 'public, max-age=60, stale-while-revalidate=300');
    return items;
  }

  @Get('stories/:locale')
  async stories(@Param('locale') locale: string, @Query() query: unknown, @Res({ passthrough: true }) reply: FastifyReply): Promise<PublicStoryList> {
    const list = await this.taxonomy.publicStories(this.locale(locale), parse(publicStoryListQuerySchema, query));
    void reply.header('cache-control', 'public, max-age=30, stale-while-revalidate=120');
    return list;
  }
}
