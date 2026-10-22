import { Body, Controller, Delete, Get, Inject, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import {
  assignmentCreateSchema, assignmentQuerySchema, commentCreateSchema, commentListQuerySchema, editorialCapabilities,
  sourceCreateSchema, sourceValidationSchema, newsSourceAttachSchema, type Principal,
} from '@fact-lens/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Res } from '@nestjs/common';
import { CurrentPrincipal, RequireAnyCapability, RequireCapability } from '../auth/decorators';
import { actorOf, parse } from '../common/http';
import { AssignmentsService } from './assignments.service';
import { CommentsService } from './comments.service';
import { SourcesService } from './sources.service';

/** Newsroom collaboration surface. Nothing here is reachable without sign-in, and none of it is public. */
@Controller()
@RequireAnyCapability(...editorialCapabilities)
export class CollabController {
  constructor(
    @Inject(CommentsService) private readonly comments: CommentsService,
    @Inject(AssignmentsService) private readonly assignments: AssignmentsService,
    @Inject(SourcesService) private readonly sources: SourcesService,
  ) {}

  // ---- comments
  @Get('news/:id/comments')
  listComments(@Param('id', ParseUUIDPipe) id: string, @Query() query: unknown) {
    return this.comments.list(id, parse(commentListQuerySchema, query).status);
  }

  @Post('news/:id/comments')
  addComment(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.comments.create(id, parse(commentCreateSchema, body), actorOf(p, req));
  }

  @Post('comments/:commentId/resolve')
  resolve(@Param('commentId', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.comments.setStatus(id, 'resolved', actorOf(p, req));
  }

  @Post('comments/:commentId/reopen')
  reopen(@Param('commentId', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.comments.setStatus(id, 'open', actorOf(p, req));
  }

  // ---- assignments
  @Get('assignments/mine')
  mine(@Query() query: unknown, @CurrentPrincipal() p: Principal) {
    const q = parse(assignmentQuerySchema, query);
    return this.assignments.mine(p.subject, q.status, q.limit);
  }

  @Get('news/:id/assignments')
  newsAssignments(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignments.forNews(id);
  }

  @Post('news/:id/assignments')
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.assignments.create(id, parse(assignmentCreateSchema, body), actorOf(p, req));
  }

  @Post('assignments/:assignmentId/complete')
  complete(@Param('assignmentId', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.assignments.close(id, 'done', actorOf(p, req));
  }

  @Post('assignments/:assignmentId/cancel')
  cancel(@Param('assignmentId', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.assignments.close(id, 'cancelled', actorOf(p, req));
  }

  // ---- sources
  @Post('sources')
  @RequireCapability('news.edit')
  async createSource(@Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const { source, created } = await this.sources.create(parse(sourceCreateSchema, body), actorOf(p, req));
    void reply.status(created ? 201 : 200);
    return source;
  }

  @Get('sources/:sourceId')
  getSource(@Param('sourceId', ParseUUIDPipe) id: string) {
    return this.sources.get(id);
  }

  @Post('sources/:sourceId/validation')
  validateSource(@Param('sourceId', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.sources.validate(id, parse(sourceValidationSchema, body), actorOf(p, req));
  }

  @Get('news/:id/sources')
  newsSources(@Param('id', ParseUUIDPipe) id: string) {
    return this.sources.forNews(id);
  }

  @Put('news/:id/sources/:sourceId')
  @RequireCapability('news.edit')
  attach(
    @Param('id', ParseUUIDPipe) id: string, @Param('sourceId', ParseUUIDPipe) sourceId: string, @Body() body: unknown,
    @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest,
  ) {
    return this.sources.attach(id, sourceId, parse(newsSourceAttachSchema, body), actorOf(p, req));
  }

  @Delete('news/:id/sources/:sourceId')
  @RequireCapability('news.edit')
  detach(
    @Param('id', ParseUUIDPipe) id: string, @Param('sourceId', ParseUUIDPipe) sourceId: string,
    @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest,
  ) {
    return this.sources.detach(id, sourceId, actorOf(p, req));
  }
}
