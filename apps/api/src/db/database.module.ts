import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { loadApiEnv } from '@fact-lens/config';
import type { Pool } from 'pg';
import { createPool, PG_POOL } from './pool';

class PoolLifecycle implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  onModuleDestroy() {
    return this.pool.end();
  }
}

@Global()
@Module({
  providers: [{ provide: PG_POOL, useFactory: () => createPool(loadApiEnv().DATABASE_URL) }, PoolLifecycle],
  exports: [PG_POOL],
})
export class DatabaseModule {}
