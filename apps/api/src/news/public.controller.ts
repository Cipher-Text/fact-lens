import { Controller, Get, Inject, Param, Res } from '@nestjs/common';
import { localeCodeSchema, slugSchema } from '@fact-lens/contracts';
import type { FastifyReply } from 'fastify';
import { NotFoundException } from '@nestjs/common';
import { Public } from '../auth/decorators';
import { NewsService } from './news.service';

/** The only news surface that needs no sign-in. It never returns anything unpublished. */
@Public()
@Controller('public/news')
export class PublicNewsController {
  constructor(@Inject(NewsService) private readonly news: NewsService) {}

  @Get(':locale/:slug')
  async get(@Param('locale') locale: string, @Param('slug') slug: string, @Res({ passthrough: true }) reply: FastifyReply) {
    const l = localeCodeSchema.safeParse(locale);
    const s = slugSchema.safeParse(decodeURIComponent(slug));
    if (!l.success || !s.success) throw new NotFoundException('Not found');
    const result = await this.news.publicNews(l.data, s.data);
    if ('redirectTo' in result) {
      void reply.header('location', `/public/news/${encodeURIComponent(l.data)}/${encodeURIComponent(result.redirectTo)}`).status(301);
      return { redirectTo: result.redirectTo };
    }
    void reply.header('cache-control', 'public, max-age=60, stale-while-revalidate=300');
    return result.news;
  }
}
