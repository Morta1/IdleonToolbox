import { Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { PAGE_SEO } from '../../data/page-seo';

/**
 * The site had exactly one <h1> (the homepage); every other page had none, so the strongest on-page
 * signal of what a page is about was missing everywhere.
 *
 * A visually-hidden h1 was the obvious fix and is the wrong one: Google's systems are, in their own
 * words, "good at recognizing hidden text, good at ignoring it". It is not a penalty - the spam
 * policy carves out screen-reader text explicitly - but it buys no ranking value either. To count,
 * the heading has to be visible.
 *
 * Visible does not have to mean tall. This renders INSIDE the existing Pin row, which every account
 * and tools page already draws, so it adds a real heading at zero extra vertical space - the
 * objection that made a hidden h1 tempting in the first place. Pages with no Pin row get the same
 * row drawn for the heading alone.
 *
 * The text is the page's own <NextSeo> title with the site suffix removed, read from the generated
 * PAGE_SEO map. That keeps the heading and the browser tab title from ever disagreeing, and it is
 * already covered by __test__/page-seo.test.js, which fails if the map drifts from the pages.
 */

// Routes that already render their own h1. A second one on the same page is worse than none - it
// splits the signal instead of strengthening it.
const ALREADY_HAS_H1 = new Set(['/', '/settings']);

const PageTitle = () => {
  const router = useRouter();
  const pathname = router?.pathname;
  if (!pathname || ALREADY_HAS_H1.has(pathname)) return null;

  const seo = PAGE_SEO[pathname];
  // A page Google is told not to index has nothing to gain from a heading it did not ask for.
  if (!seo || seo.noindex) return null;

  // Anchored on the site name rather than on a separator. Matching a bare "|" was enough until
  // /settings turned out to be written "Settings - Idleon Toolbox", which rendered the suffix as
  // part of the visible heading. Anchoring here means a title containing an incidental dash keeps
  // it, and a page that picks yet another separator still gets a clean heading.
  const title = seo.title?.replace(/\s*[|\-–—]\s*Idleon Toolbox\s*$/i, '')?.trim();
  if (!title) return null;

  // 24px. At body size, and then at 18px and 20px, this read as SMALLER than the headings beneath
  // it, so the page looked hierarchically upside down even though its outline was correct.
  //
  // 24px clears MUI's h6 (20px) and matches its h5 (24px), which together are the great majority of
  // section headings here. It still costs nothing vertically: measured on the anvil page the heading
  // is 36px tall inside a row the Pin button already holds open at 37px, so the row does not grow -
  // which is the property that made an inline heading worth doing rather than a hidden one.
  //
  // A handful of sections still use h4 (32px) and so remain larger than this. Sizing up to beat them
  // would mean a ~34px heading, which does grow the row. Those sections are the outliers, not this.
  return <Typography
    component={'h1'}
    sx={{ fontSize: 24, fontWeight: 600, m: 0, whiteSpace: 'nowrap' }}>
    {title}
  </Typography>;
};

export default PageTitle;
