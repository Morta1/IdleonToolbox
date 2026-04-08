import { Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { NextLinkComposed } from '@components/common/NextLinkComposed';
import HomeIcon from '@mui/icons-material/Home';
import { useRouter } from 'next/router';

export default function Custom404() {
  const router = useRouter();
  const { reason, name } = router.query;
  const isProfileNotFound = reason === 'profile' && name;

  return (
    <Stack alignItems="center" justifyContent="center" gap={2} sx={{ mt: 10 }}>
      <Typography variant="h2" component="h1">404</Typography>
      <Typography variant="h5" color="text.secondary">
        {isProfileNotFound ? 'Profile Not Found' : 'Page Not Found'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {isProfileNotFound
          ? `The profile "${name}" could not be found. The player may not have uploaded their profile yet.`
          : "The page you're looking for doesn't exist or has been moved."}
      </Typography>
      <Button
        variant="contained"
        component={NextLinkComposed}
        to={{ pathname: '/' }}
        startIcon={<HomeIcon />}
      >
        Back to Home
      </Button>
    </Stack>
  );
}
