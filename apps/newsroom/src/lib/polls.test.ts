import { describe, expect, it } from 'vitest';
import { fromDhakaInput, percents, toDhakaInput } from './polls';

describe('Dhaka date fields', () => {
  it('reads a Dhaka time as UTC, and back', () => {
    expect(fromDhakaInput('2026-10-22T16:00')).toBe('2026-10-22T10:00:00.000Z');
    expect(toDhakaInput('2026-10-22T10:00:00.000Z')).toBe('2026-10-22T16:00');
    expect(toDhakaInput('2026-10-22T20:30:00.000Z')).toBe('2026-10-23T02:30'); // across midnight
    expect(toDhakaInput(null)).toBe('');
  });
  it('treats an empty or malformed value as no time', () => {
    expect(fromDhakaInput('')).toBeNull();
    expect(fromDhakaInput('tomorrow')).toBeNull();
  });
});

describe('percents', () => {
  it('adds up to 100', () => {
    expect(percents([1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(100);
    expect(percents([412, 538, 267, 183])).toEqual([29, 38, 19, 13].map((n, i) => (i === 1 ? 39 : n)));
    expect(percents([0, 0])).toEqual([0, 0]);
  });
});
