import '../../polyfills';
import { describe, it, expect } from 'vitest';
import { getBuildsLandingStaticProps } from '../../pages/tools/builds.jsx';

const b = (shortId, createdAt) => ({
  shortId, title: shortId, class: 'Warrior', subclass: 'Barbarian',
  ownerName: 'Anon', tags: [], likeCount: 0, viewCount: 0, createdAt
});

describe('getBuildsLandingStaticProps', () => {
  it('returns builds newest-first by createdAt, regardless of input order', () => {
    const builds = [
      b('mid', '2026-08-05T00:00:00.000Z'),
      b('oldest', '2026-08-01T00:00:00.000Z'),
      b('newest', '2026-08-08T00:00:00.000Z')
    ];
    const { props } = getBuildsLandingStaticProps(builds);
    expect(props.initialBuilds.map((x) => x.shortId)).toEqual(['newest', 'mid', 'oldest']);
  });

  // The hub is the only page linking every build. A capped list is a page a crawler can't use to
  // reach the rest, which is the discovery failure this whole change set exists to fix.
  it('does not cap the list', () => {
    const builds = Array.from({ length: 60 }, (_, i) =>
      b(`build-${i}`, new Date(2026, 0, i + 1).toISOString()));
    expect(getBuildsLandingStaticProps(builds).props.initialBuilds).toHaveLength(60);
  });

  it('returns an empty array rather than undefined when given none', () => {
    expect(getBuildsLandingStaticProps([]).props.initialBuilds).toEqual([]);
  });
});
