import 'server-only';
import { loadNewsroomEnv, type NewsroomEnv } from '@fact-lens/config';

let cached: NewsroomEnv | undefined;

/** Validated once per process. A bad value stops the first request with a clear message. */
export function getEnv(): NewsroomEnv {
  return (cached ??= loadNewsroomEnv());
}

export const isSecure = (env: NewsroomEnv) => new URL(env.NEWSROOM_BASE_URL).protocol === 'https:';
