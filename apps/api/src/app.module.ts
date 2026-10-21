import { Module } from '@nestjs/common';
import { loadApiEnv } from '@fact-lens/config';
import { AuthModule } from './auth/auth.module';
import { MeController } from './auth/me.controller';
import { FeatureFlagsController } from './config/feature-flags.controller';
import { AssignmentsService } from './stories/assignments.service';
import { CollabController } from './stories/collab.controller';
import { CommentsService } from './stories/comments.service';
import { SourcesService } from './stories/sources.service';
import { PublicStoriesController } from './stories/public.controller';
import { StoriesController } from './stories/stories.controller';
import { StoriesService } from './stories/stories.service';
import { HealthController } from './health.controller';
import { PG_POOL } from './db/pool';
import { DatabaseModule } from './db/database.module';
import { createProbes, HealthService } from './health.service';
import type { Pool } from 'pg';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [HealthController, MeController, FeatureFlagsController, StoriesController, PublicStoriesController, CollabController],
  providers: [
    StoriesService,
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
