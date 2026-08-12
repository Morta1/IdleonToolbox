import { Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { PAGE_SEO } from '../../data/page-seo';


const ALREADY_HAS_H1 = new Set(['/', '/settings']);

const PageTitle = () => {
  const router = useRouter();
  const pathname = router?.pathname;
  if (!pathname || ALREADY_HAS_H1.has(pathname)) return null;

  const seo = PAGE_SEO[pathname];
  if (!seo || seo.noindex) return null;

  const title = seo.title?.replace(/\s*[|\-–—]\s*Idleon Toolbox\s*$/i, '')?.trim();
  if (!title) return null;

  return <Typography
    component={'h1'}
    sx={{ fontSize: 24, fontWeight: 600, m: 0, whiteSpace: 'nowrap' }}>
    {title}
  </Typography>;
};

export default PageTitle;
