import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import Link from 'next/link';
import BuildCard from '@components/tools/builds/BuildCard';
import { fetchAllBuildsAtBuildTime } from '@utility/builds/static-fetch.mjs';
import {
  BUILD_FAMILIES,
  buildsForSlug,
  classToSlug,
  getBuildClassSlugs,
  slugToDisplayName
} from '@utility/builds/class-paths.mjs';

// Exported for tests: the data logic, separated from Next's build pipeline.
export function getBuildClassStaticPaths(builds) {
  return {
    // fallback MUST be false — output: 'export' does not support true/'blocking'.
    paths: getBuildClassSlugs(builds).map((slug) => ({ params: { class: slug } })),
    fallback: false
  };
}

export function getBuildClassStaticProps(builds, slug) {
  return {
    props: {
      slug,
      displayName: slugToDisplayName(slug),
      builds: buildsForSlug(builds, slug)
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

const BuildClassPage = ({ slug, displayName, builds }) => {
  const title = `Idleon ${displayName} Builds | Idleon Toolbox`;
  const description = builds.length
    ? `Browse ${builds.length} community ${displayName} builds for Legends of Idleon — talent trees, gear and progression.`
    : `Community ${displayName} builds for Legends of Idleon — talent trees, gear and progression.`;

  return (
    <>
      <NextSeo
        title={title}
        description={description}
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
          {BUILD_FAMILIES.map((family) => (
            <Link key={family} href={`/tools/builds/${classToSlug(family)}`}>
              {family} builds
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
