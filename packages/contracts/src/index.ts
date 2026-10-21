import { z } from 'zod';

/** Transport schemas only. Never database entities. */

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

export const livenessResponseSchema = z.object({ status: z.literal('ok') });
export type LivenessResponse = z.infer<typeof livenessResponseSchema>;

export const readinessResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  checks: z.record(z.string(), z.enum(['up', 'down'])),
});
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;

export * from './enums';
export * from './common';
export * from './editorial';
export * from './ads';
export * from './configuration';
export * from './auth';
