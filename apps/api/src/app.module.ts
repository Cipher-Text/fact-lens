import { Module } from '@nestjs/common';
import { loadApiEnv } from '@fact-lens/config';
import { AuthModule } from './auth/auth.module';
import { MeController } from './auth/me.controller';
import { FeatureFlagsController } from './config/feature-flags.controller';
import { MediaController } from './media/media.controller';
import { MEDIA_OPTIONS, MediaService } from './media/media.service';
import { createStorage, OBJECT_STORAGE } from './media/storage';
import { ReferenceController } from './reference/reference.controller';
import { INTERNAL_TOKEN, InternalController } from './internal/internal.controller';
import { AssignmentsService } from './stories/assignments.service';
import { CollabController } from './stories/collab.controller';
import { CommentsService } from './stories/comments.service';
import { SourcesService } from './stories/sources.service';
import { PublicStoriesController } from './stories/public.controller';
import { StoriesController } from './stories/stories.controller';
import { StoriesService } from './stories/stories.service';
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
  controllers: [HealthController, MeController, FeatureFlagsController, StoriesController, PublicStoriesController, CollabController, InternalController, ReferenceController, MediaController, TaxonomyController, PublicTaxonomyController, LocalesController],
  providers: [
    { provide: INTERNAL_TOKEN, useFactory: () => loadApiEnv().INTERNAL_API_TOKEN ?? null },
    { provide: OBJECT_STORAGE, useFactory: () => createStorage(loadApiEnv()) },
    { provide: MEDIA_OPTIONS, useFactory: () => ({ maxBytes: loadApiEnv().MAX_UPLOAD_MB * 1024 * 1024 }) },
    MediaService,
    StoriesService,
    TaxonomyService,
    CommentsService,
    AssignmentsService,
    SourcesService,
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
