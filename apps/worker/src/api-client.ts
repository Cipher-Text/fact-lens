import { INTERNAL_TOKEN_HEADER, scheduledPublishResultSchema, type ScheduledPublishResult } from '@fact-lens/contracts';
import { PermanentJobError } from './errors';

export interface ApiClient {
  publishSchedule(scheduleId: string): Promise<ScheduledPublishResult>;
}

/**
 * The worker changes story state only through the API, which owns the domain rules (docs/15).
 * Network errors and 5xx are thrown as ordinary errors so the job retries; a response that
 * retrying cannot change is a permanent failure.
 */
export function createApiClient(baseUrl: string, token: string, timeoutMs = 15000): ApiClient {
  const base = baseUrl.replace(/\/$/, '');
  return {
    async publishSchedule(scheduleId) {
      const res = await fetch(`${base}/internal/schedules/${encodeURIComponent(scheduleId)}/publish`, {
        method: 'POST',
        headers: { [INTERNAL_TOKEN_HEADER]: token },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 404) throw new PermanentJobError(`Schedule ${scheduleId} does not exist`);
      if (res.status === 401) throw new PermanentJobError('The API rejected the internal token');
      if (!res.ok) throw new Error(`API answered ${res.status} for schedule ${scheduleId}`);
      const parsed = scheduledPublishResultSchema.safeParse(await res.json());
      if (!parsed.success) throw new PermanentJobError('The API sent an unexpected response');
      return parsed.data;
    },
  };
}
