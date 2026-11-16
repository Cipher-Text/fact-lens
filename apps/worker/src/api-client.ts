import {
  analyticsRollupResultSchema, cardRenderInputsSchema, feedIngestResultSchema, INTERNAL_TOKEN_HEADER, scheduledPublishResultSchema, type AnalyticsRollupResult, type CardRenderInputs, type FeedIngest, type FeedIngestResult, type ScheduledPublishResult,
} from '@fact-lens/contracts';
import { PermanentJobError } from './errors';

export interface ApiClient {
  publishSchedule(scheduleId: string): Promise<ScheduledPublishResult>;
  /** Reports what one fetch of a feed found. The API stores the items and the feed's status. */
  ingestFeed(feedId: string, result: FeedIngest): Promise<FeedIngestResult>;
  /** Asks the API to add the finished hours of the view counters to the durable table. Safe to repeat: an hour is added once. */
  rollupViews(): Promise<AnalyticsRollupResult>;
  /** Returns null when the card is already ready. */
  cardInputs(generatedCardId: string): Promise<CardRenderInputs | null>;
  /** Returns false when the card is already ready. */
  renderCard(generatedCardId: string, bytes: Buffer): Promise<boolean>;
}

/**
 * The worker changes news state only through the API, which owns the domain rules (docs/15).
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
    async ingestFeed(feedId, result) {
      const res = await fetch(`${base}/internal/feeds/${encodeURIComponent(feedId)}/ingest`, {
        method: 'POST',
        headers: { [INTERNAL_TOKEN_HEADER]: token, 'content-type': 'application/json' },
        body: JSON.stringify(result),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 404) throw new PermanentJobError(`Feed ${feedId} does not exist`);
      if (res.status === 401) throw new PermanentJobError('The API rejected the internal token');
      if (res.status === 400) throw new PermanentJobError('The API refused the feed result');
      if (!res.ok) throw new Error(`API answered ${res.status} for feed ${feedId}`);
      const parsed = feedIngestResultSchema.safeParse(await res.json());
      if (!parsed.success) throw new PermanentJobError('The API sent an unexpected response');
      return parsed.data;
    },
    async rollupViews() {
      const res = await fetch(`${base}/internal/analytics/rollup`, {
        method: 'POST',
        headers: { [INTERNAL_TOKEN_HEADER]: token },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 401) throw new PermanentJobError('The API rejected the internal token');
      if (!res.ok) throw new Error(`API answered ${res.status} for the view rollup`);
      const parsed = analyticsRollupResultSchema.safeParse(await res.json());
      if (!parsed.success) throw new PermanentJobError('The API sent an unexpected response');
      return parsed.data;
    },
    async cardInputs(generatedCardId) {
      const res = await fetch(`${base}/internal/cards/${encodeURIComponent(generatedCardId)}/inputs`, {
        headers: { [INTERNAL_TOKEN_HEADER]: token },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 409) return null;
      if (res.status === 401) throw new PermanentJobError('The API rejected the internal token');
      if (res.status === 422) throw new PermanentJobError('The card cannot be rendered from its source');
      if (!res.ok) throw new Error(`API answered ${res.status} for card ${generatedCardId} inputs`);
      const parsed = cardRenderInputsSchema.safeParse(await res.json());
      if (!parsed.success) throw new PermanentJobError('The API sent unexpected card render inputs');
      return parsed.data;
    },
    async renderCard(generatedCardId, bytes) {
      const res = await fetch(`${base}/internal/cards/${encodeURIComponent(generatedCardId)}/render`, {
        method: 'POST',
        headers: { [INTERNAL_TOKEN_HEADER]: token, 'content-type': 'image/webp' },
        body: bytes,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 401) throw new PermanentJobError('The API rejected the internal token');
      if (!res.ok) throw new Error(`API answered ${res.status} for card ${generatedCardId} render`);
      const body = (await res.json()) as { created?: boolean };
      return body.created === true;
    },
  };
}
