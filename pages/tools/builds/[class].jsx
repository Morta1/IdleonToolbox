import React, { useContext, useState } from 'react';
import { Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import { AppContext } from '@components/common/context/AppProvider';
import BuildsBrowser, { INITIAL_FILTERS } from '@components/tools/builds/BuildsBrowser';
import { fetchAllBuildsAtBuildTime } from '@utility/builds/static-fetch.mjs';
import {
  buildsForSlug,
  getBuildClassSlugs,
  slugToDisplayName
} from '@utility/builds/class-paths.mjs';
import { filterAndSortBuilds } from '@utility/builds/filter-builds';

// "Idleon Barbarian Builds" leads with the term these pages target - `idleon <class> build` is
// the shape of essentially all class-related search demand.
const classPageTitle = (displayName) => `Idleon ${displayName} Builds | Idleon Toolbox`;

const classPageDescription = (displayName, count) => count
  ? `Browse ${count} community ${displayName} builds for Legends of Idleon — talent trees, gear and progression.`
  : `Community ${displayName} builds for Legends of Idleon — talent trees, gear and progression.`;

// Exported for tests: the data logic, separated from Next's build pipeline.
export function getBuildClassStaticPaths(builds) {
  return {
    // fallback MUST be false — output: 'export' does not support true/'blocking'.
    paths: getBuildClassSlugs(builds).map((slug) => ({ params: { class: slug } })),
    fallback: false
  };
}

export function getBuildClassStaticProps(builds, slug) {
  const displayName = slugToDisplayName(slug);
  const matching = buildsForSlug(builds, slug);
  return {
    props: {
      slug,
      builds: matching,
      allSlugs: getBuildClassSlugs(builds),
      // PAGE_SEO is keyed by route pattern, so all these pages would share one title.
      // _document prefers these over the map for exactly that reason.
      seoTitle: classPageTitle(displayName),
      seoDescription: classPageDescription(displayName, matching.length)
    }
  };
}

export async function getStaticPaths() {
  const builds = await fetchAllBuildsAtBuildTime();
  return getBuildClassStaticPaths(builds);
}

export async function getStaticProps({ params }) {
  const builds = await fetchAllBuildsAtBuildTime();
  return getBuildClassStaticProps(builds, params.class);
}

const BuildClassPage = ({ slug, builds, allSlugs, seoTitle, seoDescription }) => {
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
        classSlugs={allSlugs}
        activeClass={slug}
        onClassChange={(next) => router.push(next ? `/tools/builds/${next}` : '/tools/builds')}
        hasMore={false}
        onNewBuild={handleNew}
      />
    </>
  );
};

export default BuildClassPage;
