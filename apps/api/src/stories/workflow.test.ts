import { describe, expect, it } from 'vitest';
import { defaultWorkflowPolicy, storyStatuses } from '@fact-lens/contracts';
import { capabilityFor, findTransition, movesFrom, transitions } from './workflow';
import { publishIssues, reviewIssues, slugify, type RevisionSnapshot } from './validation';

describe('workflow', () => {
  it('follows the documented state diagram', () => {
    expect(movesFrom('DRAFT')).toEqual(expect.arrayContaining(['EDITOR_REVIEW', 'ARCHIVED']));
    expect(findTransition('DRAFT', 'PUBLISHED')).toBeUndefined();
    expect(findTransition('DRAFT', 'READY')).toBeUndefined();
    expect(findTransition('READY', 'PUBLISHED')).toBeDefined();
    expect(findTransition('PUBLISHED', 'UPDATED')).toBeUndefined();
    expect(findTransition('PUBLISHED', 'CORRECTED')).toBeUndefined();
    expect(movesFrom('ARCHIVED')).toEqual([]);
  });

  it('never moves a status to itself and only uses known statuses', () => {
    for (const t of transitions) {
      expect(t.from).not.toBe(t.to);
      expect(storyStatuses).toContain(t.from);
      expect(storyStatuses).toContain(t.to);
    }
  });

  it('reads the gating capability from policy, or a fixed one', () => {
    const policy = { ...defaultWorkflowPolicy, requiredCapability: { ...defaultWorkflowPolicy.requiredCapability, ready: 'story.review' } };
    expect(capabilityFor(findTransition('FACT_CHECK', 'READY')!, defaultWorkflowPolicy)).toBe('story.fact_check');
    expect(capabilityFor(findTransition('FACT_CHECK', 'READY')!, policy)).toBe('story.review');
    expect(capabilityFor(findTransition('EDITOR_REVIEW', 'DRAFT')!, policy)).toBe('story.review');
    expect(capabilityFor(findTransition('CORRECTED', 'PUBLISHED')!, policy)).toBe('story.correct');
  });

  it('requires a reason to send back or archive', () => {
    expect(findTransition('EDITOR_REVIEW', 'DRAFT')!.reasonRequired).toBe(true);
    expect(findTransition('PUBLISHED', 'ARCHIVED')!.reasonRequired).toBe(true);
    expect(findTransition('DRAFT', 'EDITOR_REVIEW')!.reasonRequired).toBeUndefined();
  });
});

const body = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] };
const ready: RevisionSnapshot = {
  deskId: 'd', authorCount: 1,
  translations: [{ locale: 'en', title: 'T', slug: 't', body, translationStatus: 'original' }],
  media: [],
};

describe('readiness rules', () => {
  it('passes a complete revision', () => {
    expect(reviewIssues(ready)).toEqual([]);
    expect(publishIssues(ready)).toEqual([]);
  });

  it('lists every missing review requirement', () => {
    const issues = reviewIssues({ deskId: null, authorCount: 0, translations: [{ ...ready.translations[0]!, title: ' ', body: { type: 'doc', content: [] } }], media: [] });
    expect(issues).toHaveLength(4);
    expect(reviewIssues({ ...ready, translations: [] })).toContain('Add at least one translation.');
  });

  it('blocks machine drafts and media without rights or processing', () => {
    const s: RevisionSnapshot = {
      ...ready,
      translations: [{ ...ready.translations[0]!, translationStatus: 'machine_draft' }],
      media: [{ id: 'm1', license: null, attribution: null, processingState: 'ready' }, { id: 'm2', license: 'CC-BY', attribution: null, processingState: 'pending' }],
    };
    expect(reviewIssues(s)).toEqual([]);
    expect(publishIssues(s)).toEqual(['en: machine draft needs human review first.', 'Media m1: record a license or attribution.', 'Media m2: still pending.']);
  });
});

describe('slugify', () => {
  it('handles latin and Bangla titles', () => {
    expect(slugify('Hello, World! 2026', 'x')).toBe('hello-world-2026');
    expect(slugify('বাংলাদেশের খবর', 'x')).toBe('বাংলাদেশের-খবর');
  });
  it('falls back when nothing usable remains', () => {
    expect(slugify('!!!', 'story-1')).toBe('story-1');
  });
});
