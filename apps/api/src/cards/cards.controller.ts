import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { cardRequestSchema, editorialCapabilities, type Principal } from '@fact-lens/contracts';
import { CurrentPrincipal, RequireAnyCapability, RequireCapability } from '../auth/decorators';
import { actorOf, parse } from '../common/http';
import { CardRequestsService, cardTemplateCreateSchema } from './card-requests.service';

/** Branded card requests from the newsroom, and template management (docs/10). Every route needs sign-in. */
@Controller()
export class CardsController {
  constructor(@Inject(CardRequestsService) private readonly cards: CardRequestsService) {}

  @Post('news/:id/cards')
  @RequireCapability('news.edit')
  request(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.cards.request(id, parse(cardRequestSchema, body), actorOf(p, req));
  }

  @Get('news/:id/cards')
  @RequireAnyCapability(...editorialCapabilities)
  listForNews(@Param('id', ParseUUIDPipe) id: string) {
    return this.cards.listForNews(id);
  }

  @Get('card-templates')
  @RequireAnyCapability(...editorialCapabilities)
  listTemplates(@CurrentPrincipal() p: Principal) {
    return this.cards.listTemplates(p);
  }

  @Post('card-templates')
  @RequireCapability('config.manage')
  createTemplate(@Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.cards.createTemplate(parse(cardTemplateCreateSchema, body), actorOf(p, req));
  }

  @Post('card-templates/:id/publish')
  @RequireCapability('config.manage')
  publishTemplate(@Param('id', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.cards.publishTemplate(id, actorOf(p, req));
  }

  @Post('card-templates/:id/retire')
  @RequireCapability('config.manage')
  retireTemplate(@Param('id', ParseUUIDPipe) id: string, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest) {
    return this.cards.retireTemplate(id, actorOf(p, req));
  }
}
