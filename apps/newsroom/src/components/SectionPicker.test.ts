import { describe, expect, it } from 'vitest';
import { toggleSection } from './SectionPicker';

describe('toggleSection', () => {
  it('makes the first ticked section the main one', () => {
    expect(toggleSection({ ids: [], primary: null }, 'a')).toEqual({ ids: ['a'], primary: 'a' });
    expect(toggleSection({ ids: ['a'], primary: 'a' }, 'b')).toEqual({ ids: ['a', 'b'], primary: 'a' });
  });

  it('moves the main section to the first left one when it is unticked', () => {
    expect(toggleSection({ ids: ['a', 'b', 'c'], primary: 'b' }, 'b')).toEqual({ ids: ['a', 'c'], primary: 'a' });
    expect(toggleSection({ ids: ['a', 'b'], primary: 'b' }, 'a')).toEqual({ ids: ['b'], primary: 'b' });
  });

  it('has no main section when nothing is ticked', () => {
    expect(toggleSection({ ids: ['a'], primary: 'a' }, 'a')).toEqual({ ids: [], primary: null });
  });
});
