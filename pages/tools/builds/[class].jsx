import React, { useContext, useState } from 'react';
import { Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppContext } from '@components/common/context/AppProvider';
import BuildsBrowser, { INITIAL_FILTERS } from '@components/tools/builds/BuildsBrowser';
import { fetchAllBuildsAtBuildTime } from '@utility/builds/static-fetch.mjs';
import {
  buildsForSlug,
  classToSlug,
  slugToClassKey,
  slugToDisplayName
} from '@utility/builds/class-paths.mjs';
import { filterAndSortBuilds } from '@utility/builds/filter-builds';
import { CLASS_KEYS, resolveHierarchy } from '@utility/builds/classes';

// "Idleon Barbarian Builds" leads with the term these pages target - `idleon <class> build` is
// the shape of essentially all class-related search demand.
const classPageTitle = (displayName) => `Idleon ${displayName} Builds | Idleon Toolbox`;

const classPageDescription = (displayName, count) => count
  ? `Browse ${count} community ${displayName} builds for Legends of Idleon — talent trees, gear and progression.`
  : `Community ${displayName} builds for Legends of Idleon — talent trees, gear and progression.`;

// Every class in the game gets a page, including the four with no builds yet (Siege Breaker,
// Arcane Cultist, Death Bringer, Wind Walker). They are offered by the class picker, and with
// fallback: false anything not listed here is a hard 404 - so generating only the classes that
// happen to have a build means the picker can navigate the user off a cliff.
//
// Empty ones are noindex (see getBuildClassStaticProps), so they cost nothing in thin content
// and become indexable on their own the moment someone publishes the first build for that class.
export const ALL_CLASS_SLUGS = CLASS_KEYS.map(classToSlug);

// Exported for tests: the data logic, separated from Next's build pipeline.
export function getBuildClassStaticPaths() {
  return {
    // fallback MUST be false — output: 'export' does not support true/'blocking'.
    paths: ALL_CLASS_SLUGS.map((slug) => ({ params: { class: slug } })),
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

export function getBuildClassStaticProps(builds, slug) {
  const displayName = slugToDisplayName(slug);
  const matching = buildsForSlug(builds, slug);
  return {
    props: {
      slug,
      builds: matching,
      siblings: siblingSlugs(ALL_CLASS_SLUGS, slug),
      family: resolveHierarchy(slugToClassKey(slug)).family,
      // PAGE_SEO is keyed by route pattern, so all these pages would share one title.
      // _document prefers these over the map for exactly that reason.
      seoTitle: classPageTitle(displayName),
      seoDescription: classPageDescription(displayName, matching.length),
      // A class nobody has published for has nothing to rank on. Keep it reachable so the picker
      // can't 404, keep it out of the index until it has content.
      seoNoindex: matching.length === 0
    }
  };
}

export async function getStaticPaths() {
  return getBuildClassStaticPaths();
}

export async function getStaticProps({ params }) {
  const builds = await fetchAllBuildsAtBuildTime();
  return getBuildClassStaticProps(builds, params.class);
}

const BuildClassPage = ({ slug, builds, siblings, family, seoTitle, seoDescription, seoNoindex }) => {
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
        heading={
          <Typography variant="h2" component="h1" sx={{ fontSize: 28, fontWeight: 700 }}>
            Idleon {displayName} Builds
          </Typography>
        }
        subtitle={builds.length
          ? `${builds.length} community ${displayName} build${builds.length === 1 ? '' : 's'} for Legends of Idleon.`
          : `No ${displayName} builds have been published yet.`}
        signedIn={signedIn}
        filters={filters}
        onFiltersChange={setFilters}
        builds={visible}
        loading={false}
        error=""
        activeClass={slug}
        onClassChange={(next) => router.push(next ? `/tools/builds/${next}` : '/tools/builds')}
        hasMore={false}
        onNewBuild={handleNew}
      />

      {siblings?.length > 0 && (
        <Typography variant="body2" sx={{ mt: 4, color: 'rgba(255,255,255,0.55)' }}>
          {`Other ${family} builds: `}
          {siblings.map((other, i) => (
            <React.Fragment key={other}>
              {i > 0 && ' · '}
              <Link href={`/tools/builds/${other}`} style={{ color: 'inherit' }}>
                {slugToDisplayName(other)}
              </Link>
            </React.Fragment>
          ))}
        </Typography>
      )}
    </>
  );
};

export default BuildClassPage;
