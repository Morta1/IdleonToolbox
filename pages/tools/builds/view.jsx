import React from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import BuildView from '@components/tools/builds/BuildView';
import { fetchAllBuildsAtBuildTime } from '@utility/builds/static-fetch.mjs';
import {
  buildSeoDescription,
  buildSeoTitle,
  buildStaticHref,
  findInManifest,
  toBuildSummary
} from '@utility/builds/build-pages.mjs';

// One URL serving every build. Each build in the manifest also has its own static page, so this
// route exists for the builds that don't: anything published since the last deploy, which
// fallback: false would otherwise 404. Links elsewhere in the app prefer the static path.

export async function getStaticProps() {
  const builds = await fetchAllBuildsAtBuildTime();
  return {
    props: {
      manifest: builds.map(toBuildSummary),
      // One URL serving 121 builds, every one of which has its own page. The canonical below
      // would say so, but <NextSeo> renders under the <WaitForRouter> gate and never runs during
      // the export - so in the served HTML this would be an indexable duplicate of every build
      // page, defended by nothing. noindex ships statically from _app (see seoNoindex there),
      // which is the mechanism that actually reaches a crawler.
      seoNoindex: true
    }
  };
}

const ViewBuild = ({ manifest }) => {
  const router = useRouter();
  const shortId = router.query?.id;
  // Resolves synchronously on first render for any build present at build time.
  const summary = findInManifest(manifest, shortId);

  return (
    <>
      <NextSeo
        title={buildSeoTitle(summary)}
        description={buildSeoDescription(summary)}
        // Must repeat the seoNoindex above: next-seo emits a robots tag either way, and it
        // replaces _app's by meta-name dedupe on hydration. Without this the page ships
        // noindex and then un-noindexes itself as soon as JS runs.
        noindex
        // Two URLs serving one build splits its ranking signals, so this one defers to the
        // static page whenever there is one to defer to.
        canonical={summary ? `https://idleontoolbox.com${buildStaticHref(summary)}` : undefined}
      />
      <BuildView shortId={shortId} summary={summary}/>
    </>
  );
};

export default ViewBuild;
