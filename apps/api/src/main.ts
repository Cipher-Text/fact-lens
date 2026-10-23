import { loadApiEnv } from '@fact-lens/config';
import { AppModule } from './app.module';
import { createApp } from './app';

async function bootstrap() {
  const env = loadApiEnv();
  const app = await createApp(AppModule, env.LOG_LEVEL, env.TRUST_PROXY);
  app.enableShutdownHooks();
  await app.listen(env.API_PORT, env.API_HOST);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
