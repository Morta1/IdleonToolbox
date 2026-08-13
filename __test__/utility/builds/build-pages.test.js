import { describe, it, expect } from 'vitest';
import {
  assertNoSlugCollisions,
  buildHref,
  buildToSlug,
  staticIdSet,
  titleSlug
} from '../../../utility/builds/build-pages.mjs';

const b = (shortId, title) => ({ shortId, title });

describe('titleSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(titleSlug('Active/Afk Wizard (150+)')).toBe('active-afk-wizard-150');
  });

  it('collapses runs and trims leading/trailing separators', () => {
    expect(titleSlug('  ~~Wizard // AFK ~~ ')).toBe('wizard-afk');
  });

  it('caps length without leaving a trailing hyphen', () => {
    const slug = titleSlug(`${'a'.repeat(40)} ${'b'.repeat(40)}`);
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('returns an empty string for a title with nothing sluggable', () => {
    expect(titleSlug('!!! ???')).toBe('');
    expect(titleSlug(undefined)).toBe('');
  });
});

describe('buildToSlug', () => {
  // The export writes one file per slug on a case-insensitive filesystem, so an uppercase
  // shortId in the path would let 'frZFgN-x' and 'FRzfGn-x' overwrite each other locally while
  // staying distinct on GitHub Pages.
  it('lowercases the shortId', () => {
    expect(buildToSlug(b('OacmGM', 'Active ES'))).toBe('oacmgm-active-es');
  });

  it('falls back to -build when the title slugifies to nothing', () => {
    expect(buildToSlug(b('Zfy6pb', '???'))).toBe('zfy6pb-build');
  });

  // Without the suffix a shortId that happens to spell a class ('wizard') would produce
  // '/tools/builds/wizard' and overwrite a class page.
  it('always keeps a suffix so a slug can never equal a bare class slug', () => {
    expect(buildToSlug(b('wizard', ''))).toBe('wizard-build');
  });
});

describe('buildHref', () => {
  const ids = staticIdSet([b('OacmGM', 'Active ES')]);

  it('points at the static page for a build that has one', () => {
    expect(buildHref(b('OacmGM', 'Active ES'), ids)).toBe('/tools/builds/oacmgm-active-es');
  });

  // fallback: false means a build published since the last deploy has no exported file. Linking
  // it to a static path would 404; view?id= still resolves it at runtime.
  it('falls back to view?id= for a build published since the last deploy', () => {
    expect(buildHref(b('NEWnew', 'Fresh'), ids)).toBe('/tools/builds/view?id=NEWnew');
  });

  it('falls back when no id set is available at all', () => {
    expect(buildHref(b('OacmGM', 'Active ES'), undefined)).toBe('/tools/builds/view?id=OacmGM');
  });

  it('matches ids case-insensitively, since the slug lowercased them', () => {
    expect(buildHref(b('oacmgm', 'Active ES'), ids)).toBe('/tools/builds/oacmgm-active-es');
  });
});

describe('assertNoSlugCollisions', () => {
  it('accepts disjoint, unique sets', () => {
    expect(() => assertNoSlugCollisions(['wizard'], ['abc123-x', 'def456-y'])).not.toThrow();
  });

  // Two paths writing one file is a page silently replaced by another. Fail the build.
  it('throws when a build slug duplicates another build slug', () => {
    expect(() => assertNoSlugCollisions(['wizard'], ['abc123-x', 'abc123-x'])).toThrow(/abc123-x/);
  });

  it('throws when a build slug collides with a class slug', () => {
    expect(() => assertNoSlugCollisions(['wizard'], ['wizard'])).toThrow(/wizard/);
  });
});
