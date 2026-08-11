import { Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { PAGE_SEO } from '../../data/page-seo';

/**
 * The site has exactly one <h1> (the homepage); every other page has none, so the strongest on-page
 * signal of what a page is about is missing everywhere.
 *
 * A visually-hidden h1 was the obvious fix and is the wrong one: Google's systems are, in their own
 * words, "good at recognizing hidden text, good at ignoring it". It is not a penalty - the spam
 * policy carves out screen-reader text explicitly - but it buys no ranking value either. To count,
 * the heading has to be visible.
 *
 * Visible does not have to mean tall. This renders at body-text size INSIDE the existing Pin row,
 * which every account and tools page already draws, so it adds a real heading at zero extra vertical
 * space - the objection that made a hidden h1 tempting in the first place.
 *
 * The text is the page's own <NextSeo> title with the site suffix removed, read from the generated
 * PAGE_SEO map. That keeps the heading and the browser tab title from ever disagreeing, and it is
 * already covered by __test__/page-seo.test.js, which fails if the map drifts from the pages.
 */

// PROTOTYPE: limited to one page on purpose, so the look can be judged before ~105 pages get a
// heading. Rolling out is deleting this set and the check below, nothing else.
const PROTOTYPE_ROUTES = new Set(['/account/world-1/anvil']);

const PageTitle = () => {
  const router = useRouter();
  const pathname = router?.pathname;
  if (!PROTOTYPE_ROUTES.has(pathname)) return null;

  const title = PAGE_SEO[pathname]?.title?.replace(/\s*\|.*$/, '')?.trim();
  if (!title) return null;

  return <Typography
    component={'h1'}
    variant={'body1'}
    sx={{ fontWeight: 600, m: 0, whiteSpace: 'nowrap' }}>
    {title}
  </Typography>;
};

export default PageTitle;
