import React from 'react';
import { useRouter } from 'next/router';
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Stack } from '@mui/material';
import { LISTED_KINDS } from '@utility/wiki/kinds.mjs';
import { KIND_PLURALS } from './EntityPanel';
import { KIND_ART } from './CategoryTiles';
import WikiSearchBar from './WikiSearchBar';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import { navBarHeight } from '@components/constants';

// Clears the fixed nav bar, the same way ConstructionMain's sticky board does. Pinning at the
// viewport top instead would bury the first rows behind the header.
const RAIL_TOP = navBarHeight + 8;

// The wiki section's frame: search on top of every page, and a left rail of category links the
// way idleon.wiki keeps its categories in reach. Rail is desktop only; below md the tiles and
// back links already cover navigation. Real anchors, so middle-click, copy-link and modified
// clicks all behave; SEO needs nothing from this rail, every wiki page ships its links via
// crawlLinks.
const WikiRail = ({ current, children }) => {
  const router = useRouter();
  const go = (event, href) => {
    // Let the browser handle modified clicks (ctrl/cmd/shift/middle) so they open a new tab or window.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    router.push({ pathname: href, query: sessionQuery(router.query) });
  };

  return <Stack direction={'row'} gap={3} alignItems={'flex-start'}>
    <Box component={'nav'} aria-label={'Wiki categories'} sx={{
      display: { xs: 'none', md: 'block' },
      width: 190,
      flexShrink: 0,
      position: 'sticky',
      top: `${RAIL_TOP}px`,
      // Twelve rows outrun a short viewport once the rail pins, so it scrolls itself rather than
      // stranding the last categories. X stays hidden, which is what the rounded border needs.
      maxHeight: `calc(100vh - ${RAIL_TOP + 16}px)`,
      overflowX: 'hidden',
      overflowY: 'auto',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1
    }}>
      <List dense disablePadding>
        <ListItemButton component={'a'} href={'/wiki'} selected={!current}
                        onClick={(event) => go(event, '/wiki')}>
          <ListItemText primary={'Wiki Home'} slotProps={{ primary: { fontWeight: 600 } }}/>
        </ListItemButton>
        {LISTED_KINDS.map((kind) => <ListItemButton
          key={kind}
          component={'a'}
          href={`/wiki/${kind}`}
          selected={kind === current}
          onClick={(event) => go(event, `/wiki/${kind}`)}>
          <ListItemIcon sx={{ minWidth: 34 }}>
            <img src={`${prefix}${KIND_ART[kind]}`} alt="" width={24} height={24}
                 style={{ objectFit: 'contain' }}/>
          </ListItemIcon>
          <ListItemText primary={KIND_PLURALS[kind] || kind}/>
        </ListItemButton>)}
        {/* Below the divider because it is not a category: it cuts across all of them. */}
        <Divider sx={{ my: 0.5 }}/>
        <ListItemButton component={'a'} href={'/wiki/changelog'} selected={current === 'changelog'}
                        onClick={(event) => go(event, '/wiki/changelog')}>
          <ListItemText primary={'Changelog'}/>
        </ListItemButton>
      </List>
    </Box>
    <Stack sx={{ flexGrow: 1, minWidth: 0 }} gap={3}>
      <WikiSearchBar/>
      <Box>
        {children}
      </Box>
    </Stack>
  </Stack>;
};

export default WikiRail;
