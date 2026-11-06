import { useState } from 'react';
import { Box, Button, ButtonBase, Link, Stack, TextField, Typography } from '@mui/material';
import { IconSearch } from '@tabler/icons-react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import GameIcon from '@components/common/GameIcon';
import { PHONE_SIDES } from '@components/common/NavBar/frame';
import { NextLinkComposed } from '@components/common/NextLinkComposed';
import { Kbd, openQuickSearch } from '@components/common/QuickSearch';
import { profilePath } from '@components/leaderboards/format';
import { ON_ART } from '@utility/colorSets';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';

const PLACES = {
  dashboard: { label: 'Dashboard', pathname: '/dashboard', icon: 'data/GalleryBell.png' },
  wiki: { label: 'Wiki', pathname: '/wiki', icon: 'data/TalentBook1.png' },
  home: { label: 'Home', pathname: '/', icon: 'data/Coins5.png' },
  leaderboards: { label: 'Leaderboards', pathname: '/leaderboards', icon: 'etc/Crown.png' }
};

// Baked by tools/bake-404-art.mjs at twice this size. A narrow window shows the part around focus (0 is the left end, 1
// the right), bled off the window's sides, rather than shrink the sprites past reading.
const SCENE_MIN = 720;
const OFF_THE_MAP = {
  src: `${prefix}etc/LostOffTheMap.png`, width: 1200, height: 460, focus: 1,
  alt: 'A lost player and a corgi where the map breaks off, under a wooden 404 sign'
};
const MISSING_PROFILE = {
  src: `${prefix}etc/LostProfile.png`, width: 1200, height: 360, focus: 0.71,
  alt: 'A telescope on a frozen shore, aimed at the shadow of a player who is not there'
};
// main's top padding: the sign's chain hangs from the bar.
const Scene = ({ scene: { src, width, height, focus, alt }, children }) => <Box sx={{ mt: -3, mx: -3, [PHONE_SIDES]: { mx: -2 }, overflow: 'hidden' }}>
  <Box sx={{ maxWidth: width, mx: 'auto' }}>
    <Box sx={{ position: 'relative', width: `max(${SCENE_MIN}px, 100%)`, ml: `calc((100% - max(${SCENE_MIN}px, 100%)) * ${focus})` }}>
      <img src={src} width={width} height={height} alt={alt} style={{ display: 'block', width: '100%', height: 'auto' }}/>
      {children}
    </Box>
  </Box>
</Box>;

const Message = ({ title, lead, children }) => <Stack alignItems="center" sx={{ width: 640, maxWidth: '100%', mx: 'auto', mt: '18px', textAlign: 'center' }}>
  <Typography variant="pageTitle" component="h1" sx={{ fontSize: 32, lineHeight: '40px', overflowWrap: 'anywhere', [PHONE_SIDES]: { fontSize: 26, lineHeight: '32px' } }}>
    {title}
  </Typography>
  <Typography color="text.secondary" sx={{ mt: '6px', mb: '20px', overflowWrap: 'anywhere', [PHONE_SIDES]: { mt: '4px', mb: '14px', fontSize: 14, lineHeight: '20px' } }}>
    {lead}
  </Typography>
  {children}
</Stack>;

const Ways = ({ places, query }) => <Stack direction="row" justifyContent="center" gap={1.5}
                                           sx={{ width: '100%', mt: 2, [PHONE_SIDES]: { flexDirection: 'column', gap: 1, mt: 1.5 } }}>
  {places.map(({ label, pathname, icon }) => <ButtonBase key={pathname} component={NextLinkComposed} to={{ pathname, query }}
                                                         sx={{
                                                           justifyContent: 'flex-start', gap: '10px', height: 48, pl: 1.5, pr: '18px',
                                                           border: 1, borderColor: 'divider', borderRadius: '8px', bgcolor: 'background.paper',
                                                           fontSize: 14, fontWeight: 500, '&:hover': { borderColor: 'outline' },
                                                           [PHONE_SIDES]: { height: 44 }
                                                         }}>
    <GameIcon src={icon} size={24} alt=""/>
    {label}
  </ButtonBase>)}
</Stack>;

const SearchField = () => <ButtonBase onClick={openQuickSearch} aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K"
                                      sx={{
                                        justifyContent: 'flex-start', gap: '10px', width: '100%', height: 48, px: '14px', fontSize: 16,
                                        color: 'text.muted', border: 1, borderColor: 'outline', borderRadius: '4px',
                                        bgcolor: 'background.paper', '&:hover': { borderColor: 'text.primary' }
                                      }}>
  <IconSearch size={20} color={'var(--mui-palette-text-secondary)'} aria-hidden/>
  <Box component="span" sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>Search pages, items and monsters</Box>
  <Stack aria-hidden direction="row" gap={1.25} sx={{ [PHONE_SIDES]: { display: 'none' } }}>
    <Kbd>Ctrl</Kbd>
    <Kbd>K</Kbd>
  </Stack>
</ButtonBase>;

const LookUpPlayer = () => {
  const [wanted, setWanted] = useState('');
  // A full load, not a route change: the app reads ?profile= once, as it starts.
  const lookUp = (event) => {
    event.preventDefault();
    if (wanted.trim()) window.location.assign(profilePath(wanted.trim()));
  };
  return <Stack component="form" onSubmit={lookUp} direction="row" gap={1} sx={{ width: '100%' }}>
    <TextField fullWidth value={wanted} onChange={(event) => setWanted(event.target.value)} placeholder="Look up another player"
               sx={{
                 '& .MuiOutlinedInput-root': { minHeight: 48, fontSize: 16, bgcolor: 'background.paper' },
                 '& input::placeholder': { color: 'text.muted', opacity: 1 }
               }}
               slotProps={{
                 htmlInput: { 'aria-label': 'Look up another player' },
                 input: { startAdornment: <IconSearch size={20} color={'var(--mui-palette-text-secondary)'} style={{ flexShrink: 0, marginRight: 10 }} aria-hidden/> }
               }}/>
    <Button type="submit" variant="contained" sx={{ flexShrink: 0, minHeight: 48, px: '22px', [PHONE_SIDES]: { px: '14px' } }}>Look up</Button>
  </Stack>;
};

const Help = ({ title, children }) => <Box sx={{ p: '10px 14px', border: 1, borderColor: 'divider', borderRadius: '8px', bgcolor: 'background.paper' }}>
  <Typography component="h2" variant="body2" sx={{ fontWeight: 500 }}>{title}</Typography>
  <Typography variant="body2" color="text.secondary">{children}</Typography>
</Box>;

const MissingProfile = ({ name, query }) => <>
  <Scene scene={MISSING_PROFILE}>
    <Box data-on-art sx={{
      position: 'absolute', left: '77.8%', top: '60%', transform: 'translateX(-50%)', px: 1, color: ON_ART.text, fontSize: 18, lineHeight: '24px',
      fontWeight: 700, whiteSpace: 'nowrap', textShadow: `0 0 3px ${ON_ART.outline}, 0 1px 2px ${ON_ART.outline}, 0 0 1px ${ON_ART.outline}`,
      [PHONE_SIDES]: { fontSize: 15, lineHeight: '20px' }
    }}>{name}</Box>
  </Scene>
  <Message title={`No sign of ${name}`} lead={`No profile named "${name}" was found. The player may not have uploaded it yet.`}>
    <LookUpPlayer/>
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, width: '100%', mt: '14px', textAlign: 'left', [PHONE_SIDES]: { gridTemplateColumns: '1fr', gap: 1, mt: 1.25 } }}>
      <Help title="Check the name">A profile goes by the player&apos;s first character, not any other.</Help>
      <Help title="Is it yours?">Sign in, then upload it from <Link component={NextLink} href={{ pathname: '/settings', query }}>Settings</Link>.</Help>
    </Box>
    <Ways places={[PLACES.leaderboards, PLACES.dashboard, PLACES.home]} query={query}/>
  </Message>
</>;

const OffTheMap = ({ query }) => <>
  <Scene scene={OFF_THE_MAP}/>
  <Message title="You wandered off the map" lead="This page doesn't exist or has moved. Nothing to farm out here.">
    <SearchField/>
    <Ways places={[PLACES.dashboard, PLACES.wiki, PLACES.home]} query={query}/>
  </Message>
</>;

export default function Custom404() {
  const router = useRouter();
  // Empty until the router is ready, so the export and the first render read the same words.
  const { reason, name } = router.query;
  const query = sessionQuery(router.query);

  return <>
    <NextSeo title="Page Not Found | Idleon Toolbox" noindex={true}/>
    {reason === 'profile' && name ? <MissingProfile name={name} query={query}/> : <OffTheMap query={query}/>}
  </>;
}
