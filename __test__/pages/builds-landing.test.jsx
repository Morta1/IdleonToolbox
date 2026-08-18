import '../../polyfills';
import { describe, it, expect } from 'vitest';
import { getBuildsLandingStaticProps, legacyRedirectTarget } from '../../pages/tools/builds.jsx';
import { ALL_CLASS_SLUGS } from '../../pages/tools/builds/[slug].jsx';
import legacyRedirects from '../../data/legacy-build-redirects.json';
import legacyBuilds from '../../data/builds.json';

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

describe('legacyRedirectTarget', () => {
  const map = {
    wizard: { class: 'wizard', builds: { 0: 'aaa111-wizard-afk-50', 3: 'bbb222-wizard-active-70' } }
  };

  it('maps a valid c+b to the exact build page', () => {
    expect(legacyRedirectTarget({ c: 'wizard', b: '3' }, map)).toBe('/tools/builds/bbb222-wizard-active-70');
  });

  it('falls back to the class page when b is missing or unmapped', () => {
    expect(legacyRedirectTarget({ c: 'wizard' }, map)).toBe('/tools/builds/wizard');
    expect(legacyRedirectTarget({ c: 'wizard', b: '99' }, map)).toBe('/tools/builds/wizard');
  });

  it('is case-insensitive on c, matching the old page', () => {
    expect(legacyRedirectTarget({ c: 'Wizard', b: '0' }, map)).toBe('/tools/builds/aaa111-wizard-afk-50');
  });

  it('returns null for unknown classes and ordinary visits', () => {
    expect(legacyRedirectTarget({ c: 'not-a-class' }, map)).toBeNull();
    expect(legacyRedirectTarget({}, map)).toBeNull();
    expect(legacyRedirectTarget({ sort: 'top' }, map)).toBeNull();
  });
});

// The generated map is checked in; these pin it against the routes it points at.
describe('legacy-build-redirects.json integrity', () => {
  it('covers every legacy class and points class fallbacks at real class pages', () => {
    for (const legacyClass of Object.keys(legacyBuilds)) {
      const entry = legacyRedirects[legacyClass.toLowerCase()];
      expect(entry, `missing entry for ${legacyClass}`).toBeTruthy();
      expect(ALL_CLASS_SLUGS, `no class page for ${entry.class}`).toContain(entry.class);
    }
  });

  it('maps every legacy build that has a title, with well-formed build slugs', () => {
    for (const [legacyClass, list] of Object.entries(legacyBuilds)) {
      const entry = legacyRedirects[legacyClass.toLowerCase()];
      list.forEach((build, index) => {
        if (!String(build?.title || '').trim()) return; // placeholder rows fall back to the class page
        const slug = entry.builds[index];
        expect(slug, `${legacyClass}[${index}] "${build.title}" is unmapped`).toBeTruthy();
        expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      });
    }
  });
});
