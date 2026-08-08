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
  it('includes subclass and class for a known build', () => {
    expect(buildSeoTitle(toBuildSummary(full)))
      .toBe('Mago de talar — Wizard Mage Build | Idleon Toolbox');
  });

  it('omits the subclass when there is none', () => {
    const noSub = toBuildSummary({ ...full, subclass: null });
    expect(buildSeoTitle(noSub)).toBe('Mago de talar — Mage Build | Idleon Toolbox');
  });

  it('falls back to a generic title for an unknown build', () => {
    expect(buildSeoTitle(null)).toBe('Build | Idleon Toolbox');
  });
});

describe('buildSeoDescription', () => {
  it('mentions author, class and tags', () => {
    const d = buildSeoDescription(toBuildSummary(full));
    expect(d).toContain('Anon');
    expect(d).toContain('Wizard Mage');
    expect(d).toContain('afk');
  });

  it('falls back to generic copy for an unknown build', () => {
    expect(buildSeoDescription(null)).toBe('Community build for Legends of Idleon');
  });
});
