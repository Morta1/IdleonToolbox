import { describe, it, expect } from 'vitest';
import {
  classToSlug,
  slugToDisplayName,
  getBuildClassSlugs,
  buildsForSlug,
  isFamilySlug
} from '@utility/builds/class-paths.mjs';

const b = (shortId, cls, subclass) => ({ shortId, title: shortId, class: cls, subclass });
const FAMILIES = ['beginner', 'warrior', 'archer', 'mage'];

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
    ['Blood_Berserker', 'blood-berserker']
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
    ['barbarian', false]
  ])('%s is a family: %s', (slug, family) => {
    expect(isFamilySlug(slug)).toBe(family);
  });
});

describe('getBuildClassSlugs', () => {
  it('always includes all four families', () => {
    expect(getBuildClassSlugs([])).toEqual(FAMILIES);
  });

  it('adds each subclass with at least one build once, and nothing for a null subclass', () => {
    expect(getBuildClassSlugs(FIXTURE)).toEqual([...FAMILIES, 'barbarian', 'blood-berserker', 'wizard', 'voidwalker']);
  });

  it.each(['/', '&'])('rejects a subclass containing %s', (char) => {
    expect(getBuildClassSlugs([b('7', 'Warrior', `foo${char}bar`)])).toEqual(FAMILIES);
  });
});

describe('buildsForSlug', () => {
  it('returns every build in a family, including subclassed ones', () => {
    const result = buildsForSlug(FIXTURE, 'warrior');
    expect(result.map((x) => x.shortId)).toEqual(['1', '2', '3', '4']);
  });

  it('matches hyphenated subclass slugs', () => {
    const result = buildsForSlug(FIXTURE, 'blood-berserker');
    expect(result.map((x) => x.shortId)).toEqual(['3']);
  });

  it('returns an empty array for an unknown slug', () => {
    expect(buildsForSlug(FIXTURE, 'siege-breaker')).toEqual([]);
  });
});
