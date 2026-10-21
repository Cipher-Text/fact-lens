import { Controller, Get, Inject, Param, Res } from '@nestjs/common';
import { localeCodeSchema, slugSchema } from '@fact-lens/contracts';
import type { FastifyReply } from 'fastify';
import { NotFoundException } from '@nestjs/common';
import { Public } from '../auth/decorators';
import { StoriesService } from './stories.service';

/** The only story surface that needs no sign-in. It never returns anything unpublished. */
@Public()
@Controller('public/stories')
export class PublicStoriesController {
  constructor(@Inject(StoriesService) private readonly stories: StoriesService) {}

  @Get(':locale/:slug')
  async get(@Param('locale') locale: string, @Param('slug') slug: string, @Res({ passthrough: true }) reply: FastifyReply) {
    const l = localeCodeSchema.safeParse(locale);
    const s = slugSchema.safeParse(decodeURIComponent(slug));
    if (!l.success || !s.success) throw new NotFoundException('Not found');
    const result = await this.stories.publicStory(l.data, s.data);
    if ('redirectTo' in result) {
      void reply.header('location', `/public/stories/${encodeURIComponent(l.data)}/${encodeURIComponent(result.redirectTo)}`).status(301);
      return { redirectTo: result.redirectTo };
    }
    void reply.header('cache-control', 'public, max-age=60, stale-while-revalidate=300');
    return result.story;
  }
}
