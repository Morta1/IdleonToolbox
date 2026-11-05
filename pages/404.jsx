import { Link, Stack, Typography } from '@mui/material';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import Notice from '@components/common/Notice';

export default function Custom404() {
  const router = useRouter();
  // Empty until the router is ready, so the export and the first render read the same words.
  const { reason, name } = router.query;
  const isProfileNotFound = reason === 'profile' && name;

  return (
    <Stack gap={2} sx={{ mt: 4 }}>
      <NextSeo title="Page Not Found | Idleon Toolbox" noindex={true}/>
      <Typography variant="pageTitle" component="h1">{isProfileNotFound ? 'Profile not found' : 'Page not found'}</Typography>
      <Notice tone={'missing'}>
        {isProfileNotFound
          ? `No profile named "${name}" was found. The player may not have uploaded it yet.`
          : "The page you're looking for doesn't exist or has moved."}
        {' '}<Link component={NextLink} href={'/'}>Back to Home</Link>
      </Notice>
    </Stack>
  );
}
