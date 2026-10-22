import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Post, Put, Query, Req, Res } from '@nestjs/common';
import {
  editorialCapabilities, mediaListQuerySchema, mediaRightsUpdateSchema, type MediaDetail, type MediaList, type Principal,
} from '@fact-lens/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { CurrentPrincipal, Public, RequireAnyCapability, RequireCapability } from '../auth/decorators';
import { actorOf, parse } from '../common/http';
import { LIVE_STATUSES } from '../news/workflow';
import { MediaService } from './media.service';

const variantSchema = z.string().max(20).default('card');

/** The media library. Newsroom-only except for the last route, which serves what a live news shows. */
@Controller()
export class MediaController {
  constructor(@Inject(MediaService) private readonly media: MediaService) {}

  /** The image is the request body (image/jpeg, image/png or image/webp); the filename is a label only. */
  @Post('media')
  @RequireAnyCapability('news.edit', 'media.manage')
  async upload(
    @Body() body: unknown, @Query('filename') filename: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<MediaDetail> {
    const name = parse(z.string().max(500).optional(), filename);
    const { asset, created } = await this.media.upload(body, name, actorOf(p, req));
    void reply.status(created ? 201 : 200);
    return asset;
  }

  @Get('media')
  @RequireAnyCapability(...editorialCapabilities, 'media.manage')
  list(@Query() query: unknown): Promise<MediaList> {
    return this.media.list(parse(mediaListQuerySchema, query));
  }

  @Get('media/:id')
  @RequireAnyCapability(...editorialCapabilities, 'media.manage')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<MediaDetail> {
    return this.media.get(id);
  }

  @Put('media/:id/rights')
  @RequireAnyCapability('news.edit', 'media.manage')
  rights(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.media.updateRights(id, parse(mediaRightsUpdateSchema, body), actorOf(p, req));
  }

  @Get('media/:id/file')
  @RequireAnyCapability(...editorialCapabilities, 'media.manage')
  async file(@Param('id', ParseUUIDPipe) id: string, @Query('variant') variant: unknown, @Res({ passthrough: true }) reply: FastifyReply) {
    const { body, contentType } = await this.media.file(id, parse(variantSchema, variant));
    // The bytes of an id never change, so the browser may keep them; the rights data can, so it is not in the file.
    void reply.header('content-type', contentType).header('cache-control', 'private, max-age=86400').header('x-content-type-options', 'nosniff');
    return body;
  }

  @Delete('media/:id')
  @HttpCode(204)
  @RequireCapability('media.manage')
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<void> {
    await this.media.delete(id, actorOf(p, req));
  }

  @Public()
  @Get('public/media/:id/:variant')
  async publicFile(@Param('id', ParseUUIDPipe) id: string, @Param('variant') variant: string, @Res({ passthrough: true }) reply: FastifyReply) {
    const { body, contentType } = await this.media.publicFile(id, variant, LIVE_STATUSES);
    void reply.header('content-type', contentType).header('cache-control', 'public, max-age=3600').header('x-content-type-options', 'nosniff');
    return body;
  }
}
