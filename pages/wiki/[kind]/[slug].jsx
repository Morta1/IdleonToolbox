import React from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import { NextSeo } from 'next-seo';
import EntityPanel from '@components/wiki/EntityPanel';
import WikiRail from '@components/wiki/WikiRail';
import { pageIndex } from '@utility/wiki/page-graph';
import { sessionQuery } from '@utility/nav-query';

// One page per entity. The whole point of the route: 3,466 entities used to share /wiki and one
// title, and a shared URL cannot be linked to, ranked or sitemapped separately.
const WikiEntity = ({ slice, seoTitle, seoDescription }) => {
  const router = useRouter();
  // No graph download here: everything this page renders came from static props one hop away.
  const index = pageIndex(slice);

  const go = (href) => router.push({ pathname: href, query: sessionQuery(router.query) });

  return <WikiRail current={slice.node?.kind}>
    <Box sx={{ maxWidth: 1200 }}>
      <NextSeo title={seoTitle} description={seoDescription}/>
      <EntityPanel
        index={index}
        id={slice.id}
        hrefFor={(id) => {
          const node = index.byId[id];
          return node?.slug ? `/wiki/${node.kind}/${node.slug}` : null;
        }}
        onNavigate={(id) => {
          const node = index.byId[id];
          if (node?.slug) go(`/wiki/${node.kind}/${node.slug}`);
        }}
        onBack={() => go('/wiki')}
        onBrowseKind={(kind) => go(`/wiki/${kind}`)}
      />
    </Box>
  </WikiRail>;
};

export const getStaticPaths = async () => {
  const { staticGraph } = await import('@utility/wiki/static-graph.mjs');
  const { graph } = staticGraph();
  const paths = Object.values(graph.nodes)
    .filter((node) => node.navigable !== false && node.slug)
    .map((node) => ({ params: { kind: node.kind, slug: node.slug } }));
  // A static export has no fallback to fall back to: every page has to exist at build time.
  return { paths, fallback: false };
};

export const getStaticProps = async ({ params }) => {
  const { staticGraph, staticNeighbourhood } = await import('@utility/wiki/static-graph.mjs');
  const { entityTitle, entityDescription } = await import('@utility/wiki/seo');
  const { bySlug } = staticGraph();

  const id = bySlug.get(`${params.kind}/${params.slug}`);
  if (!id) return { notFound: true };

  const slice = staticNeighbourhood(id);

  // Nothing below <WaitForRouter> reaches the export, so this list is the only trace of the page's
  // links in the served HTML. Without it every entity page is a dead end to a crawler and the
  // 3,466 URLs have no paths between them.
  const crawlLinks = [...new Set(slice.edges.flatMap((edge) => [edge.from, edge.to]))]
    .filter((other) => other !== id)
    .map((other) => slice.nodes[other])
    .filter((node) => node?.slug && node.navigable !== false)
    .map((node) => ({ h: `/wiki/${node.kind}/${node.slug}`, t: (node.name || node.rawName).replace(/_/g, ' ') }));

  return {
    props: {
      slice,
      seoTitle: entityTitle(slice.node),
      seoDescription: entityDescription(slice.node, slice.edges, id),
      crawlLinks,
      crawlHeading: `${(slice.node.name || slice.node.rawName).replace(/_/g, ' ')} links`
    }
  };
};

export default WikiEntity;
