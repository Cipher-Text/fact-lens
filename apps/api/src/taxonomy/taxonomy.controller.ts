import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import {
  categoryCreateSchema, categoryOrderSchema, categoryUpdateSchema, editorialCapabilities, storyTagsSchema, tagCreateSchema,
  tagUpdateSchema, taxonomyTagQuerySchema, type Principal,
} from '@fact-lens/contracts';
import type { FastifyRequest } from 'fastify';
import { CurrentPrincipal, RequireAnyCapability, RequireCapability } from '../auth/decorators';
import { actorOf, parse } from '../common/http';
import { TaxonomyService } from './taxonomy.service';

/** Managing the menu and the tags needs `taxonomy.manage`; reading them to fill in a story needs only an editorial role. */
@Controller()
export class TaxonomyController {
  constructor(@Inject(TaxonomyService) private readonly taxonomy: TaxonomyService) {}

  // ---- categories (the news menu)
  @Get('taxonomy/categories')
  @RequireAnyCapability('taxonomy.manage')
  categories() {
    return this.taxonomy.listCategories();
  }

  @Post('taxonomy/categories')
  @RequireCapability('taxonomy.manage')
  createCategory(@Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.taxonomy.createCategory(parse(categoryCreateSchema, body), actorOf(p, req));
  }

  // Declared before `:id` so "order" is never read as an id.
  @Put('taxonomy/categories/order')
  @RequireCapability('taxonomy.manage')
  reorder(@Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.taxonomy.reorderCategories(parse(categoryOrderSchema, body), actorOf(p, req));
  }

  @Put('taxonomy/categories/:id')
  @RequireCapability('taxonomy.manage')
  updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.taxonomy.updateCategory(id, parse(categoryUpdateSchema, body), actorOf(p, req));
  }

  @Delete('taxonomy/categories/:id')
  @HttpCode(204)
  @RequireCapability('taxonomy.manage')
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<void> {
    await this.taxonomy.deleteCategory(id, actorOf(p, req));
  }

  // ---- tags
  @Get('taxonomy/tags')
  @RequireAnyCapability('taxonomy.manage')
  tags(@Query() query: unknown) {
    return this.taxonomy.listTags(parse(taxonomyTagQuerySchema, query));
  }

  @Post('taxonomy/tags')
  @RequireCapability('taxonomy.manage')
  createTag(@Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.taxonomy.createTag(parse(tagCreateSchema, body), actorOf(p, req));
  }

  @Put('taxonomy/tags/:id')
  @RequireCapability('taxonomy.manage')
  updateTag(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.taxonomy.updateTag(id, parse(tagUpdateSchema, body), actorOf(p, req));
  }

  @Delete('taxonomy/tags/:id')
  @HttpCode(204)
  @RequireCapability('taxonomy.manage')
  async deleteTag(@Param('id', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<void> {
    await this.taxonomy.deleteTag(id, actorOf(p, req));
  }

  // ---- for editors filling in a story
  /** Active tags for the picker. Archived tags are not offered. */
  @Get('reference/tags')
  @RequireAnyCapability(...editorialCapabilities)
  referenceTags(@Query() query: unknown) {
    const q = parse(taxonomyTagQuerySchema, query);
    return this.taxonomy.listTags({ ...q, status: 'active' });
  }

  @Get('stories/:id/tags')
  @RequireAnyCapability(...editorialCapabilities)
  storyTags(@Param('id', ParseUUIDPipe) id: string) {
    return this.taxonomy.tagsOfStory(id);
  }

  @Put('stories/:id/tags')
  @RequireCapability('story.edit')
  setStoryTags(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.taxonomy.setStoryTags(id, parse(storyTagsSchema, body).tagIds, actorOf(p, req));
  }
}
