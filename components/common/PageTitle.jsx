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
const ALREADY_HAS_H1 = new Set(['/']);

const PageTitle = () => {
  const router = useRouter();
  const pathname = router?.pathname;
  if (!pathname || ALREADY_HAS_H1.has(pathname)) return null;

  const seo = PAGE_SEO[pathname];
  // A page Google is told not to index has nothing to gain from a heading it did not ask for.
  if (!seo || seo.noindex) return null;

  const title = seo.title?.replace(/\s*\|.*$/, '')?.trim();
  if (!title) return null;

  // 20px, which is what a section heading (h6) measures - at body size, and then at 18px, this read
  // as SMALLER than the headings beneath it, so the page looked hierarchically upside down even
  // though its outline was correct. 20px still fits inside the row the Pin button already sets the
  // height of, so it stays free.
  //
  // It is deliberately not sized to beat the LARGEST section heading. Those range from 20px to 32px
  // for the same structural role depending on the page, so matching the biggest would mean a ~34px
  // heading that breaks the zero-extra-height property this whole approach exists for. The real
  // inconsistency is in the section headings, and it predates this.
  return <Typography
    component={'h1'}
    sx={{ fontSize: 20, fontWeight: 600, m: 0, whiteSpace: 'nowrap' }}>
    {title}
  </Typography>;
};

export default PageTitle;
