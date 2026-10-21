import { z } from 'zod';
import { idSchema, localeCodeSchema, slugSchema, timestampSchema } from './common';

/**
 * Versioned contracts for the transactional outbox and the background jobs it feeds
 * (docs/08). The outbox row is the durable record; Redis only holds queue state.
 */

// ---- outbox events (written by the API in the same transaction as the change)

export const outboxEventSchemas = {
  'story.published': z.object({
    storyId: idSchema,
    revisionId: idSchema,
    locales: z.array(z.object({ locale: localeCodeSchema, slug: slugSchema })).min(1),
  }),
  'story.archived': z.object({ storyId: idSchema }),
  'story.schedule_failed': z.object({ storyId: idSchema, scheduleId: idSchema, reason: z.string() }),
  'config.flag_changed': z.object({ key: z.string(), enabled: z.boolean() }),
} as const;

export type OutboxEventType = keyof typeof outboxEventSchemas;
export const outboxEventTypes = Object.keys(outboxEventSchemas) as OutboxEventType[];
export type OutboxEventPayload<T extends OutboxEventType> = z.infer<(typeof outboxEventSchemas)[T]>;

// ---- jobs

export const jobPayloadSchemas = {
  'story.publish_scheduled': z.object({ scheduleId: idSchema }),
  'cache.invalidate': z.object({ tags: z.array(z.string().min(1).max(200)).min(1).max(100) }),
  'search.index': z.object({ storyId: idSchema, operation: z.enum(['upsert', 'delete']) }),
  'notification.send': z.object({
    kind: z.enum(['schedule_failed']),
    storyId: idSchema,
    scheduleId: idSchema,
    reason: z.string(),
  }),
  'media.variant': z.object({ mediaAssetId: idSchema }),
  'media.card_generate': z.object({ generatedCardId: idSchema }),
  'schedule.scan': z.object({}),
} as const;

export type JobType = keyof typeof jobPayloadSchemas;
export const jobTypes = Object.keys(jobPayloadSchemas) as JobType[];
export type JobPayload<T extends JobType> = z.infer<(typeof jobPayloadSchemas)[T]>;

/** One queue per job family, so concurrency and backlog are tuned and watched separately. */
export const queueNames = ['publish', 'cache', 'search', 'notify', 'media', 'maintenance'] as const;
export type QueueName = (typeof queueNames)[number];

export const jobQueue: Record<JobType, QueueName> = {
  'story.publish_scheduled': 'publish',
  'cache.invalidate': 'cache',
  'search.index': 'search',
  'notification.send': 'notify',
  'media.variant': 'media',
  'media.card_generate': 'media',
  'schedule.scan': 'maintenance',
};

/**
 * The wrapper around every job payload. `idempotencyKey` identifies the operation: running a
 * job twice with the same key must have the same effect as running it once.
 */
export const jobEnvelopeSchema = z.object({
  id: idSchema,
  type: z.enum(jobTypes as [JobType, ...JobType[]]),
  version: z.literal(1),
  idempotencyKey: z.string().min(1).max(300),
  occurredAt: timestampSchema,
  /** Set when the job came from an outbox row. */
  outboxEventId: z.number().int().positive().optional(),
  payload: z.unknown(),
});
export type JobEnvelope = z.infer<typeof jobEnvelopeSchema>;

// ---- internal API used by the worker (service-to-service, not the public API)

export const scheduledPublishResultSchema = z.object({
  result: z.enum(['published', 'already_published', 'cancelled', 'failed', 'not_due']),
  storyId: idSchema.nullable(),
  detail: z.string().optional(),
});
export type ScheduledPublishResult = z.infer<typeof scheduledPublishResultSchema>;

export const INTERNAL_TOKEN_HEADER = 'x-internal-token';
