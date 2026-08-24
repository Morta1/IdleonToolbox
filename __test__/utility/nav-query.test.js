import { describe, expect, test } from 'vitest';
import { sessionQuery, sessionQueryWithoutProfile } from '../../utility/nav-query';

// The nav used to forward everything except the tab params, so any param the visitor arrived with
// followed them to every page after it. Search Console reported ~1,900 URLs minted this way.
describe('sessionQuery', () => {
  test('keeps the params that identify which save is being viewed', () => {
    expect(sessionQuery({ profile: 'Morojo', demo: 'true' })).toEqual({ profile: 'Morojo', demo: 'true' });
  });

  test('drops tab params, which belong to the page being left', () => {
    expect(sessionQuery({ profile: 'Morojo', t: 'Upgrades', nt: '2', dnt: '1' })).toEqual({ profile: 'Morojo' });
  });

  test.each([
    ['a build slug reaching the god planner', { slug: 'divine-knight' }],
    ['class and build index reaching the guilds page', { c: 'barbarian', b: '11' }],
    ['a 404 message reaching the leaderboards', { reason: 'profile', name: 'Tay' }],
    ['an item search term', { q: 'platinum' }],
    ['a param the app does not even read', { pb: 'VHFQx3zU' }]
  ])('drops %s', (_label, query) => {
    expect(sessionQuery(query)).toEqual({});
  });

  test('survives a missing query', () => {
    expect(sessionQuery(undefined)).toEqual({});
  });

  // An empty string is a real value here: ?profile= should not silently become "no profile".
  test('keeps an empty-string value but drops an absent one', () => {
    expect(sessionQuery({ profile: '' })).toEqual({ profile: '' });
    expect(sessionQuery({ profile: undefined })).toEqual({});
  });
});

describe('sessionQueryWithoutProfile', () => {
  test('leaves the profile behind and keeps the rest of the session', () => {
    expect(sessionQueryWithoutProfile({ profile: 'Morojo', demo: 'true', t: 'Upgrades' })).toEqual({ demo: 'true' });
  });
});
