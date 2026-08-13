import '../../polyfills';
import { describe, it, expect } from 'vitest';
import {
  getBuildSlugStaticPaths,
  getBuildSlugStaticProps
} from '../../pages/tools/builds/[slug].jsx';

// Only what this wrapper itself owns. Slug derivation, collision detection, family-vs-subclass
// filtering and title-casing are pure functions in utility/builds/ and are covered directly in
// their own tests - asserting them again through the wrapper tests the same code twice.

const b = (shortId, title, cls, subclass) => ({
  shortId, title, class: cls, subclass,
  ownerName: 'Anon', tags: [], likeCount: 0, viewCount: 0
});

const FIXTURE = [
  b('aaa111', 'Rage Build', 'Warrior', 'Barbarian'),
  b('bbb222', 'Second Barb', 'Warrior', 'Barbarian'),
  b('ccc333', 'Wiz Build', 'Mage', 'Wizard')
];

describe('getBuildSlugStaticPaths', () => {
  it('uses fallback: false, required by output: export', () => {
    expect(getBuildSlugStaticPaths(FIXTURE).fallback).toBe(false);
  });

  it('emits a path for every class and every build', () => {
    const slugs = getBuildSlugStaticPaths(FIXTURE).paths.map((p) => p.params.slug);
    expect(slugs).toContain('barbarian');
    expect(slugs).toContain('aaa111-rage-build');
  });

  // fallback: false makes any unlisted path a hard 404, and the class strip links every class -
  // so a class with no builds yet still needs a page or the strip walks the user into a dead end.
  it('generates a page for classes that have no builds yet', () => {
    const slugs = getBuildSlugStaticPaths(FIXTURE).paths.map((p) => p.params.slug);
    for (const empty of ['siege-breaker', 'arcane-cultist', 'death-bringer', 'wind-walker']) {
      expect(slugs, `${empty} would 404 from the class strip`).toContain(empty);
    }
  });

  it('throws rather than exporting two pages to one file', () => {
    const clashing = [...FIXTURE, b('wizard', '', 'Mage', 'Wizard'), b('wizard', '', 'Mage', 'Wizard')];
    expect(() => getBuildSlugStaticPaths(clashing)).toThrow(/wizard-build/);
  });
});

describe('getBuildSlugStaticProps', () => {
  it('serves a class page for a class slug', () => {
    const { props } = getBuildSlugStaticProps(FIXTURE, 'barbarian');
    expect(props.kind).toBe('class');
    expect(props.builds.map((x) => x.shortId)).toEqual(['aaa111', 'bbb222']);
    expect(props.seoTitle).toBe('Idleon Barbarian Builds | Idleon Toolbox');
  });

  it('serves a build page for a build slug', () => {
    const { props } = getBuildSlugStaticProps(FIXTURE, 'ccc333-wiz-build');
    expect(props.kind).toBe('build');
    expect(props.summary.shortId).toBe('ccc333');
    expect(props.seoTitle).toBe('Wizard Build — Wiz Build | Idleon Toolbox');
  });

  it('keeps the summary to the card fields', () => {
    const { props } = getBuildSlugStaticProps(FIXTURE, 'ccc333-wiz-build');
    expect(Object.keys(props.summary).sort())
      .toEqual(['class', 'likeCount', 'ownerName', 'shortId', 'subclass', 'tags', 'title']);
  });

  // The talent payload rides separately, so the page renders without a cross-origin fetch.
  it('passes the build detail through as initialBuild', () => {
    const detail = { shortId: 'ccc333', title: 'Wiz build', payload: { talents: [7] } };
    const { props } = getBuildSlugStaticProps(FIXTURE, 'ccc333-wiz-build', detail);
    expect(props.initialBuild).toEqual(detail);
  });

  // Next refuses to serialize undefined, and a build whose detail fetch failed has none.
  it('sends null, never undefined, when there is no detail', () => {
    const { props } = getBuildSlugStaticProps(FIXTURE, 'ccc333-wiz-build');
    expect(props.initialBuild).toBeNull();
  });

  it('counts the builds actually on the page in a class description', () => {
    expect(getBuildSlugStaticProps(FIXTURE, 'barbarian').props.seoDescription)
      .toContain('2 community Barbarian builds');
  });

  it('drops the count for a class with no builds rather than saying zero', () => {
    const { props } = getBuildSlugStaticProps(FIXTURE, 'archer');
    expect(props.builds).toEqual([]);
    expect(props.seoDescription).not.toContain('0 community');
    expect(props.seoDescription).toContain('Community Archer builds');
  });

  // Reachable so the strip can't 404, out of the index until it has something to rank on. Flips
  // on its own at the next deploy once a build exists.
  it('noindexes an empty class, and only that case', () => {
    expect(getBuildSlugStaticProps(FIXTURE, 'siege-breaker').props.seoNoindex).toBe(true);
    expect(getBuildSlugStaticProps(FIXTURE, 'barbarian').props.seoNoindex).toBe(false);
    expect(getBuildSlugStaticProps(FIXTURE, 'ccc333-wiz-build').props.seoNoindex).toBe(false);
  });
});
