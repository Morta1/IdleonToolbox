import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import Link from 'next/link';
import BuildCard from '@components/tools/builds/BuildCard';
import { fetchAllBuildsAtBuildTime } from '@utility/builds/static-fetch.mjs';
import {
  buildsForSlug,
  getBuildClassSlugs,
  slugToDisplayName
} from '@utility/builds/class-paths.mjs';

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
      // PAGE_SEO is keyed by route pattern, so all 18 of these pages would share one title.
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
  const displayName = slugToDisplayName(slug);
  // Same strings _document already emitted into the static HTML; NextSeo re-applies them after
  // hydration so a client-side route change keeps the right ones.
  return (
    <>
      <NextSeo
        title={seoTitle}
        description={seoDescription}
        canonical={`https://idleontoolbox.com/tools/builds/${slug}`}
      />

      <Stack gap={2} sx={{ mt: 2 }}>
        <Typography variant="h2" component="h1" sx={{ fontSize: 28 }}>
          Idleon {displayName} Builds
        </Typography>

        <Typography variant="body1" color="text.secondary">
          {builds.length
            ? `${builds.length} community ${displayName} build${builds.length === 1 ? '' : 's'} for Legends of Idleon.`
            : `No ${displayName} builds have been published yet.`}
        </Typography>

        {/* Internal links so crawlers reach every class page from any other. */}
        <Stack direction="row" gap={1} flexWrap="wrap">
          {(allSlugs || [])
            .filter((s) => s !== slug)
            .map((s) => (
              <Link key={s} href={`/tools/builds/${s}`}>
                {slugToDisplayName(s)} builds
              </Link>
            ))}
          <Link href="/tools/builds">All builds</Link>
        </Stack>

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {builds.map((build) => (
            <BuildCard key={build.shortId} build={build}/>
          ))}
        </Box>
      </Stack>
    </>
  );
};

export default BuildClassPage;
