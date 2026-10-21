import { randomUUID } from 'node:crypto';
import { Queue, type ConnectionOptions, type JobsOptions } from 'bullmq';
import {
  jobEnvelopeSchema, jobPayloadSchemas, jobQueue, queueNames, type JobEnvelope, type JobPayload, type JobType, type QueueName,
} from '@fact-lens/contracts';

export interface JobRequest<T extends JobType = JobType> {
  type: T;
  payload: JobPayload<T>;
  /** The operation's identity. The same key never queues the job twice while the first is kept. */
  idempotencyKey: string;
  outboxEventId?: number;
}

export type Enqueue = (request: JobRequest) => Promise<void>;

/** Retry policy per job type: transient failures back off exponentially with jitter. */
const retryPolicy: Partial<Record<JobType, { attempts: number; delay: number }>> = {
  'story.publish_scheduled': { attempts: 8, delay: 2000 },
  'schedule.scan': { attempts: 1, delay: 1000 },
};
const defaultPolicy = { attempts: 5, delay: 1000 };

export function jobOptions(type: JobType, jobId: string): JobsOptions {
  const { attempts, delay } = retryPolicy[type] ?? defaultPolicy;
  return {
    jobId,
    attempts,
    backoff: { type: 'exponential', delay, jitter: 0.5 },
    removeOnComplete: { age: 3600, count: 1000 },
    // Failed jobs stay a week so an operator can inspect them (dead-letter visibility).
    removeOnFail: { age: 7 * 24 * 3600 },
  };
}

/** BullMQ custom job ids cannot contain ':'. */
export const toJobId = (idempotencyKey: string) => idempotencyKey.replaceAll(':', '_');

export function buildEnvelope<T extends JobType>(request: JobRequest<T>, now: Date = new Date()): JobEnvelope {
  const payload = jobPayloadSchemas[request.type].parse(request.payload);
  return jobEnvelopeSchema.parse({
    id: randomUUID(),
    type: request.type,
    version: 1,
    idempotencyKey: request.idempotencyKey,
    occurredAt: now.toISOString(),
    ...(request.outboxEventId ? { outboxEventId: request.outboxEventId } : {}),
    payload,
  });
}

export class QueueRegistry {
  private readonly queues = new Map<QueueName, Queue>();

  constructor(
    readonly connection: ConnectionOptions,
    readonly prefix: string = 'fl',
  ) {
    for (const name of queueNames) this.queues.set(name, new Queue(name, { connection, prefix }));
  }

  queue(name: QueueName): Queue {
    return this.queues.get(name)!;
  }

  all(): Array<[QueueName, Queue]> {
    return [...this.queues.entries()];
  }

  enqueue: Enqueue = async (request) => {
    const envelope = buildEnvelope(request);
    await this.queue(jobQueue[request.type]).add(request.type, envelope, jobOptions(request.type, toJobId(request.idempotencyKey)));
  };

  async close() {
    await Promise.all(this.all().map(([, q]) => q.close()));
  }
}
