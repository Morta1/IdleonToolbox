import React, { useContext, useState } from 'react';
import { Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppContext } from '@components/common/context/AppProvider';
import BuildsBrowser, { INITIAL_FILTERS } from '@components/tools/builds/BuildsBrowser';
import BuildView from '@components/tools/builds/BuildView';
import { fetchAllBuildsAtBuildTime, fetchBuildDetailAtBuildTime } from '@utility/builds/static-fetch.mjs';
import {
  buildsForSlug,
  classToSlug,
  slugToClassKey,
  slugToDisplayName
} from '@utility/builds/class-paths.mjs';
import {
  assertNoSlugCollisions,
  buildCrawlLink,
  buildSeoDescription,
  buildSeoTitle,
  buildToSlug,
  classCrawlLink,
  staticIdSet,
  toBuildSummary
} from '@utility/builds/build-pages.mjs';
import { filterAndSortBuilds } from '@utility/builds/filter-builds';
import { CLASS_KEYS, resolveHierarchy } from '@utility/builds/classes';

// One route, two kinds of page: /tools/builds/barbarian browses a class, /tools/builds/<id>-<title>
// is a single build. They share a route because Next's pages router refuses two dynamic siblings
// with different param names, and because it is the right shape anyway - a slug under
// /tools/builds is a page about builds, and which kind is a data question.

// "Idleon Barbarian Builds" leads with the term these pages target - `idleon <class> build` is
// the shape of essentially all class-related search demand.
const classPageTitle = (displayName) => `Idleon ${displayName} Builds | Idleon Toolbox`;

const classPageDescription = (displayName, count) => count
  ? `Browse ${count} community ${displayName} builds for Legends of Idleon — talent trees, gear and progression.`
  : `Community ${displayName} builds for Legends of Idleon — talent trees, gear and progression.`;

// Every class in the game gets a page, including the ones with no builds yet. They are offered by
// the class strip, and with fallback: false anything not listed here is a hard 404 - so generating
// only the classes that happen to have a build means the strip can navigate the user off a cliff.
//
// Empty ones are noindex (see getBuildSlugStaticProps), so they cost nothing in thin content and
// become indexable on their own the moment someone publishes the first build for that class.
export const ALL_CLASS_SLUGS = CLASS_KEYS.map(classToSlug);

// Exported for tests: the data logic, separated from Next's build pipeline.
export function getBuildSlugStaticPaths(builds) {
  const buildSlugs = (builds || []).map(buildToSlug);
  assertNoSlugCollisions(ALL_CLASS_SLUGS, buildSlugs);
  return {
    // fallback MUST be false — output: 'export' does not support true/'blocking'.
    paths: [...ALL_CLASS_SLUGS, ...buildSlugs].map((slug) => ({ params: { slug } })),
    fallback: false
  };
}

// Same-family classes only. Cards already link to the class pages they belong to, but on a class
// page nearly every card is this class - so its siblings would be unreachable without this.
export function siblingSlugs(allSlugs, slug) {
  const family = resolveHierarchy(slugToClassKey(slug)).family;
  return allSlugs.filter(
    (other) => other !== slug && resolveHierarchy(slugToClassKey(other)).family === family
  );
}

export function getBuildSlugStaticProps(builds, slug, detail) {
  const build = (builds || []).find((entry) => buildToSlug(entry) === slug);
  if (build) {
    const summary = toBuildSummary(build);
    return {
      props: {
        kind: 'build',
        slug,
        summary,
        // The talent payload, so the page renders without waiting on a cross-origin fetch.
        // Counters are absent by design - see toStaticBuild. null, not undefined: Next refuses to
        // serialize undefined props.
        initialBuild: detail ?? null,
        // PAGE_SEO is keyed by route pattern, so every page from this route would otherwise
        // share one title. _document prefers these props over the map.
        seoTitle: buildSeoTitle(summary),
        seoDescription: buildSeoDescription(summary),
        seoNoindex: false,
        // A build page's body is empty in the export (see components/common/CrawlLinks.jsx), so
        // without these it is a leaf a crawler can reach but never leave.
        crawlHeading: 'More Idleon builds',
        crawlLinks: [
          classCrawlLink(classToSlug(summary.class), `${summary.class.replace(/_/g, ' ')} builds`),
          ...(summary.subclass
            ? [classCrawlLink(
              classToSlug(summary.subclass),
              `${summary.subclass.replace(/_/g, ' ')} builds`
            )]
            : []),
          { h: '/tools/builds', t: 'All Idleon builds' }
        ]
      }
    };
  }

  const displayName = slugToDisplayName(slug);
  const matching = buildsForSlug(builds, slug);
  return {
    props: {
      kind: 'class',
      slug,
      builds: matching,
      siblings: siblingSlugs(ALL_CLASS_SLUGS, slug),
      family: resolveHierarchy(slugToClassKey(slug)).family,
      seoTitle: classPageTitle(displayName),
      seoDescription: classPageDescription(displayName, matching.length),
      crawlHeading: `Idleon ${displayName} builds`,
      crawlLinks: [
        ...matching.map(buildCrawlLink),
        ...siblingSlugs(ALL_CLASS_SLUGS, slug).map(
          (other) => classCrawlLink(other, `${slugToDisplayName(other)} builds`)
        ),
        { h: '/tools/builds', t: 'All Idleon builds' }
      ],
      // A class nobody has published for has nothing to rank on. Keep it reachable so the strip
      // can't 404, keep it out of the index until it has content.
      seoNoindex: matching.length === 0
    }
  };
}

export async function getStaticPaths() {
  return getBuildSlugStaticPaths(await fetchAllBuildsAtBuildTime());
}

export async function getStaticProps({ params }) {
  const builds = await fetchAllBuildsAtBuildTime();
  // Only this page's build. Fetching the whole set here made every forked worker pull all 121
  // details, including workers that only rendered class pages.
  const build = builds.find((entry) => buildToSlug(entry) === params.slug);
  const detail = build ? await fetchBuildDetailAtBuildTime(build.shortId) : null;
  return getBuildSlugStaticProps(builds, params.slug, detail);
}

const BuildPage = ({ slug, summary, initialBuild, seoTitle, seoDescription }) => (
  <>
    <NextSeo
      title={seoTitle}
      description={seoDescription}
      canonical={`https://idleontoolbox.com/tools/builds/${slug}`}
    />
    <BuildView shortId={summary.shortId} summary={summary} initialBuild={initialBuild}/>
  </>
);

const BuildClassPage = ({
  slug, builds, siblings, family, seoTitle, seoDescription, seoNoindex
}) => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const signedIn = !!state?.signedIn;
  const displayName = slugToDisplayName(slug);

  // The class is the URL, so it is never part of the filter state here.
  const [filters, setFilters] = useState({ ...INITIAL_FILTERS });

  // Every build for this class is already in static props, so searching, tagging and sorting run
  // in memory - no Worker request, nothing to wait for, and the page works with the API down.
  const visible = filterAndSortBuilds(builds, filters);

  const handleNew = () => {
    if (!signedIn) return;
    router.push('/tools/builds/new');
  };

  return (
    <>
      <NextSeo
        title={seoTitle}
        description={seoDescription}
        canonical={`https://idleontoolbox.com/tools/builds/${slug}`}
        noindex={seoNoindex}
      />
      <BuildsBrowser
        title={`Idleon ${displayName} Builds`}
        subtitle={builds.length
          ? `${builds.length} community ${displayName} build${builds.length === 1 ? '' : 's'} for Legends of Idleon.`
          : `No ${displayName} builds have been published yet.`}
        signedIn={signedIn}
        filters={filters}
        onFiltersChange={setFilters}
        builds={visible}
        staticIds={staticIdSet(builds)}
        activeClass={slug}
        onNewBuild={handleNew}
      />

      {siblings?.length > 0 && (
        <Typography variant="body2" sx={{ mt: 4, color: 'rgba(255,255,255,0.55)' }}>
          {`Other ${family} builds: `}
          {siblings.map((other, i) => (
            <React.Fragment key={other}>
              {i > 0 && ' · '}
              <Link href={`/tools/builds/${other}`} data-class-link="" style={{ color: 'inherit' }}>
                {slugToDisplayName(other)}
              </Link>
            </React.Fragment>
          ))}
        </Typography>
      )}
    </>
  );
};

const BuildSlugPage = (props) => (
  props.kind === 'build' ? <BuildPage {...props}/> : <BuildClassPage {...props}/>
);

export default BuildSlugPage;
