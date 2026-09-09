import { Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { PAGE_SEO } from '../../data/page-seo';
import { headingOf } from '../../utility/seo-head.mjs';


// PAGE_SEO is keyed by route pattern, so a dynamic route's entry is a fallback for many pages and
// naming any one of them here would be wrong on the rest. /tools/builds/[slug] draws its own
// heading per page - the class name, or the build's title.
const ALREADY_HAS_H1 = new Set([
  '/', '/settings', '/tools/builds/[slug]',
  // Shares its header - and its h1 - with the class pages above. A NavBar title here as well put
  // two h1s on the page and shifted the whole layout when switching between "All" and a class.
  '/tools/builds',
  // Renders the same BuildDetail as the slug route, whose title is the page's h1.
  '/tools/builds/view'
]);

// One size for the page h1 wherever it is drawn, in NavBar or by a page with its own heading.
export const PAGE_H1_SX = { fontSize: 24, fontWeight: 600, m: 0, whiteSpace: 'nowrap' };

const PageTitle = () => {
  const router = useRouter();
  const pathname = router?.pathname;
  if (!pathname || ALREADY_HAS_H1.has(pathname)) return null;

  const seo = PAGE_SEO[pathname];
  if (!seo || seo.noindex) return null;

  const title = headingOf(seo.title);
  if (!title) return null;

  return <Typography component={'h1'} sx={PAGE_H1_SX}>{title}</Typography>;
};

export default PageTitle;
