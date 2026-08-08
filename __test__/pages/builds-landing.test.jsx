import '../../polyfills';
import { describe, it, expect } from 'vitest';
import { getBuildsLandingStaticProps } from '../../pages/tools/builds.jsx';

const b = (shortId) => ({
  shortId, title: shortId, class: 'Warrior', subclass: 'Barbarian',
  ownerName: 'Anon', tags: [], likeCount: 0, viewCount: 0
});

describe('getBuildsLandingStaticProps', () => {
  it('passes the fetched builds through as initialBuilds', () => {
    const { props } = getBuildsLandingStaticProps([b('1'), b('2')]);
    expect(props.initialBuilds.map((x) => x.shortId)).toEqual(['1', '2']);
  });

  it('returns an empty array rather than undefined when given none', () => {
    const { props } = getBuildsLandingStaticProps([]);
    expect(props.initialBuilds).toEqual([]);
  });
});
