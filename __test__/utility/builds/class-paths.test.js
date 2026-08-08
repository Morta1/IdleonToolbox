import { describe, it, expect } from 'vitest';
import {
  BUILD_FAMILIES,
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
  it('lowercases a simple class name', () => {
    expect(classToSlug('Warrior')).toBe('warrior');
  });

  it('converts underscores to hyphens', () => {
    expect(classToSlug('Blood_Berserker')).toBe('blood-berserker');
    expect(classToSlug('Elemental_Sorcerer')).toBe('elemental-sorcerer');
  });
});

describe('slugToDisplayName', () => {
  it('title-cases a single word', () => {
    expect(slugToDisplayName('warrior')).toBe('Warrior');
  });

  it('title-cases each word of a hyphenated slug', () => {
    expect(slugToDisplayName('blood-berserker')).toBe('Blood Berserker');
  });
});

describe('isFamilySlug', () => {
  it('recognises the four families', () => {
    expect(isFamilySlug('warrior')).toBe(true);
    expect(isFamilySlug('mage')).toBe(true);
  });

  it('rejects subclasses', () => {
    expect(isFamilySlug('barbarian')).toBe(false);
  });
});

describe('getBuildClassSlugs', () => {
  it('always includes all four families', () => {
    const slugs = getBuildClassSlugs([]);
    expect(slugs).toEqual(expect.arrayContaining(['beginner', 'warrior', 'archer', 'mage']));
  });

  it('includes families even when they have no builds', () => {
    const slugs = getBuildClassSlugs([b('1', 'Warrior', 'Barbarian')]);
    expect(slugs).toContain('archer');
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
