import { describe, expect, it } from 'vitest';
import { featureFlagKeys, parseConfigValue } from '@fact-lens/contracts';
import { categories, configuration, desks, featureFlags } from './data';

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

  it('keeps AI budgets at zero so AI stays off until an operator opts in', () => {
    const ai = configuration.filter((c) => c.key.startsWith('ai.use_case.'));
    expect(ai.length).toBeGreaterThan(0);
    for (const c of ai) expect((c.value as { monthlyBudgetUsd: number }).monthlyBudgetUsd).toBe(0);
  });
});
