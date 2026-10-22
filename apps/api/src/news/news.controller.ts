import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import {
  correctionCreateSchema, editorialCapabilities, localeCodeSchema, revisionCreateSchema, newsCreateSchema,
  newsListQuerySchema, newsMetaSchema, transitionRequestSchema, translationSaveSchema,
  type Principal, type NewsDetail, type NewsList,
} from '@fact-lens/contracts';
import type { FastifyRequest } from 'fastify';
import { actorOf as actor, parse } from '../common/http';
import { CurrentPrincipal, RequireAnyCapability, RequireCapability } from '../auth/decorators';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(@Inject(NewsService) private readonly news: NewsService) {}

  @Get()
  @RequireAnyCapability(...editorialCapabilities)
  list(@Query() query: unknown): Promise<NewsList> {
    return this.news.list(parse(newsListQuerySchema, query));
  }

  @Get(':id')
  @RequireAnyCapability(...editorialCapabilities)
  detail(@Param('id', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal): Promise<NewsDetail> {
    return this.news.detail(id, p);
  }

  @Get(':id/revisions')
  @RequireAnyCapability(...editorialCapabilities)
  revisions(@Param('id', ParseUUIDPipe) id: string) {
    return this.news.revisions(id);
  }

  @Get(':id/timeline')
  @RequireAnyCapability(...editorialCapabilities)
  timeline(@Param('id', ParseUUIDPipe) id: string) {
    return this.news.timeline(id);
  }

  @Post()
  @RequireCapability('news.edit')
  create(@Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.news.create(parse(newsCreateSchema, body), actor(p, req));
  }

  @Put(':id/meta')
  @RequireCapability('news.edit')
  meta(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.news.updateMeta(id, parse(newsMetaSchema, body), actor(p, req));
  }

  @Put(':id/translations/:locale')
  @RequireCapability('news.edit')
  saveTranslation(
    @Param('id', ParseUUIDPipe) id: string, @Param('locale') locale: string, @Body() body: unknown,
    @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest,
  ) {
    return this.news.saveTranslation(id, parse(localeCodeSchema, locale), parse(translationSaveSchema, body), actor(p, req));
  }

  @Post(':id/revisions')
  @RequireCapability('news.edit')
  createRevision(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.news.createRevision(id, parse(revisionCreateSchema, body), actor(p, req));
  }

  /** The capability is checked in the service: it depends on the move and the desk's policy. */
  @Post(':id/transitions')
  @RequireAnyCapability(...editorialCapabilities)
  transition(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.news.transition(id, parse(transitionRequestSchema, body), actor(p, req));
  }

  @Post(':id/corrections')
  @RequireCapability('news.correct')
  correct(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.news.createCorrection(id, parse(correctionCreateSchema, body), actor(p, req));
  }
}
