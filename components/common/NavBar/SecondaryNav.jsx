import React, { useContext } from 'react';
import { Box, Breadcrumbs, Link as MuiLink, Stack, Typography, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/router';
import { Adsense } from '@ctrl/react-adsense';
import { isProd, shouldDisplayDrawer } from '@utility/helpers';
import { drawerWidth, drawerWidthCollapsed, secondaryNavHeight, navBarHeight } from '../../constants';
import { AppContext } from '../context/AppProvider';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Link from 'next/link';
import { LEADERBOARD_AD_HEIGHT } from '@utility/consts';

const SecondaryNav = () => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const showLeaderboardAd = useMediaQuery('(min-width: 900px)', { noSsr: true });
  const displayDrawer = shouldDisplayDrawer(router?.pathname);
  const isCollapsed = state?.drawerCollapsed ?? false;
  const currentDrawerWidth = isCollapsed ? drawerWidthCollapsed : drawerWidth;

  // Don't show on mobile
  if (isXs) return null;

  // Generate breadcrumb items from the current path
  const pathSegments = router.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = segment.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    const isLast = index === pathSegments.length - 1;
    
    return { path, label, isLast };
  });

  // Determine if we should show breadcrumbs or just the ad
  const showBreadcrumbs = pathSegments.length > 1 && displayDrawer;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: navBarHeight,
        left: { xs: 0, lg: displayDrawer ? currentDrawerWidth : 0 },
        right: 0,
        height: secondaryNavHeight,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        transition: 'left 0.2s ease-in-out'
      }}
    >
      {/* Left side: Breadcrumbs */}
      <Box sx={{ flex: '0 0 auto', minWidth: 0 }}>
        {showBreadcrumbs && (
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ 
              '& .MuiBreadcrumbs-separator': { mx: 1 }
            }}
          >
            <Link href="/" passHref legacyBehavior>
              <MuiLink 
                underline="hover" 
                color="text.secondary"
                sx={{ fontSize: 14 }}
              >
                Home
              </MuiLink>
            </Link>
            {breadcrumbs.map(({ path, label, isLast }) => (
              isLast ? (
                <Typography 
                  key={path} 
                  color="text.primary" 
                  sx={{ fontSize: 14, fontWeight: 500 }}
                >
                  {label}
                </Typography>
              ) : (
                <Link key={path} href={path} passHref legacyBehavior>
                  <MuiLink 
                    underline="hover" 
                    color="text.secondary"
                    sx={{ fontSize: 14 }}
                  >
                    {label}
                  </MuiLink>
                </Link>
              )
            ))}
          </Breadcrumbs>
        )}
      </Box>

      {/* Right side: Leaderboard Ad */}
      {showLeaderboardAd && (
        <Box
          sx={{
            flex: '0 0 auto',
            width: 728,
            height: LEADERBOARD_AD_HEIGHT,
            maxHeight: LEADERBOARD_AD_HEIGHT,
            backgroundColor: isProd ? 'transparent' : 'rgba(215, 51, 51, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isProd ? (
            <Adsense
              client="ca-pub-1842647313167572"
              slot="9283746152"
              style={{
                display: 'block',
                width: 728,
                height: LEADERBOARD_AD_HEIGHT
              }}
              format=""
              responsive="false"
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              Leaderboard Ad (728x90)
            </Typography>
          )}
        </Box>
      )}

      {/* Fallback: Smaller ad for medium screens */}
      {!showLeaderboardAd && isMd && (
        <Box
          sx={{
            flex: '0 0 auto',
            width: 468,
            height: 60,
            backgroundColor: isProd ? 'transparent' : 'rgba(215, 51, 51, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isProd ? (
            <Adsense
              client="ca-pub-1842647313167572"
              slot="3847561029"
              style={{
                display: 'block',
                width: 468,
                height: 60
              }}
              format=""
              responsive="false"
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              Banner Ad (468x60)
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SecondaryNav;
