import '../../polyfills';
import { describe, it, expect } from 'vitest';
import {
  getBuildClassStaticPaths,
  getBuildClassStaticProps
} from '../../pages/tools/builds/[class].jsx';

// Only what this wrapper itself owns. Slug derivation, family-vs-subclass filtering and
// title-casing are pure functions in utility/builds/class-paths.mjs and are covered directly in
// __test__/utility/builds/class-paths.test.js - asserting them again through the wrapper tests
// the same code twice.

const b = (shortId, cls, subclass) => ({
  shortId, title: shortId, class: cls, subclass,
  ownerName: 'Anon', tags: [], likeCount: 0, viewCount: 0
});

const FIXTURE = [
  b('1', 'Warrior', 'Barbarian'),
  b('2', 'Warrior', 'Barbarian'),
  b('3', 'Mage', 'Wizard')
];

describe('getBuildClassStaticPaths', () => {
  it('uses fallback: false, required by output: export', () => {
    expect(getBuildClassStaticPaths().fallback).toBe(false);
  });

  it('emits a path entry per slug in the shape Next expects', () => {
    const { paths } = getBuildClassStaticPaths();
    expect(paths).toContainEqual({ params: { class: 'barbarian' } });
    expect(paths).toContainEqual({ params: { class: 'warrior' } });
  });

  // fallback: false makes any unlisted path a hard 404, and the class picker offers every class
  // in the game - so a class with no builds yet still needs a page or the picker walks the user
  // into a dead end.
  it('generates a page for classes that have no builds yet', () => {
    const slugs = getBuildClassStaticPaths().paths.map((p) => p.params.class);
    for (const empty of ['siege-breaker', 'arcane-cultist', 'death-bringer', 'wind-walker']) {
      expect(slugs, `${empty} would 404 from the class picker`).toContain(empty);
    }
  });
});

describe('getBuildClassStaticProps', () => {
  it('passes only the builds for that slug', () => {
    expect(getBuildClassStaticProps(FIXTURE, 'barbarian').props.builds.map((x) => x.shortId))
      .toEqual(['1', '2']);
  });

  // PAGE_SEO is keyed by route pattern, so all 18 generated pages would otherwise share one
  // title. _document reads these props in preference to the map.
  it('gives each class page its own title naming the class', () => {
    expect(getBuildClassStaticProps(FIXTURE, 'barbarian').props.seoTitle)
      .toBe('Idleon Barbarian Builds | Idleon Toolbox');
    expect(getBuildClassStaticProps(FIXTURE, 'wizard').props.seoTitle)
      .toBe('Idleon Wizard Builds | Idleon Toolbox');
  });

  it('counts the builds actually on the page in the description', () => {
    expect(getBuildClassStaticProps(FIXTURE, 'barbarian').props.seoDescription)
      .toContain('2 community Barbarian builds');
  });

  it('drops the count for a class with no builds rather than saying zero', () => {
    const { props } = getBuildClassStaticProps(FIXTURE, 'archer');
    expect(props.builds).toEqual([]);
    expect(props.seoDescription).not.toContain('0 community');
    expect(props.seoDescription).toContain('Community Archer builds');
  });

  // Reachable, but nothing to rank on until someone publishes for it. Flips on its own at the
  // next deploy once a build exists.
  it('noindexes a class with no builds, and only that case', () => {
    expect(getBuildClassStaticProps(FIXTURE, 'siege-breaker').props.seoNoindex).toBe(true);
    expect(getBuildClassStaticProps(FIXTURE, 'barbarian').props.seoNoindex).toBe(false);
  });
});
