import '../../polyfills';
import { describe, it, expect } from 'vitest';
import {
  toBuildSummary,
  findInManifest,
  buildSeoTitle,
  buildSeoDescription
} from '../../pages/tools/builds/view.jsx';

const full = {
  shortId: 'Zfy6pb', title: 'Mago de talar', class: 'Mage', subclass: 'Wizard',
  ownerName: 'Anon', tags: ['afk', 'choppin'], likeCount: 3, viewCount: 344,
  createdAt: '2026-07-04T05:32:36.235Z', talents: { huge: 'payload' }
};

describe('toBuildSummary', () => {
  it('keeps the fields needed for metadata', () => {
    expect(toBuildSummary(full)).toEqual({
      shortId: 'Zfy6pb', title: 'Mago de talar', class: 'Mage', subclass: 'Wizard',
      ownerName: 'Anon', tags: ['afk', 'choppin'], likeCount: 3
    });
  });

  it('drops heavy fields that would bloat the page payload', () => {
    expect(toBuildSummary(full).talents).toBeUndefined();
    expect(toBuildSummary(full).viewCount).toBeUndefined();
  });
});

describe('findInManifest', () => {
  const manifest = [toBuildSummary(full)];

  it('finds a build by shortId', () => {
    expect(findInManifest(manifest, 'Zfy6pb').title).toBe('Mago de talar');
  });

  it('returns null for a build published since the last deploy', () => {
    expect(findInManifest(manifest, 'unknown')).toBeNull();
  });

  it('returns null when the id is undefined during first render', () => {
    expect(findInManifest(manifest, undefined)).toBeNull();
  });
});

describe('buildSeoTitle', () => {
  it('leads with the class, not the free-text build title', () => {
    expect(buildSeoTitle(toBuildSummary(full)))
      .toBe('Wizard Build — Mago de talar | Idleon Toolbox');
  });

  it('names the subclass alone, never "<subclass> <family>"', () => {
    const journeyman = toBuildSummary({ ...full, class: 'Beginner', subclass: 'Journeyman' });
    expect(buildSeoTitle(journeyman)).toContain('Journeyman Build');
    expect(buildSeoTitle(journeyman)).not.toContain('Journeyman Beginner');
  });

  it('falls back to the family when a build has no subclass', () => {
    const noSub = toBuildSummary({ ...full, subclass: null });
    expect(buildSeoTitle(noSub)).toBe('Mage Build — Mago de talar | Idleon Toolbox');
  });

  it('underscores in a subclass become spaces', () => {
    const bb = toBuildSummary({ ...full, class: 'Warrior', subclass: 'Blood_Berserker' });
    expect(buildSeoTitle(bb)).toBe('Blood Berserker Build — Mago de talar | Idleon Toolbox');
  });

  // Google truncates around 60 characters. Leading with the class is what keeps the term the
  // page targets on screen when a user's title is long.
  it('keeps the class within the first 60 characters even with a long title', () => {
    const longTitle = toBuildSummary({
      ...full,
      title: 'Maestro Skilling: Left + Right Hands (~100) and then some more words'
    });
    expect(buildSeoTitle(longTitle).slice(0, 60)).toContain('Wizard Build');
  });

  it('falls back to a generic title for an unknown build', () => {
    expect(buildSeoTitle(null)).toBe('Build | Idleon Toolbox');
  });
});

describe('buildSeoDescription', () => {
  it('mentions author, class and tags', () => {
    const d = buildSeoDescription(toBuildSummary(full));
    expect(d).toContain('Anon');
    expect(d).toContain('Wizard');
    expect(d).toContain('afk');
  });

  it('falls back to generic copy for an unknown build', () => {
    expect(buildSeoDescription(null)).toBe('Community build for Legends of Idleon');
  });
});
