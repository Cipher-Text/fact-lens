import { jobEnvelopeSchema, jobQueue, queueNames, type JobType, type QueueName } from '@fact-lens/contracts';
import { Worker, type ConnectionOptions, type Job } from 'bullmq';
import { PermanentJobError } from './errors';
import { runOnce } from './idempotency';
import { errorFields } from './log';
import { handlers, parsePayload, type Services } from './processors';

/** Runs one job: validate the envelope and payload, skip a repeat, run the handler, log the outcome. */
export async function processJob(job: Job, services: Services): Promise<void> {
  const { log, pool } = services;
  const envelope = jobEnvelopeSchema.safeParse(job.data);
  if (!envelope.success) throw new PermanentJobError(`Malformed job envelope: ${envelope.error.issues.map((i) => i.message).join('; ')}`);
  const { type, idempotencyKey } = envelope.data;
  const handler = handlers[type] as { receipt: boolean; run(payload: unknown, s: Services): Promise<void> };
  const payload = parsePayload(type, envelope.data.payload);
  const started = Date.now();
  const fields = { jobType: type, jobId: job.id, idempotencyKey, attempt: job.attemptsMade + 1, outboxEventId: envelope.data.outboxEventId };

  try {
    if (handler.receipt) {
      const outcome = await runOnce(pool, idempotencyKey, type, () => handler.run(payload, services));
      log.info(outcome === 'duplicate' ? 'job.duplicate_skipped' : 'job.done', { ...fields, ms: Date.now() - started });
    } else {
      await handler.run(payload, services);
      log.debug('job.done', { ...fields, ms: Date.now() - started });
    }
  } catch (err) {
    log.error('job.failed', { ...fields, permanent: err instanceof PermanentJobError, ms: Date.now() - started, ...errorFields(err) });
    throw err;
  }
}

export interface RuntimeOptions {
  connection: ConnectionOptions;
  prefix: string;
  concurrency: number;
}

/** Per-queue concurrency, so one slow family cannot starve the others. */
const concurrencyFor = (queue: QueueName, base: number) => (queue === 'maintenance' || queue === 'publish' ? 1 : base);

export function startWorkers(services: Services, opts: RuntimeOptions): Worker[] {
  return queueNames.map((name) => {
    const worker = new Worker(name, (job) => processJob(job, services), {
      connection: opts.connection, prefix: opts.prefix, concurrency: concurrencyFor(name, opts.concurrency),
    });
    worker.on('error', (err) => services.log.error('worker.error', { queue: name, ...errorFields(err) }));
    return worker;
  });
}

export const queueFor = (type: JobType): QueueName => jobQueue[type];
