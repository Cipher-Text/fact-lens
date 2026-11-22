import { Controller, Get, Inject, NotFoundException, Optional, Param, Query, Req, Res } from '@nestjs/common';
import { localeCodeSchema, publicSearchQuerySchema, type PublicSearch } from '@fact-lens/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Public } from '../auth/decorators';
import { parse } from '../common/http';
import { readerAddress, TRUST_PROXY } from '../common/reader-address';
import { SearchService } from './search.service';

/** Public search: published news in one language only. Never returns anything unpublished. */
@Public()
@Controller('public/search')
export class PublicSearchController {
  constructor(
    @Inject(SearchService) private readonly search: SearchService,
    @Optional() @Inject(TRUST_PROXY) private readonly trustProxy: boolean = false,
  ) {}

  @Get(':locale')
  async query(
    @Param('locale') locale: string, @Query() query: unknown, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<PublicSearch> {
    const l = localeCodeSchema.safeParse(locale);
    if (!l.success) throw new NotFoundException('Not found');
    const q = parse(publicSearchQuerySchema, query);
    const result = await this.search.search(l.data, q, readerAddress(req, this.trustProxy));
    void reply.header('cache-control', 'public, max-age=30, stale-while-revalidate=120');
    return result;
  }
}
