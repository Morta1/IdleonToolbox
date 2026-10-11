import { describe, it, expect } from 'vitest';
import {
  classToSlug,
  slugToDisplayName,
  getBuildClassSlugs,
  buildsForSlug,
  isFamilySlug
} from '@utility/builds/class-paths.mjs';

const b = (shortId, cls, subclass) => ({ shortId, title: shortId, class: cls, subclass });

const FIXTURE = [
  b('1', 'Warrior', 'Barbarian'),
  b('2', 'Warrior', 'Barbarian'),
  b('3', 'Warrior', 'Blood_Berserker'),
  b('4', 'Warrior', null),
  b('5', 'Mage', 'Wizard'),
  b('6', 'Beginner', 'Voidwalker')
];

describe('classToSlug', () => {
  it.each([
    ['Warrior', 'warrior'],
    ['Blood_Berserker', 'blood-berserker'],
    ['Elemental_Sorcerer', 'elemental-sorcerer']
  ])('slugs %s as %s', (name, slug) => {
    expect(classToSlug(name)).toBe(slug);
  });
});

describe('slugToDisplayName', () => {
  it.each([
    ['warrior', 'Warrior'],
    ['blood-berserker', 'Blood Berserker']
  ])('title-cases each word of %s', (slug, name) => {
    expect(slugToDisplayName(slug)).toBe(name);
  });
});

describe('isFamilySlug', () => {
  it.each([
    ['warrior', true],
    ['mage', true],
    ['barbarian', false]
  ])('%s is a family: %s', (slug, family) => {
    expect(isFamilySlug(slug)).toBe(family);
  });
});

describe('getBuildClassSlugs', () => {
  it('always includes all four families', () => {
    const slugs = getBuildClassSlugs([]);
    expect(slugs).toEqual(expect.arrayContaining(['beginner', 'warrior', 'archer', 'mage']));
  });

  it('includes any subclass with at least one build (threshold 1)', () => {
    const slugs = getBuildClassSlugs(FIXTURE);
    expect(slugs).toContain('barbarian');
    expect(slugs).toContain('blood-berserker');
    expect(slugs).toContain('voidwalker');
  });

  it('omits subclasses with no builds', () => {
    const slugs = getBuildClassSlugs(FIXTURE);
    expect(slugs).not.toContain('siege-breaker');
    expect(slugs).not.toContain('arcane-cultist');
  });

  it('ignores builds with a null subclass', () => {
    const slugs = getBuildClassSlugs([b('4', 'Warrior', null)]);
    expect(slugs).toEqual(expect.arrayContaining(['warrior']));
    expect(slugs.filter((s) => s === 'warrior')).toHaveLength(1);
  });

  it('returns no duplicates', () => {
    const slugs = getBuildClassSlugs(FIXTURE);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(['/', '&'])('rejects a subclass containing %s', (char) => {
    const subclass = `foo${char}bar`;
    const slugs = getBuildClassSlugs([b('7', 'Warrior', subclass)]);
    expect(slugs).not.toContain(subclass);
    expect(slugs.some((s) => s.includes(char))).toBe(false);
  });
});

describe('buildsForSlug', () => {
  it('returns every build in a family, including subclassed ones', () => {
    const result = buildsForSlug(FIXTURE, 'warrior');
    expect(result.map((x) => x.shortId)).toEqual(['1', '2', '3', '4']);
  });

  it('returns only builds of a specific subclass', () => {
    const result = buildsForSlug(FIXTURE, 'barbarian');
    expect(result.map((x) => x.shortId)).toEqual(['1', '2']);
  });

  it('matches hyphenated subclass slugs', () => {
    const result = buildsForSlug(FIXTURE, 'blood-berserker');
    expect(result.map((x) => x.shortId)).toEqual(['3']);
  });

  it('returns an empty array for an unknown slug', () => {
    expect(buildsForSlug(FIXTURE, 'siege-breaker')).toEqual([]);
  });
});
