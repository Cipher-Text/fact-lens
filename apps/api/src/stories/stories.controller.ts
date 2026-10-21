import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import {
  correctionCreateSchema, editorialCapabilities, localeCodeSchema, revisionCreateSchema, storyCreateSchema,
  storyListQuerySchema, storyMetaSchema, transitionRequestSchema, translationSaveSchema,
  type Principal, type StoryDetail, type StoryList,
} from '@fact-lens/contracts';
import type { FastifyRequest } from 'fastify';
import { actorOf as actor, parse } from '../common/http';
import { CurrentPrincipal, RequireAnyCapability, RequireCapability } from '../auth/decorators';
import { StoriesService } from './stories.service';

@Controller('stories')
export class StoriesController {
  constructor(@Inject(StoriesService) private readonly stories: StoriesService) {}

  @Get()
  @RequireAnyCapability(...editorialCapabilities)
  list(@Query() query: unknown): Promise<StoryList> {
    return this.stories.list(parse(storyListQuerySchema, query));
  }

  @Get(':id')
  @RequireAnyCapability(...editorialCapabilities)
  detail(@Param('id', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal): Promise<StoryDetail> {
    return this.stories.detail(id, p);
  }

  @Get(':id/revisions')
  @RequireAnyCapability(...editorialCapabilities)
  revisions(@Param('id', ParseUUIDPipe) id: string) {
    return this.stories.revisions(id);
  }

  @Get(':id/timeline')
  @RequireAnyCapability(...editorialCapabilities)
  timeline(@Param('id', ParseUUIDPipe) id: string) {
    return this.stories.timeline(id);
  }

  @Post()
  @RequireCapability('story.edit')
  create(@Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.stories.create(parse(storyCreateSchema, body), actor(p, req));
  }

  @Put(':id/meta')
  @RequireCapability('story.edit')
  meta(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.stories.updateMeta(id, parse(storyMetaSchema, body), actor(p, req));
  }

  @Put(':id/translations/:locale')
  @RequireCapability('story.edit')
  saveTranslation(
    @Param('id', ParseUUIDPipe) id: string, @Param('locale') locale: string, @Body() body: unknown,
    @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest,
  ) {
    return this.stories.saveTranslation(id, parse(localeCodeSchema, locale), parse(translationSaveSchema, body), actor(p, req));
  }

  @Post(':id/revisions')
  @RequireCapability('story.edit')
  createRevision(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.stories.createRevision(id, parse(revisionCreateSchema, body), actor(p, req));
  }

  /** The capability is checked in the service: it depends on the move and the desk's policy. */
  @Post(':id/transitions')
  @RequireAnyCapability(...editorialCapabilities)
  transition(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.stories.transition(id, parse(transitionRequestSchema, body), actor(p, req));
  }

  @Post(':id/corrections')
  @RequireCapability('story.correct')
  correct(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.stories.createCorrection(id, parse(correctionCreateSchema, body), actor(p, req));
  }
}
