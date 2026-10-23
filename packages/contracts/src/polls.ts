import { z } from 'zod';
import { idSchema, localeCodeSchema, timestampSchema } from './common';
import { pollStatuses } from './enums';

/**
 * Reader polls: written in the newsroom, voted on from the public site. The question and each option exist
 * per language. Voting is one per browser, with a per-address limit (docs/22, ADR-024): it is a reader
 * engagement feature, not a survey.
 */

const question = z.string().trim().min(1).max(300);
const optionLabel = z.string().trim().min(1).max(120);

/** What an editor writes. Every option has a label in every language that has a question. */
export const pollInputSchema = z
  .object({
    questions: z.record(localeCodeSchema, question).refine((q) => Object.keys(q).length > 0, 'write the question in at least one language'),
    /** Two to four options, in order. Each is a label by language code. */
    options: z.array(z.record(localeCodeSchema, optionLabel)).min(2, 'a poll needs at least two options').max(4, 'a poll has at most four options'),
    opensAt: timestampSchema.nullish(),
    closesAt: timestampSchema.nullish(),
  })
  .superRefine((p, ctx) => {
    for (const locale of Object.keys(p.questions)) {
      p.options.forEach((option, i) => {
        if (!option[locale]) ctx.addIssue({ code: 'custom', path: ['options', i, locale], message: `option ${i + 1} needs a ${locale} label` });
      });
    }
    p.options.forEach((option, i) => {
      for (const locale of Object.keys(option)) {
        if (!p.questions[locale]) ctx.addIssue({ code: 'custom', path: ['options', i, locale], message: `${locale} has labels but no question` });
      }
    });
    if (p.opensAt && p.closesAt && Date.parse(p.closesAt) <= Date.parse(p.opensAt)) {
      ctx.addIssue({ code: 'custom', path: ['closesAt'], message: 'closing must be after opening' });
    }
  });
export type PollInput = z.infer<typeof pollInputSchema>;

export const pollFeatureSchema = z.object({ featured: z.boolean() });

export const pollListQuerySchema = z.object({ status: z.enum(pollStatuses).optional() });

export const pollOptionSchema = z.object({
  id: idSchema,
  position: z.number().int(),
  labels: z.record(localeCodeSchema, z.string()),
  votes: z.number().int().nonnegative(),
});

/** A poll as the newsroom sees it. */
export const pollSchema = z.object({
  id: idSchema,
  status: z.enum(pollStatuses),
  opensAt: timestampSchema.nullable(),
  closesAt: timestampSchema.nullable(),
  featured: z.boolean(),
  questions: z.record(localeCodeSchema, z.string()),
  options: z.array(pollOptionSchema),
  totalVotes: z.number().int().nonnegative(),
  /** False once it has votes (or is closed): the wording can no longer change. */
  editable: z.boolean(),
  createdAt: timestampSchema,
});
export type Poll = z.infer<typeof pollSchema>;

// ---- what readers get

export const publicPollSchema = z.object({
  id: idSchema,
  question: z.string(),
  /** True while voting is possible; false once it has closed (the results still show). */
  open: z.boolean(),
  options: z.array(z.object({ id: idSchema, label: z.string(), votes: z.number().int().nonnegative() })),
  totalVotes: z.number().int().nonnegative(),
  /** The option this browser voted for, if it did. */
  myVote: idSchema.nullable(),
});
export type PublicPoll = z.infer<typeof publicPollSchema>;

export const pollVoteSchema = z.object({ optionId: idSchema, locale: localeCodeSchema });
export type PollVote = z.infer<typeof pollVoteSchema>;

export const pollVoteResultSchema = publicPollSchema.extend({
  /** True when this browser had already voted: nothing was counted again. */
  alreadyVoted: z.boolean(),
});
export type PollVoteResult = z.infer<typeof pollVoteResultSchema>;
