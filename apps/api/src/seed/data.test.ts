import { describe, expect, it } from 'vitest';
import { featureFlagKeys, parseConfigValue } from '@fact-lens/contracts';
import { capabilities } from '@fact-lens/contracts';
import { tags } from './tags';
import { categories, configuration, desks, featureFlags, roles } from './data';

describe('seed data', () => {
  it('has configuration values that satisfy their contract schemas', () => {
    for (const c of configuration) expect(() => parseConfigValue(c.key, c.value), c.key).not.toThrow();
  });

  it('has no duplicate keys', () => {
    const uniq = (xs: string[]) => new Set(xs).size === xs.length;
    expect(uniq(configuration.map((c) => `${c.key}|${c.scope}`))).toBe(true);
    expect(uniq(desks.map((d) => d.key))).toBe(true);
    expect(uniq(categories.map((c) => c.key))).toBe(true);
  });

  it('seeds every declared feature flag exactly once', () => {
    expect(featureFlags.map((f) => f.key).sort()).toEqual([...featureFlagKeys].sort());
  });

  it('has an English and a Bangla name for every category', () => {
    for (const c of categories) {
      expect(c.en.length).toBeGreaterThan(0);
      expect(c.bn).toMatch(/[ঀ-৿]/);
    }
  });

  it('has tags with unique keys, an English name and a Bangla name', () => {
    expect(tags).toHaveLength(146);
    expect(new Set(tags.map((x) => x.key)).size).toBe(tags.length);
    expect(new Set(tags.map((x) => x.bnSlug)).size).toBe(tags.length);
    for (const x of tags) {
      expect(x.key).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(x.bn).toMatch(/[ঀ-৿]/);
    }
  });

  it('keeps AI budgets at zero so AI stays off until an operator opts in', () => {
    const ai = configuration.filter((c) => c.key.startsWith('ai.use_case.'));
    expect(ai.length).toBeGreaterThan(0);
    for (const c of ai) expect((c.value as { monthlyBudgetUsd: number }).monthlyBudgetUsd).toBe(0);
  });

  it('defines the eight documented roles, with config.manage held only by admin', () => {
    expect(roles.map((r) => r.key).sort()).toEqual(
      ['admin', 'analyst', 'copy_editor', 'desk_editor', 'fact_checker', 'managing_editor', 'media_editor', 'reporter'],
    );
    const holders = roles.filter((r) => r.capabilities.includes('config.manage')).map((r) => r.key);
    expect(holders).toEqual(['admin']);
    expect(new Set(roles.find((r) => r.key === 'admin')!.capabilities)).toEqual(new Set(capabilities));
  });
});
