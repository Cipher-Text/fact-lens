import { Module } from '@nestjs/common';
import { loadApiEnv } from '@fact-lens/config';
import { HealthController } from './health.controller';
import { createProbes, HealthService } from './health.service';

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: HealthService,
      useFactory: () => {
        const env = loadApiEnv();
        const { probes, close } = createProbes(env.DATABASE_URL, env.REDIS_URL);
        return new HealthService(probes, close);
      },
    },
  ],
})
export class AppModule {}
