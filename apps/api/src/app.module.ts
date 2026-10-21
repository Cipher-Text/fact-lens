import { Module } from '@nestjs/common';
import { loadApiEnv } from '@fact-lens/config';
import { HealthController } from './health.controller';
import { PG_POOL } from './db/pool';
import { DatabaseModule } from './db/database.module';
import { createProbes, HealthService } from './health.service';
import type { Pool } from 'pg';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [
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
