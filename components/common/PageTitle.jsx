import { Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { PAGE_SEO } from '../../data/page-seo';
import { headingOf } from '../../utility/seo-head.mjs';
import { PAGE_BY_URL } from '../../utility/pageIndex';


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

// A route's h1 text, or null where the page draws its own, has no SEO entry, or is noindex.
export const titleOf = (pathname) => {
  if (!pathname || ALREADY_HAS_H1.has(pathname)) return null;
  const seo = PAGE_SEO[pathname];
  if (!seo || seo.noindex) return null;
  return PAGE_BY_URL[pathname]?.display ?? (headingOf(seo.title) || null);
};

// The page's one h1 (Foundations: pageTitle, 24 / 36 / 600), here or on the few pages that draw their own.
// One line: the title shares its row with Pin and Add goal, which wrap under it; a long one ends in an ellipsis.
const PageTitle = () => {
  const router = useRouter();
  const title = titleOf(router?.pathname);
  if (!title) return null;
  return <Typography variant={'pageTitle'} component={'h1'} noWrap sx={{ minWidth: 0 }}>{title}</Typography>;
};

export default PageTitle;
