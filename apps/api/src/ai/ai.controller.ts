import { Body, Controller, Inject, Post, Req } from '@nestjs/common';
import { aiSuggestRequestSchema, aiTranslateRequestSchema, type AiSuggestion, type AiTranslation, type Principal } from '@fact-lens/contracts';
import type { FastifyRequest } from 'fastify';
import { AuditService } from '../audit/audit.service';
import { CurrentPrincipal, RequireCapability } from '../auth/decorators';
import { parse } from '../common/http';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import { GeminiService } from './gemini.service';

@Controller('ai')
export class AiController {
  constructor(
    @Inject(GeminiService) private readonly gemini: GeminiService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(TaxonomyService) private readonly taxonomy: TaxonomyService,
  ) {}

  /** Suggests a headline, standfirst, slug, search text and existing tags from the text. Nothing is saved. */
  @Post('news-suggest')
  @RequireCapability('news.edit')
  async suggest(@Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<AiSuggestion> {
    const input = parse(aiSuggestRequestSchema, body);
    const suggestion = await this.gemini.suggest(input.locale, input.text, await this.taxonomy.tagCandidates(input.locale));
    // The text goes to an outside service, so each use is on record. The text itself is not stored.
    await this.audit.record({
      actorType: 'human', actorId: p.subject, action: 'ai.news_suggest', objectType: 'ai', objectId: 'news-suggest',
      requestId: String(req.id), metadata: { locale: input.locale, characters: input.text.length, model: this.gemini.model },
    });
    return suggestion;
  }

  /** Translates a language of a news item into another. Nothing is saved. */
  @Post('news-translate')
  @RequireCapability('news.edit')
  async translate(@Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<AiTranslation> {
    const input = parse(aiTranslateRequestSchema, body);
    const result = await this.gemini.translate(input);
    await this.audit.record({
      actorType: 'human', actorId: p.subject, action: 'ai.news_translate', objectType: 'ai', objectId: 'news-translate',
      requestId: String(req.id), metadata: { from: input.fromLocale, to: input.toLocale, segments: input.segments.length, model: this.gemini.model },
    });
    return result;
  }
}
