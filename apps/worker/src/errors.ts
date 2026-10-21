import { UnrecoverableError } from 'bullmq';

/** Retrying cannot help (bad payload, missing code, rejected credentials): fail the job at once. */
export class PermanentJobError extends UnrecoverableError {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentJobError';
  }
}
