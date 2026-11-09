import { createHmac } from 'node:crypto';
import { Module } from '@nestjs/common';
import { loadApiEnv } from '@fact-lens/config';
import { AiController } from './ai/ai.controller';
import { InboxController } from './inbox/inbox.controller';
import { PollsController, PublicPollsController } from './polls/polls.controller';
import { POLL_OPTIONS, PollsService } from './polls/polls.service';
import { InboxService } from './inbox/inbox.service';
import { GEMINI_OPTIONS, GeminiService } from './ai/gemini.service';
import { AuthModule } from './auth/auth.module';
import { MeController } from './auth/me.controller';
import { FeatureFlagsController } from './config/feature-flags.controller';
import { AnalyticsController, PublicAnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';
import { REDIS_CLIENT, VIEWS_OPTIONS, ViewsService } from './analytics/views.service';
import { SITE_INFO, siteFromEnv } from './config/site';
import { PublicSiteController } from './config/site.controller';
import { MediaController } from './media/media.controller';
import { MEDIA_OPTIONS, MediaService } from './media/media.service';
import { createStorage, OBJECT_STORAGE } from './media/storage';
import { ContributorsController } from './contributors/contributors.controller';
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
import { Redis } from 'ioredis';
import type { Pool } from 'pg';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [PublicAnalyticsController, AnalyticsController, PublicSiteController, PollsController, PublicPollsController, InboxController, AiController, HealthController, MeController, FeatureFlagsController, NewsController, PublicNewsController, CollabController, InternalController, ReferenceController, ContributorsController, MediaController, TaxonomyController, PublicTaxonomyController, LocalesController],
  providers: [
    { provide: SITE_INFO, useFactory: () => siteFromEnv(loadApiEnv()) },
    { provide: INTERNAL_TOKEN, useFactory: () => loadApiEnv().INTERNAL_API_TOKEN ?? null },
    { provide: OBJECT_STORAGE, useFactory: () => createStorage(loadApiEnv()) },
    { provide: MEDIA_OPTIONS, useFactory: () => ({ maxBytes: loadApiEnv().MAX_UPLOAD_MB * 1024 * 1024 }) },
    { provide: GEMINI_OPTIONS, useFactory: () => ({ apiKey: loadApiEnv().GEMINI_API_KEY ?? null, model: loadApiEnv().GEMINI_MODEL }) },
    GeminiService,
    {
      provide: REDIS_CLIENT,
      useFactory: () => new Redis(loadApiEnv().REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 2, enableOfflineQueue: false }),
    },
    {
      provide: VIEWS_OPTIONS,
      useFactory: () => {
        const env = loadApiEnv();
        return { prefix: 'fl', hashSecret: env.POLL_HASH_SECRET ?? env.INTERNAL_API_TOKEN ?? null, ownHosts: env.PUBLIC_SITE_HOSTS };
      },
    },
    ViewsService,
    AnalyticsService,
    MediaService,
    NewsService,
    TaxonomyService,
    CommentsService,
    AssignmentsService,
    SourcesService,
    InboxService,
    PollsService,
    {
      provide: POLL_OPTIONS,
      useFactory: () => {
        const env = loadApiEnv();
        // Without its own secret, one is derived from the internal token: a different key for a different purpose.
        const secret = env.POLL_HASH_SECRET ?? (env.INTERNAL_API_TOKEN ? createHmac('sha256', env.INTERNAL_API_TOKEN).update('poll-vote-v1').digest('base64url') : null);
        return { secret, perIpPerDay: env.POLL_VOTES_PER_IP_PER_DAY };
      },
    },
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
