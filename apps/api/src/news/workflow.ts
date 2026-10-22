import type { Capability, NewsStatus, WorkflowPolicy } from '@fact-lens/contracts';
import { newsStatuses, workflowTransitions } from '@fact-lens/contracts';

/**
 * The news item state machine (docs/06). The states and the allowed moves are code: changing them
 * needs an ADR and a migration (docs/21). Which capability gates a move is configuration, so a
 * desk can tune it through `workflow.transition_policy`.
 */

type PolicyKey = (typeof workflowTransitions)[number];

/** What a move does to the news item's revisions, beyond changing its status. */
export type Effect =
  | 'none'
  | 'submit'    // lock the working revision for review
  | 'send_back' // open a new editable revision, keep the reviewed one as it was
  | 'approve'   // mark the reviewed revision approved
  | 'schedule'
  | 'unschedule'
  | 'publish'
  | 'archive';

export interface Transition {
  from: NewsStatus;
  to: NewsStatus;
  effect: Effect;
  /** Capability read from the workflow policy... */
  policyKey?: PolicyKey;
  /** ...or a fixed one. */
  fixed?: Capability;
  reasonRequired?: boolean;
  /** Only allowed when the policy does not make fact-checking mandatory. */
  skipsFactCheck?: boolean;
}

// PUBLISHED -> UPDATED and PUBLISHED -> CORRECTED are not moves: creating a revision or a
// correction makes them, so they cannot be requested here.
const base: Transition[] = [
  { from: 'INGESTED', to: 'RESEARCHING', effect: 'none', fixed: 'news.edit' },
  { from: 'RESEARCHING', to: 'DRAFT', effect: 'none', fixed: 'news.edit' },
  { from: 'DRAFT', to: 'EDITOR_REVIEW', effect: 'submit', policyKey: 'editor_review' },
  { from: 'EDITOR_REVIEW', to: 'DRAFT', effect: 'send_back', fixed: 'news.review', reasonRequired: true },
  { from: 'EDITOR_REVIEW', to: 'FACT_CHECK', effect: 'none', policyKey: 'fact_check' },
  { from: 'EDITOR_REVIEW', to: 'READY', effect: 'approve', policyKey: 'ready', skipsFactCheck: true },
  { from: 'FACT_CHECK', to: 'DRAFT', effect: 'send_back', fixed: 'news.fact_check', reasonRequired: true },
  { from: 'FACT_CHECK', to: 'READY', effect: 'approve', policyKey: 'ready' },
  { from: 'READY', to: 'SCHEDULED', effect: 'schedule', policyKey: 'publish' },
  { from: 'READY', to: 'PUBLISHED', effect: 'publish', policyKey: 'publish' },
  { from: 'SCHEDULED', to: 'READY', effect: 'unschedule', policyKey: 'publish' },
  { from: 'SCHEDULED', to: 'PUBLISHED', effect: 'publish', policyKey: 'publish' },
  { from: 'UPDATED', to: 'PUBLISHED', effect: 'publish', policyKey: 'publish' },
  { from: 'CORRECTED', to: 'PUBLISHED', effect: 'publish', policyKey: 'correct' },
];

const archive: Transition[] = newsStatuses
  .filter((s) => s !== 'ARCHIVED')
  .map((from) => ({ from, to: 'ARCHIVED' as const, effect: 'archive' as const, policyKey: 'archive' as const, reasonRequired: true }));

export const transitions: readonly Transition[] = [...base, ...archive];

export function findTransition(from: NewsStatus, to: NewsStatus): Transition | undefined {
  return transitions.find((t) => t.from === from && t.to === to);
}

export function movesFrom(from: NewsStatus): NewsStatus[] {
  return transitions.filter((t) => t.from === from).map((t) => t.to);
}

export function capabilityFor(t: Transition, policy: WorkflowPolicy): Capability {
  if (t.fixed) return t.fixed;
  return policy.requiredCapability[t.policyKey!] as Capability;
}

/** Statuses in which the public site keeps showing the last published revision. */
export const LIVE_STATUSES: readonly NewsStatus[] = ['PUBLISHED', 'UPDATED', 'CORRECTED'];
