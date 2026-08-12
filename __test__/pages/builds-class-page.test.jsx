import '../../polyfills';
import { describe, it, expect } from 'vitest';
import {
  getBuildClassStaticPaths,
  getBuildClassStaticProps
} from '../../pages/tools/builds/[class].jsx';

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
    expect(getBuildClassStaticPaths(FIXTURE).fallback).toBe(false);
  });

  it('emits a path entry per slug in the shape Next expects', () => {
    const { paths } = getBuildClassStaticPaths(FIXTURE);
    expect(paths).toContainEqual({ params: { class: 'barbarian' } });
    expect(paths).toContainEqual({ params: { class: 'warrior' } });
  });

  it('includes all four families plus subclasses that have builds', () => {
    const { paths } = getBuildClassStaticPaths(FIXTURE);
    const slugs = paths.map((p) => p.params.class);
    expect(slugs).toEqual(expect.arrayContaining([
      'beginner', 'warrior', 'archer', 'mage', 'barbarian', 'wizard'
    ]));
    expect(slugs).not.toContain('siege-breaker');
  });
});

describe('getBuildClassStaticProps', () => {
  it('passes only the builds for that slug', () => {
    const { props } = getBuildClassStaticProps(FIXTURE, 'barbarian');
    expect(props.builds.map((x) => x.shortId)).toEqual(['1', '2']);
  });

  it('includes every build in the family for a family slug', () => {
    const { props } = getBuildClassStaticProps(FIXTURE, 'warrior');
    expect(props.builds).toHaveLength(2);
  });

  it('exposes the display name used in the title', () => {
    const { props } = getBuildClassStaticProps(FIXTURE, 'barbarian');
    expect(props.displayName).toBe('Barbarian');
  });

  it('title-cases multi-word subclass names', () => {
    const withBB = [...FIXTURE, b('4', 'Warrior', 'Blood_Berserker')];
    const { props } = getBuildClassStaticProps(withBB, 'blood-berserker');
    expect(props.displayName).toBe('Blood Berserker');
  });

  it('returns an empty build list for a family with no builds', () => {
    const { props } = getBuildClassStaticProps(FIXTURE, 'archer');
    expect(props.builds).toEqual([]);
    expect(props.displayName).toBe('Archer');
  });
});

describe('static SEO props', () => {
  // PAGE_SEO is keyed by route pattern, so all 18 generated pages would otherwise share one
  // title. _document reads these props in preference to the map.
  it('gives each class page its own title naming the class', () => {
    const { props } = getBuildClassStaticProps(FIXTURE, 'barbarian');
    expect(props.seoTitle).toBe('Idleon Barbarian Builds | Idleon Toolbox');
  });

  it('leads the title with the class, inside Google\'s ~60 character cutoff', () => {
    const { props } = getBuildClassStaticProps(FIXTURE, 'blood-berserker');
    expect(props.seoTitle.indexOf('Blood Berserker')).toBeLessThan(60);
  });

  it('counts the builds actually on the page in the description', () => {
    const { props } = getBuildClassStaticProps(FIXTURE, 'barbarian');
    expect(props.seoDescription).toContain('2 community Barbarian builds');
  });

  it('drops the count for a class with no builds rather than saying zero', () => {
    const { props } = getBuildClassStaticProps(FIXTURE, 'beginner');
    expect(props.seoDescription).not.toContain('0 community');
    expect(props.seoDescription).toContain('Community Beginner builds');
  });
});
