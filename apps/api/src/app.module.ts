import { Module } from '@nestjs/common';
import { loadApiEnv } from '@fact-lens/config';
import { AiController } from './ai/ai.controller';
import { InboxController } from './inbox/inbox.controller';
import { InboxService } from './inbox/inbox.service';
import { GEMINI_OPTIONS, GeminiService } from './ai/gemini.service';
import { AuthModule } from './auth/auth.module';
import { MeController } from './auth/me.controller';
import { FeatureFlagsController } from './config/feature-flags.controller';
import { MediaController } from './media/media.controller';
import { MEDIA_OPTIONS, MediaService } from './media/media.service';
import { createStorage, OBJECT_STORAGE } from './media/storage';
import { ReferenceController } from './reference/reference.controller';
import { INTERNAL_TOKEN, InternalController } from './internal/internal.controller';
import { AssignmentsService } from './news/assignments.service';
import { CollabController } from './news/collab.controller';
import { CommentsService } from './news/comments.service';
import { SourcesService } from './news/sources.service';
import { PublicNewsController } from './news/public.controller';
import { NewsController } from './news/news.controller';
import { NewsService } from './news/news.service';
import { LocalesController } from './config/locales.controller';
import { PublicTaxonomyController } from './taxonomy/public-taxonomy.controller';
import { TaxonomyController } from './taxonomy/taxonomy.controller';
import { TaxonomyService } from './taxonomy/taxonomy.service';
import { HealthController } from './health.controller';
import { PG_POOL } from './db/pool';
import { DatabaseModule } from './db/database.module';
import { createProbes, HealthService } from './health.service';
import type { Pool } from 'pg';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [InboxController, AiController, HealthController, MeController, FeatureFlagsController, NewsController, PublicNewsController, CollabController, InternalController, ReferenceController, MediaController, TaxonomyController, PublicTaxonomyController, LocalesController],
  providers: [
    { provide: INTERNAL_TOKEN, useFactory: () => loadApiEnv().INTERNAL_API_TOKEN ?? null },
    { provide: OBJECT_STORAGE, useFactory: () => createStorage(loadApiEnv()) },
    { provide: MEDIA_OPTIONS, useFactory: () => ({ maxBytes: loadApiEnv().MAX_UPLOAD_MB * 1024 * 1024 }) },
    { provide: GEMINI_OPTIONS, useFactory: () => ({ apiKey: loadApiEnv().GEMINI_API_KEY ?? null, model: loadApiEnv().GEMINI_MODEL }) },
    GeminiService,
    MediaService,
    NewsService,
    TaxonomyService,
    CommentsService,
    AssignmentsService,
    SourcesService,
    InboxService,
    {
      provide: HealthService,
      inject: [PG_POOL],
      useFactory: (pool: Pool) => {
        const { probes, close } = createProbes(pool, loadApiEnv().REDIS_URL);
        return new HealthService(probes, close);
      },
    },
  ],
})
export class AppModule {}
